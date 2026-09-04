from pathlib import Path

ROOT = Path('.')
TAG = '<script type="module" src="/seller-attention.js"></script>'

for name in ('account.html','seller-catalog.html','seller-orders.html','seller-reviews.html'):
    p = ROOT / name
    s = p.read_text(encoding='utf-8')
    if TAG not in s:
        if '</body>' not in s:
            raise SystemExit(f'{name}: closing body not found')
        s = s.replace('</body>', TAG + '\n</body>', 1)
        p.write_text(s, encoding='utf-8')

p = ROOT / 'notifications.html'
s = p.read_text(encoding='utf-8')
if 'data-filter="STORE"' not in s:
    old = '<button data-filter="MESSAGE">Сообщения</button>'
    new = '<button data-filter="STORE">Магазин</button><button data-filter="MESSAGE">Сообщения</button>'
    if old not in s:
        raise SystemExit('notifications store tab marker not found')
    s = s.replace(old, new, 1)

if "MARKETPLACE_ORDER_NEW:'🛍️'" not in s:
    old = "BEAUTY_REMINDER_2H:'⏰'};"
    new = "BEAUTY_REMINDER_2H:'⏰',MARKETPLACE_ORDER_NEW:'🛍️',MARKETPLACE_REVIEW_NEW:'⭐'};"
    if old not in s:
        raise SystemExit('notifications icons marker not found')
    s = s.replace(old, new, 1)

if 'function storeType' not in s:
    old = "function classifiedType(t){return String(t||'').startsWith('CLASSIFIED_')}function beautyType(t){return String(t||'').startsWith('BEAUTY_')}"
    new = old + "function storeType(t){return String(t||'').startsWith('MARKETPLACE_ORDER_')||String(t||'').startsWith('MARKETPLACE_REVIEW_')}"
    if old not in s:
        raise SystemExit('notifications type helpers marker not found')
    s = s.replace(old, new, 1)

old = "else if(filter==='BEAUTY')a=a.filter(x=>beautyType(x.type));else if(filter==='MESSAGE')a=a.filter(x=>x.type==='MESSAGE');"
new = "else if(filter==='BEAUTY')a=a.filter(x=>beautyType(x.type));else if(filter==='STORE')a=a.filter(x=>storeType(x.type));else if(filter==='MESSAGE')a=a.filter(x=>x.type==='MESSAGE');"
if "filter==='STORE'" not in s:
    if old not in s:
        raise SystemExit('notifications render filter marker not found')
    s = s.replace(old, new, 1)

s = s.replace('Сообщения, объявления, онлайн-записи и важные события вашего аккаунта ЦУИМ.','Сообщения, заказы, отзывы, объявления, онлайн-записи и важные события вашего аккаунта ЦУИМ.')
p.write_text(s, encoding='utf-8')
