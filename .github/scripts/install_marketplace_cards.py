from pathlib import Path

ROOT=Path('.')
SCRIPT='<script type="module" src="/marketplace-card-ui.js"></script>'

for name in ('index.html','seller.html'):
    p=ROOT/name
    text=p.read_text(encoding='utf-8')
    if SCRIPT not in text:
        if '</body>' not in text:
            raise SystemExit(f'{name}: </body> not found')
        text=text.replace('</body>',SCRIPT+'\n</body>',1)
        p.write_text(text,encoding='utf-8')

p=ROOT/'catalog/catalog.js'
text=p.read_text(encoding='utf-8')
imp="import'/marketplace-card-ui.js';"
if imp not in text:
    marker="import'/geo-core.js';"
    if marker not in text:
        raise SystemExit('catalog/catalog.js: geo-core import not found')
    text=text.replace(marker,marker+'\n'+imp,1)
    p.write_text(text,encoding='utf-8')
