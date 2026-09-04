from pathlib import Path

ROOT=Path('.')
FAV='<script type="module" src="/marketplace-favorites.js"></script>'
REV='<script type="module" src="/marketplace-reviews.js"></script>'

def add_before_body(path, snippets):
    p=ROOT/path
    text=p.read_text(encoding='utf-8')
    changed=False
    for snippet in snippets:
        if snippet not in text:
            if '</body>' not in text:
                raise SystemExit(f'{path}: </body> not found')
            text=text.replace('</body>',snippet+'\n</body>',1)
            changed=True
    if changed:p.write_text(text,encoding='utf-8')

for name in ('index.html','seller.html'):
    add_before_body(name,(FAV,REV))
for name in ('offer.html','order.html'):
    add_before_body(name,(FAV,REV))
for name in ('account.html','cart.html'):
    add_before_body(name,(FAV,))

p=ROOT/'catalog/catalog.js'
text=p.read_text(encoding='utf-8')
marker="import'/marketplace-card-ui.js';"
if marker not in text:
    raise SystemExit('catalog/catalog.js: marketplace card UI import not found')
for imp in ("import'/marketplace-favorites.js';","import'/marketplace-reviews.js';"):
    if imp not in text:
        text=text.replace(marker,marker+'\n'+imp,1)
p.write_text(text,encoding='utf-8')
