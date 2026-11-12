#!/usr/bin/env python3
"""Post one library product to the Telegram channel (cover photo + caption + buttons).

Standard library only. Products come from books/*.html (the Product JSON-LD in each page),
so the channel always matches the site. The product is picked by a fixed rotation (no state
file): POSTS_PER_DAY slots per day walk through every product before repeating.

Environment (GitHub Actions secrets):
  TG_BOT_TOKEN   bot token from @BotFather (never print or commit it)
  TG_CHANNEL     @channel_username or the numeric chat id (-100...)

Usage:
  python3 scripts/post_to_telegram.py                # post the current slot's product
  python3 scripts/post_to_telegram.py --dry-run      # print the message, send nothing
  python3 scripts/post_to_telegram.py --preview 14   # show the next 14 slots' products
"""
import argparse
import datetime as dt
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://aboudiiii.github.io"
BOT_URL = "https://t.me/SmartZaki_Bot"
POSTS_PER_DAY = 2          # keep in sync with the cron lines in telegram-post.yml
SPLIT_UTC_HOUR = 10        # runs before 10:00 UTC are slot 0, later runs slot 1

CATEGORIES = (  # (slug regex, emoji, label, hashtags)
    (r"coloring", "🎨", "كتاب تلوين", "#كتب_تلوين #تلوين_للكبار"),
    (r"novel", "📖", "رواية", "#روايات #رواية_عربية"),
    (r"learn-|programming", "💻", "كتاب برمجة", "#تعلم_البرمجة #برمجة"),
    (r"tracker", "🤲", "متتبع", "#متتبع_الصلوات #عادات_يومية"),
    (r"planner", "📅", "مخطط", "#تنظيم_الوقت #مخطط_دراسي"),
    (r"cv-", "📄", "قوالب", "#سيرة_ذاتية #قوالب_Word"),
)
DEFAULT_CAT = ("📚", "منتج رقمي", "#كتب_عربية")
BASE_TAGS = "#مكتبة_الحيالي_الرقمية"


def load_products():
    products = []
    for page in sorted((ROOT / "books").glob("*.html")):
        src = page.read_text(encoding="utf-8")
        data = None
        for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', src, re.S):
            try:
                obj = json.loads(raw)
            except ValueError:
                continue
            if isinstance(obj, dict) and obj.get("@type") == "Product":
                data = obj
                break
        if not data:
            continue
        slug = page.stem
        desc = data.get("description", "")
        # The library sells digital files only: drop any sentence that talks about printing.
        sentences = [s.strip() for s in re.split(r"(?<=[.!؟])\s+", desc) if s.strip()]
        sentences = [s for s in sentences if "طباعة" not in s and "الطباعة" not in s]
        products.append({
            "slug": slug,
            "name": data.get("name", slug),
            "desc": " ".join(sentences),
            "image": data.get("image", ""),
            "url": data.get("url") or f"{SITE}/books/{slug}.html",
        })
    return products


def category_for(slug):
    for pattern, emoji, label, tags in CATEGORIES:
        if re.search(pattern, slug):
            return emoji, label, tags
    return DEFAULT_CAT


def current_slot(now):
    return 0 if now.hour < SPLIT_UTC_HOUR else 1


def pick(products, day, slot):
    return products[(day.toordinal() * POSTS_PER_DAY + slot) % len(products)]


def build_caption(p):
    emoji, _label, tags = category_for(p["slug"])
    desc = p["desc"].strip()
    if len(desc) > 420:
        desc = desc[:417].rstrip() + "…"
    parts = [f"{emoji} <b>{html.escape(p['name'])}</b>"]
    if desc:
        parts.append(html.escape(desc))
    parts.append("✅ ملف رقمي يصلك مباشرة على تيليجرام بعد الطلب")
    parts.append(f"{BASE_TAGS} {tags}")
    caption = "\n\n".join(parts)
    return caption


def keyboard(p):
    return {"inline_keyboard": [
        [{"text": "🛒 اطلب من البوت", "url": BOT_URL}],
        [{"text": "🌐 صفحة المنتج", "url": p["url"]}],
    ]}


def tg_call(token, method, payload):
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/{method}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        try:
            return json.load(e)
        except ValueError:
            return {"ok": False, "description": f"HTTP {e.code}"}


def send(token, chat, p):
    caption = build_caption(p)
    markup = keyboard(p)
    for attempt in range(2):
        res = tg_call(token, "sendPhoto", {
            "chat_id": chat, "photo": p["image"], "caption": caption,
            "parse_mode": "HTML", "reply_markup": markup,
        })
        if res.get("ok"):
            return True
        retry = (res.get("parameters") or {}).get("retry_after")
        if retry and attempt == 0:
            time.sleep(min(int(retry), 30))
            continue
        break
    print(f"sendPhoto failed: {res.get('description')}; falling back to text", file=sys.stderr)
    res = tg_call(token, "sendMessage", {
        "chat_id": chat, "text": caption, "parse_mode": "HTML",
        "reply_markup": markup, "disable_web_page_preview": False,
    })
    if not res.get("ok"):
        print(f"sendMessage failed: {res.get('description')}", file=sys.stderr)
    return bool(res.get("ok"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="print the post, do not send")
    ap.add_argument("--preview", type=int, metavar="N", help="list the next N slots")
    ap.add_argument("--slot", type=int, choices=range(POSTS_PER_DAY), help="override the slot")
    args = ap.parse_args()

    products = load_products()
    if not products:
        sys.exit("No products found in books/*.html")

    now = dt.datetime.now(dt.timezone.utc)
    if args.preview:
        day, slot = now.date(), current_slot(now)
        for _ in range(args.preview):
            print(f"{day} slot {slot}: {pick(products, day, slot)['slug']}")
            slot += 1
            if slot == POSTS_PER_DAY:
                slot, day = 0, day + dt.timedelta(days=1)
        return

    slot = args.slot if args.slot is not None else current_slot(now)
    p = pick(products, now.date(), slot)
    if args.dry_run:
        print(f"[dry run] {p['slug']} (slot {slot})\nphoto: {p['image']}\nbuttons: {BOT_URL} | {p['url']}\n")
        print(re.sub(r"<[^>]+>", "", html.unescape(build_caption(p))))
        return

    token, chat = os.environ.get("TG_BOT_TOKEN"), os.environ.get("TG_CHANNEL")
    if not token or not chat:
        sys.exit("TG_BOT_TOKEN and TG_CHANNEL must be set (GitHub Actions secrets)")
    if not send(token, chat, p):
        sys.exit(1)
    print(f"Posted: {p['slug']} (slot {slot})")


if __name__ == "__main__":
    main()
