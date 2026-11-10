"""Static checks for the site. Usage: python3 scripts/check_site.py [root]. Exit 1 on errors."""
import re,sys,os,glob,json
from urllib.parse import urlparse
root=sys.argv[1] if len(sys.argv)>1 else '.'; os.chdir(root); errors=0
pages=sorted(glob.glob('*.html')+glob.glob('books/*.html')+glob.glob('articles/*.html'))
sm=open('sitemap.xml',encoding='utf8').read()
smurls=set(re.findall(r'<loc>https://aboudiiii.github.io/?([^<]*)</loc>',sm))
print('pages',len(pages),'sitemap',len(smurls))
for p in pages:
    if p=='404.html': continue
    source=open(p,encoding='utf8').read()
    # Private noindex pages (for example the owner admin panel) must stay out of the public sitemap.
    if re.search(r'<meta[^>]+name=["\\']robots["\\'][^>]+content=["\\'][^"\\']*noindex',source,re.I):
        if (p if p!='index.html' else '') in smurls:
            print('ERROR PRIVATE PAGE IN SITEMAP',p); errors+=1
        continue
    if (p if p!='index.html' else '') not in smurls: print('ERROR NOT IN SITEMAP',p); errors+=1
for p in pages:
    s=open(p,encoding='utf8').read()
    issues=[]
    for tag,rx in [('title',r'<title>'),('desc',r'name="description"'),('canonical',r'rel="canonical"'),('og:image',r'og:image'),('jsonld',r'ld\+json'),('viewport','viewport'),('h1',r'<h1')]:
        if not re.search(rx,s): issues.append('no '+tag)
    imgs=re.findall(r'<img\b[^>]*>',s)
    noalt=[i for i in imgs if not re.search(r'alt="[^"]+"',i)]
    nolazy=[i for i in imgs if 'loading=' not in i]
    nodim=[i for i in imgs if not re.search(r'width=',i)]
    if noalt: issues.append(f'{len(noalt)}/{len(imgs)} imgs empty/no alt')
    if nodim: issues.append(f'{len(nodim)} imgs no width/height')
    # local refs
    for m in re.findall(r'(?:src|href)="([^"#?]+)',s):
        if m.startswith(('http','mailto','tel','data:','javascript')): continue
        t=m.lstrip('/') if m.startswith('/') else os.path.normpath(os.path.join(os.path.dirname(p),m))
        if t and not os.path.exists(t): issues.append('ERROR BROKEN '+m); errors+=1
    if not re.search(r'<h1',s): pass
    if 'og:image' in s:
        m=re.search(r'og:image" content="https://aboudiiii.github.io/([^"?]+)',s)
        if m and not os.path.exists(m.group(1)): issues.append('ERROR og:image missing file '+m.group(1)); errors+=1
    if issues: print(p,'|',' ; '.join(issues))

sys.exit(1 if errors else 0)
