#!/usr/bin/env python3
"""Upload inspected ShopBot assets to private Cloudflare R2.

Usage: python upload_shop_assets.py products.zip covers.zip
Requires Python 3, Node/npm, Wrangler authenticated to the correct Cloudflare account.
"""
from pathlib import Path
import mimetypes, subprocess, sys, tempfile, zipfile

BUCKET = "hayali-shop-files"
EXPECTED = {
    "products/Islamic_Patterns_Coloring_Book_Digital_A4.pdf",
    "products/Islamic_Patterns_Coloring_Book_Digital_Letter.pdf",
    "products/Kids_Nature_Coloring_Book_Digital_A4.pdf",
    "products/Kids_Nature_Coloring_Book_Digital_Letter.pdf",
    "products/Pack_Mandala_A4.pdf", "products/Pack_Mandala_Letter.pdf",
    "products/Pack_Mosques_A4.pdf", "products/Pack_Mosques_Letter.pdf",
    "products/Pack_Floral_A4.pdf", "products/Pack_Floral_Letter.pdf",
    "products/Pack_Stars_A4.pdf", "products/Pack_Stars_Letter.pdf",
    "products/Study_Planner_A4.pdf", "products/Study_Planner_Letter.pdf",
    "products/CV_Templates_A4.docx", "products/CV_Templates_Letter.docx",
    "products/Fun_Learning_Book_Kids_A4.pdf", "products/Fun_Learning_Book_Kids_Letter.pdf",
    "products/Prayer_Habit_Tracker_A4.pdf", "products/Prayer_Habit_Tracker_Letter.pdf",
    "products/Echo_City_Novel.pdf", "products/Three_Mirrors_Novel.pdf",
    "products/Learn_Python_Book_A4.pdf", "products/Learn_Java_Book_A4.pdf",
    "products/Learn_JavaScript_Book_A4.pdf", "products/Learn_Cpp_Book_A4.pdf",
}
SAMPLES = {
    "products/Free_Sample_A4.pdf", "products/Free_Sample_Letter.pdf",
    "products/Echo_City_Free_Sample.pdf", "products/Three_Mirrors_Free_Sample.pdf",
}
COVERS = {
    "covers/i_cover.jpg", "covers/k_cover.jpg", "covers/mandala_cover.jpg",
    "covers/mosques_cover.jpg", "covers/floral_cover.jpg", "covers/stars_cover.jpg",
    "covers/planner_cover.jpg", "covers/cv_cover.jpg", "covers/learn_cover.jpg",
    "covers/tracker_cover.jpg", "covers/novel_cover.jpg", "covers/mirrors_cover.jpg",
    "covers/python_cover.jpg", "covers/java_cover.jpg", "covers/js_cover.jpg",
    "covers/cpp_cover.jpg",
}

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python upload_shop_assets.py products.zip covers.zip")
    archives = [Path(x).expanduser().resolve() for x in sys.argv[1:]]
    if not all(p.is_file() for p in archives):
        raise SystemExit("Both ZIP files must exist.")
    with tempfile.TemporaryDirectory(prefix="shopbot-r2-") as td:
        root, found = Path(td), set()
        for archive in archives:
            with zipfile.ZipFile(archive) as z:
                bad = z.testzip()
                if bad:
                    raise SystemExit(f"Corrupt ZIP member: {bad}")
                for info in z.infolist():
                    if info.is_dir() or info.filename.endswith(".bak"):
                        continue
                    name = Path(info.filename).as_posix()
                    dest = root / name
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    with z.open(info) as src, dest.open("wb") as out:
                        out.write(src.read())
                    found.add(name)
        required = EXPECTED | SAMPLES | COVERS
        missing, extra = required - found, found - required
        if missing or extra:
            if missing: print("Missing files:\n  " + "\n  ".join(sorted(missing)), file=sys.stderr)
            if extra: print("Unexpected files:\n  " + "\n  ".join(sorted(extra)), file=sys.stderr)
            raise SystemExit("Asset inventory mismatch; no upload performed.")
        files = sorted(required)
        print(f"Validated {len(files)} assets. Uploading privately to R2 bucket {BUCKET}...")
        for i, rel in enumerate(files, 1):
            path = root / rel
            key = "samples/" + path.name if rel in SAMPLES else rel
            mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            cmd = ["npx", "wrangler@4", "r2", "object", "put", f"{BUCKET}/{key}",
                   f"--file={path}", f"--content-type={mime}"]
            print(f"[{i}/{len(files)}] {key}", flush=True)
            subprocess.run(cmd, check=True)
        print("All assets uploaded. Keep the R2 bucket private; do not enable public access.")

if __name__ == "__main__":
    main()
