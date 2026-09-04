from pathlib import Path

root=Path('.')

# Seller catalog: expose operational sections in the header.
p=root/'seller-catalog.html'
s=p.read_text(encoding='utf-8')
old='<div class="top-actions"><a class="btn light hide" href="account.html">← Личный кабинет</a><a class="btn light hide" id="publicProfile"'
new='<div class="top-actions"><a class="btn light hide" href="account.html">← Личный кабинет</a><a class="btn light" href="seller-orders.html">Заказы</a><a class="btn light" href="seller-reviews.html">Отзывы</a><a class="btn light hide" id="publicProfile"'
if old in s:
    s=s.replace(old,new,1)
elif 'href="seller-orders.html">Заказы</a>' not in s:
    raise SystemExit('seller-catalog header marker not found')
p.write_text(s,encoding='utf-8')

# Account: seller-only location card already becomes visible only for a linked partner.
p=root/'account.html'
s=p.read_text(encoding='utf-8')
s=s.replace("CONFIRMED:'Подтверждён',IN_WORK:'В работе'","CONFIRMED:'Подтверждён',IN_PROGRESS:'В работе'")
old='<a class="btn light" id="openSellerProfile" target="_blank" rel="noopener" href="#">Открыть профиль</a>'
new=old+'<a class="btn light" href="./seller-orders.html">Заказы продавца</a><a class="btn light" href="./seller-catalog.html">Каталог продавца</a><a class="btn light" href="./seller-reviews.html">Отзывы продавца</a>'
if old in s and 'href="./seller-orders.html">Заказы продавца</a>' not in s:
    s=s.replace(old,new,1)
elif 'href="./seller-orders.html">Заказы продавца</a>' not in s:
    raise SystemExit('account seller action marker not found')
p.write_text(s,encoding='utf-8')
