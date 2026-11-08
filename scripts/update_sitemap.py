#!/usr/bin/env python3
"""Regenerate sitemap.xml: lists every public page and sets <lastmod> from git history.

Usage: python3 scripts/update_sitemap.py [root]
Keeps the priority and order of existing entries; new pages get a default priority
(books 0.8, articles 0.7, other pages 0.5). 404.html is excluded.
Needs full git history for accurate dates (not a --depth=1 clone).
"""
import glob, os, re, subprocess, sys, datetime

root = sys.argv[1] if len(sys.argv) > 1 else '.'
os.chdir(root)
BASE = 'https://aboudiiii.github.io/'

old = open('sitemap.xml', encoding='utf8').read() if os.path.exists('sitemap.xml') else ''
prio = {m[0]: m[1] for m in re.findall(r'<loc>' + re.escape(BASE) + r'([^<]*)</loc>.*?<priority>([^<]*)</priority>', old)}
order = [m for m in re.findall(r'<loc>' + re.escape(BASE) + r'([^<]*)</loc>', old)]

pages = sorted(p for p in glob.glob('*.html') + glob.glob('books/*.html') + glob.glob('articles/*.html') if p != '404.html')
keys = {('' if p == 'index.html' else p): p for p in pages}
ordered = [k for k in order if k in keys] + sorted(k for k in keys if k not in order)

def default_priority(k):
    return '0.8' if k.startswith('books/') else '0.7' if k.startswith('articles/') else '0.5'

def lastmod(path):
    r = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', path], capture_output=True, text=True)
    return r.stdout.strip() or datetime.date.today().isoformat()

lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for k in ordered:
    lines.append(f'  <url><loc>{BASE}{k}</loc><lastmod>{lastmod(keys[k])}</lastmod><priority>{prio.get(k, default_priority(k))}</priority></url>')
lines.append('</urlset>')
open('sitemap.xml', 'w', encoding='utf8', newline='\n').write('\n'.join(lines) + '\n')
print(f'sitemap.xml: {len(ordered)} urls')
