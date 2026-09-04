from pathlib import Path

ROOT=Path('.')

def patch(path, old, new, label):
    p=ROOT/path
    s=p.read_text(encoding='utf-8')
    if old not in s:
        raise SystemExit(f'{path}: anchor not found: {label}')
    s=s.replace(old,new,1)
    p.write_text(s,encoding='utf-8')

# seller-catalog.html — explicit stock state in seller editor
patch('seller-catalog.html',
'''<div class="two" id="inventoryFields"><div class="field"><label>SKU / артикул</label><input id="sku"></div><div class="field"><label>Остаток</label><input id="quantity" type="number" step="1" min="0"></div></div>''',
'''<div class="three" id="inventoryFields"><div class="field"><label>SKU / артикул</label><input id="sku"></div><div class="field"><label>Наличие *</label><select id="stockStatus"><option value="IN_STOCK" selected>В наличии</option><option value="LOW_STOCK">Ограниченный остаток</option><option value="ON_ORDER">Под заказ</option><option value="OUT_OF_STOCK">Нет в наличии</option></select></div><div class="field"><label>Остаток, шт.</label><input id="quantity" type="number" step="1" min="0"><div class="hint" id="stockHint">Можно оставить пустым, если точный остаток не ведётся.</div></div></div>''',
'inventory fields')

patch('seller-catalog.html',
'''function valNum(id){const e=$(id);if(!e)return null;const v=e.value.trim();return v===''?null:Number(v)}function val(id){const e=$(id);return e?e.value.trim():''}function checked(id){return !!$(id)?.checked}\n''',
'''function valNum(id){const e=$(id);if(!e)return null;const v=e.value.trim();return v===''?null:Number(v)}function val(id){const e=$(id);return e?e.value.trim():''}function checked(id){return !!$(id)?.checked}\nconst STOCK_STATES=['IN_STOCK','LOW_STOCK','ON_ORDER','OUT_OF_STOCK'];\nfunction stockStatusFrom(x){const explicit=x?.marketplace_details?.stock_status||x?.stock_status;if(STOCK_STATES.includes(explicit))return explicit;if(x?.quantity===null||x?.quantity===undefined||x?.quantity==='')return'ON_ORDER';const q=Number(x.quantity);if(!Number.isFinite(q))return'ON_ORDER';if(q<=0)return'OUT_OF_STOCK';if(q<=3)return'LOW_STOCK';return'IN_STOCK'}\nfunction syncStockUI(){const st=$('stockStatus')?.value,q=$('quantity'),hint=$('stockHint');if(!q)return;if(st==='OUT_OF_STOCK'){q.value='0';q.disabled=true;if(hint)hint.textContent='Товар нельзя добавить в корзину.'}else if(st==='ON_ORDER'){q.value='';q.disabled=true;if(hint)hint.textContent='Точный остаток не требуется — товар будет отмечен «Под заказ».'}else{q.disabled=false;if(hint)hint.textContent=st==='LOW_STOCK'?'Укажите фактическое количество больше нуля.':'Можно оставить пустым, если точный остаток не ведётся.'}}\ndocument.addEventListener('change',e=>{if(e.target?.id==='stockStatus')syncStockUI()});\n''',
'stock helpers')

patch('seller-catalog.html',
'''function resetForm(){$('offerForm').reset();$('id').value='';$('active').checked=true;$('formTitle').textContent='Новая публикация';fillSections();fillSubs('');$('typeTitle').textContent='Выберите раздел';$('typeHint').textContent='После выбора появятся специальные поля публикации.';$('dynamicFields').innerHTML='<div class="dynamic-title">Дополнительные параметры</div><div class="hint">Выберите раздел.</div>';$('commerceFields').classList.remove('hidden');$('inventoryFields').classList.remove('hidden');$('formMsg').textContent=''}''',
'''function resetForm(){$('offerForm').reset();$('id').value='';$('active').checked=true;$('formTitle').textContent='Новая публикация';fillSections();fillSubs('');$('typeTitle').textContent='Выберите раздел';$('typeHint').textContent='После выбора появятся специальные поля публикации.';$('dynamicFields').innerHTML='<div class="dynamic-title">Дополнительные параметры</div><div class="hint">Выберите раздел.</div>';$('commerceFields').classList.remove('hidden');$('inventoryFields').classList.remove('hidden');if($('stockStatus'))$('stockStatus').value='IN_STOCK';syncStockUI();$('formMsg').textContent=''}''',
'reset stock')

patch('seller-catalog.html',
'''applyTypeUI(x.marketplace_details||{});$('formTitle').textContent='Редактирование публикации';''',
'''applyTypeUI(x.marketplace_details||{});if($('stockStatus')){$('stockStatus').value=stockStatusFrom(x);syncStockUI()}$('formTitle').textContent='Редактирование публикации';''',
'edit stock')

patch('seller-catalog.html',
'''const details=collectDetails(type);if(type==='JOB'&&details.salary_from!=null''',
'''const details=collectDetails(type);const hasInventory=['PRODUCT','AUTO'].includes(type);let quantity=hasInventory?valNum('quantity'):null;if(hasInventory){const stockStatus=val('stockStatus')||'IN_STOCK';details.stock_status=stockStatus;if(stockStatus==='OUT_OF_STOCK')quantity=0;else if(stockStatus==='ON_ORDER')quantity=null;else if(stockStatus==='LOW_STOCK'&&!(quantity>0)){$('formMsg').className='msg err';$('formMsg').textContent='Для ограниченного остатка укажите количество больше нуля.';return}else if(stockStatus==='IN_STOCK'&&quantity!==null&&quantity<=0){$('formMsg').className='msg err';$('formMsg').textContent='Для статуса «В наличии» остаток должен быть больше нуля или оставлен пустым.';return}}if(type==='JOB'&&details.salary_from!=null''',
'submit stock validation')

patch('seller-catalog.html',
'''quantity:['PRODUCT','AUTO'].includes(type)?valNum('quantity'):null,''',
'''quantity,''',
'payload quantity')

# index.html — stock label and purchase guard on homepage
patch('index.html',
'''const isService=x=>serviceRx.test(String(x?.category||''));\n''',
'''const isService=x=>serviceRx.test(String(x?.category||''));\nconst STOCK_STATES=['IN_STOCK','LOW_STOCK','ON_ORDER','OUT_OF_STOCK'];\nfunction stockStatus(x){const explicit=x?.marketplace_details?.stock_status;if(STOCK_STATES.includes(explicit))return explicit;if(x?.quantity==null)return'IN_STOCK';const q=Number(x.quantity);if(!Number.isFinite(q))return'IN_STOCK';if(q<=0)return'OUT_OF_STOCK';if(q<=3)return'LOW_STOCK';return'IN_STOCK'}\nfunction stockInfo(x){const st=stockStatus(x),q=Number(x?.quantity);if(st==='OUT_OF_STOCK')return['Нет в наличии','none'];if(st==='ON_ORDER')return['Под заказ','order'];if(st==='LOW_STOCK')return[Number.isFinite(q)&&q>0?`Осталось ${q} шт.`:'Ограниченный остаток','low'];return[Number.isFinite(q)&&q>0&&q<=10?`В наличии: ${q} шт.`:'В наличии','']}\nfunction stockMax(x){if(stockStatus(x)==='OUT_OF_STOCK')return 0;const q=Number(x?.quantity);return x?.quantity==null||!Number.isFinite(q)?99:Math.max(0,Math.min(99,Math.trunc(q)))}\nfunction canBuy(x){return stockStatus(x)!=='OUT_OF_STOCK'&&stockMax(x)>0}\nfunction stockLine(x){if(!['PRODUCT','FOOD','AUTO'].includes(x?.marketplace_offer_type))return'';const [label,cls]=stockInfo(x);return`<div class="stock-line ${cls}">${esc(label)}</div>`}\n''',
'homepage stock helpers')

patch('index.html',
'''function homeAction(x){const t=x.marketplace_offer_type;if(['PRODUCT','FOOD'].includes(t))return`<button class="btn" data-cart="${x.id}">В корзину</button><a class="btn light" href="./offer.html?id=${encodeURIComponent(x.id)}" onclick="event.stopPropagation()">Подробнее</a>`;''',
'''function homeAction(x){const t=x.marketplace_offer_type;if(['PRODUCT','FOOD'].includes(t))return`${canBuy(x)?`<button class="btn" data-cart="${x.id}">${stockStatus(x)==='ON_ORDER'?'Заказать':'В корзину'}</button>`:'<button class="btn light" disabled>Нет в наличии</button>'}<a class="btn light" href="./offer.html?id=${encodeURIComponent(x.id)}" onclick="event.stopPropagation()">Подробнее</a>`;''',
'homepage action')

patch('index.html',
'''${x.unit?`<span class="unit">/ ${esc(x.unit)}</span>`:''}</div><div class="product-actions">''',
'''${x.unit?`<span class="unit">/ ${esc(x.unit)}</span>`:''}</div>${stockLine(x)}<div class="product-actions">''',
'homepage stock line')

patch('index.html',
'''document.querySelectorAll('[data-cart]').forEach(b=>b.onclick=e=>{e.stopPropagation();const key='cuim-cart:v1';let a=[];try{a=JSON.parse(localStorage.getItem(key)||'[]')}catch{}const found=a.find(v=>v.product_id===b.dataset.cart);found?found.quantity++:a.push({product_id:b.dataset.cart,quantity:1});localStorage.setItem(key,JSON.stringify(a));b.textContent='Добавлено ✓';setTimeout(()=>b.textContent='В корзину',1200)})''',
'''document.querySelectorAll('[data-cart]').forEach(b=>b.onclick=e=>{e.stopPropagation();const product=all.find(x=>x.id===b.dataset.cart);if(!product||!canBuy(product))return;const key='cuim-cart:v1',max=stockMax(product);let a=[];try{a=JSON.parse(localStorage.getItem(key)||'[]')}catch{}const found=a.find(v=>v.product_id===b.dataset.cart);if(found)found.quantity=Math.min(max,Math.max(1,Number(found.quantity)||1)+1);else a.push({product_id:b.dataset.cart,quantity:1});localStorage.setItem(key,JSON.stringify(a));b.textContent='Добавлено ✓';setTimeout(()=>b.textContent=stockStatus(product)==='ON_ORDER'?'Заказать':'В корзину',1200)})''',
'homepage cart guard')

p=Path('index.html');s=p.read_text(encoding='utf-8');s=s.replace('</style>','.stock-line{margin-top:7px;font-size:11px;font-weight:850;color:#047857}.stock-line.low{color:#b45309}.stock-line.order{color:#6d28d9}.stock-line.none{color:#b91c1c}.btn:disabled{opacity:.55;cursor:not-allowed}\n</style>',1);p.write_text(s,encoding='utf-8')

# seller.html — richer RPC + explicit stock on seller profile
patch('seller.html',
'''function cart(){try{return JSON.parse(localStorage.getItem('cuim-cart:v1')||'[]')}catch{return[]}}function addCart(id){const a=cart(),x=a.find(v=>v.product_id===id);x?x.quantity++:a.push({product_id:id,quantity:1});localStorage.setItem('cuim-cart:v1',JSON.stringify(a))}\n''',
'''const STOCK_STATES=['IN_STOCK','LOW_STOCK','ON_ORDER','OUT_OF_STOCK'];function stockStatus(x){const explicit=x?.marketplace_details?.stock_status;if(STOCK_STATES.includes(explicit))return explicit;if(x?.quantity==null)return'IN_STOCK';const q=Number(x.quantity);if(!Number.isFinite(q))return'IN_STOCK';if(q<=0)return'OUT_OF_STOCK';if(q<=3)return'LOW_STOCK';return'IN_STOCK'}function stockInfo(x){const st=stockStatus(x),q=Number(x?.quantity);if(st==='OUT_OF_STOCK')return['Нет в наличии','none'];if(st==='ON_ORDER')return['Под заказ','order'];if(st==='LOW_STOCK')return[Number.isFinite(q)&&q>0?`Осталось ${q} шт.`:'Ограниченный остаток','low'];return[Number.isFinite(q)&&q>0&&q<=10?`В наличии: ${q} шт.`:'В наличии','']}function stockMax(x){if(stockStatus(x)==='OUT_OF_STOCK')return 0;const q=Number(x?.quantity);return x?.quantity==null||!Number.isFinite(q)?99:Math.max(0,Math.min(99,Math.trunc(q)))}function canBuy(x){return stockStatus(x)!=='OUT_OF_STOCK'&&stockMax(x)>0}function stockLine(x){if(!['PRODUCT','FOOD','AUTO'].includes(x?.marketplace_offer_type))return'';const[label,cls]=stockInfo(x);return`<div class="stock-line ${cls}">${esc(label)}</div>`}\nfunction cart(){try{return JSON.parse(localStorage.getItem('cuim-cart:v1')||'[]')}catch{return[]}}function addCart(id){const p=all.find(v=>v.id===id);if(!p||!canBuy(p))return;const a=cart(),x=a.find(v=>v.product_id===id),max=stockMax(p);if(x)x.quantity=Math.min(max,Math.max(1,Number(x.quantity)||1)+1);else a.push({product_id:id,quantity:1});localStorage.setItem('cuim-cart:v1',JSON.stringify(a))}\n''',
'seller stock helpers')

patch('seller.html',
'''function sellerCardActions(x){const t=x.marketplace_offer_type;if(['PRODUCT','FOOD'].includes(t))return`<button class="btn" data-cart="${x.id}">В корзину</button><a class="btn light" href="/offer.html?id=${encodeURIComponent(x.id)}">Подробнее</a>`;''',
'''function sellerCardActions(x){const t=x.marketplace_offer_type;if(['PRODUCT','FOOD'].includes(t))return`${canBuy(x)?`<button class="btn" data-cart="${x.id}">${stockStatus(x)==='ON_ORDER'?'Заказать':'В корзину'}</button>`:'<button class="btn light" disabled>Нет в наличии</button>'}<a class="btn light" href="/offer.html?id=${encodeURIComponent(x.id)}">Подробнее</a>`;''',
'seller action')

patch('seller.html',
'''${x.unit?`<span class="unit">/ ${esc(x.unit)}</span>`:''}</div><div class="product-actions">''',
'''${x.unit?`<span class="unit">/ ${esc(x.unit)}</span>`:''}</div>${stockLine(x)}<div class="product-actions">''',
'seller stock line')

patch('seller.html',
'''setTimeout(()=>b.textContent='В корзину',1200)''',
'''setTimeout(()=>{const p=all.find(x=>x.id===b.dataset.cart);b.textContent=stockStatus(p)==='ON_ORDER'?'Заказать':'В корзину'},1200)''',
'seller cart label')

patch('seller.html',
'''const{data,error}=await s.rpc('marketplace_products',{p_query:null,p_category:null,p_partner_id:sellerId});''',
'''const{data,error}=await s.rpc('marketplace_catalog_products_v4',{p_query:null,p_section:null,p_subcategory:null,p_partner_id:sellerId,p_city_id:null,p_area_id:null,p_metro_id:null,p_radius_m:3000});''',
'seller rpc')

p=Path('seller.html');s=p.read_text(encoding='utf-8');s=s.replace('</style>','.stock-line{margin-top:7px;font-size:11px;font-weight:850;color:#047857}.stock-line.low{color:#b45309}.stock-line.order{color:#6d28d9}.stock-line.none{color:#b91c1c}.btn:disabled{opacity:.55;cursor:not-allowed}\n</style>',1);p.write_text(s,encoding='utf-8')

# offer.html — explicit stock status and disable buying when unavailable
patch('offer.html',
'''function addCart(){if(!item)return;const a=cart(),x=a.find(v=>v.product_id===item.id);x?x.quantity++:a.push({product_id:item.id,quantity:1});localStorage.setItem('cuim-cart:v1',JSON.stringify(a));updateCart();for(const b of document.querySelectorAll('[data-primary],#mobilePrimary')){b.textContent='Добавлено ✓';setTimeout(()=>b.textContent=primaryLabel(),1200)}}\nfunction primaryLabel(){return item?.marketplace_offer_type==='FOOD'?'В корзину':'В корзину'}\nfunction canCart(){return ['PRODUCT','FOOD'].includes(item?.marketplace_offer_type)}\n''',
'''const STOCK_STATES=['IN_STOCK','LOW_STOCK','ON_ORDER','OUT_OF_STOCK'];\nfunction stockStatus(x=item){const explicit=x?.marketplace_details?.stock_status;if(STOCK_STATES.includes(explicit))return explicit;if(x?.quantity==null)return'IN_STOCK';const q=Number(x.quantity);if(!Number.isFinite(q))return'IN_STOCK';if(q<=0)return'OUT_OF_STOCK';if(q<=3)return'LOW_STOCK';return'IN_STOCK'}\nfunction stockMax(x=item){if(stockStatus(x)==='OUT_OF_STOCK')return 0;const q=Number(x?.quantity);return x?.quantity==null||!Number.isFinite(q)?99:Math.max(0,Math.min(99,Math.trunc(q)))}\nfunction canBuy(x=item){return stockStatus(x)!=='OUT_OF_STOCK'&&stockMax(x)>0}\nfunction addCart(){if(!item||!canBuy(item))return;const a=cart(),x=a.find(v=>v.product_id===item.id),max=stockMax(item);if(x)x.quantity=Math.min(max,Math.max(1,Number(x.quantity)||1)+1);else a.push({product_id:item.id,quantity:1});localStorage.setItem('cuim-cart:v1',JSON.stringify(a));updateCart();for(const b of document.querySelectorAll('[data-primary],#mobilePrimary')){b.textContent='Добавлено ✓';setTimeout(()=>b.textContent=primaryLabel(),1200)}}\nfunction primaryLabel(){if(!canBuy(item))return'Нет в наличии';return stockStatus(item)==='ON_ORDER'?'Заказать':'В корзину'}\nfunction canCart(){return ['PRODUCT','FOOD'].includes(item?.marketplace_offer_type)}\nfunction primaryActionHtml(){if(!canCart())return`<button class="btn" data-message>${item.marketplace_offer_type==='SERVICE'?'Заказать':'Связаться'}</button>`;if(!canBuy(item))return'<button class="btn light" disabled>Нет в наличии</button>';return`<button class="btn" data-primary>${primaryLabel()}</button>`}\n''',
'offer stock helpers')

patch('offer.html',
'''function stockInfo(){if(!canCart())return['Предложение активно',''];const q=Number(item?.quantity);if(!Number.isFinite(q))return['В наличии',''];if(q<=0)return['Нет в наличии','none'];if(q<=3)return[`Осталось ${q} шт.`,'low'];return['В наличии','']}''',
'''function stockInfo(){if(!canCart())return['Предложение активно',''];const st=stockStatus(item),q=Number(item?.quantity);if(st==='OUT_OF_STOCK')return['Нет в наличии','none'];if(st==='ON_ORDER')return['Под заказ','order'];if(st==='LOW_STOCK')return[Number.isFinite(q)&&q>0?`Осталось ${q} шт.`:'Ограниченный остаток','low'];return[Number.isFinite(q)&&q>0&&q<=10?`В наличии: ${q} шт.`:'В наличии','']}''',
'offer stock info')

patch('offer.html',
'''${canCart()?`<button class="btn" data-primary>В корзину</button>`:`<button class="btn" data-message>${item.marketplace_offer_type==='SERVICE'?'Заказать':'Связаться'}</button>`}<button class="btn light" data-message>Написать</button>''',
'''${primaryActionHtml()}<button class="btn light" data-message>Написать</button>''',
'offer primary action')

patch('offer.html',
'''const mobilePrimary=$('mobilePrimary');if(canCart()){mobilePrimary.textContent='В корзину';mobilePrimary.onclick=addCart}else{mobilePrimary.textContent=item.marketplace_offer_type==='SERVICE'?'Заказать':'Связаться';mobilePrimary.onclick=messageSeller}''',
'''const mobilePrimary=$('mobilePrimary');mobilePrimary.disabled=false;if(canCart()){mobilePrimary.textContent=primaryLabel();if(canBuy(item))mobilePrimary.onclick=addCart;else{mobilePrimary.disabled=true;mobilePrimary.onclick=null}}else{mobilePrimary.textContent=item.marketplace_offer_type==='SERVICE'?'Заказать':'Связаться';mobilePrimary.onclick=messageSeller}''',
'offer mobile action')

patch('offer.html',
'''.stock.none{color:#b91c1c}''',
'''.stock.none{color:#b91c1c}.stock.order{color:#6d28d9}''',
'offer stock css')

# cart.html — explicit status in cart and checkout blocking
patch('cart.html',
'''function stockText(p,q){if(p.quantity==null)return['В наличии',''];const n=Number(p.quantity);if(n<=0)return['Нет в наличии','bad'];if(q>n)return[`Доступно только ${n}`,'bad'];if(n<=3)return[`Осталось ${n}`,'warn'];return[`В наличии: ${n}`,'']}''',
'''const STOCK_STATES=['IN_STOCK','LOW_STOCK','ON_ORDER','OUT_OF_STOCK'];function stockStatus(p){const explicit=p?.marketplace_details?.stock_status;if(STOCK_STATES.includes(explicit))return explicit;if(p?.quantity==null)return'IN_STOCK';const n=Number(p.quantity);if(!Number.isFinite(n))return'IN_STOCK';if(n<=0)return'OUT_OF_STOCK';if(n<=3)return'LOW_STOCK';return'IN_STOCK'}function stockMax(p){if(stockStatus(p)==='OUT_OF_STOCK')return 0;const n=Number(p?.quantity);return p?.quantity==null||!Number.isFinite(n)?99:Math.max(0,Math.min(99,Math.trunc(n)))}function stockText(p,q){const st=stockStatus(p),n=Number(p?.quantity);if(st==='OUT_OF_STOCK')return['Нет в наличии','bad'];if(st==='ON_ORDER')return['Под заказ','order'];if(Number.isFinite(n)&&q>n)return[`Доступно только ${n}`,'bad'];if(st==='LOW_STOCK')return[Number.isFinite(n)&&n>0?`Осталось ${n}`:'Ограниченный остаток','warn'];return[Number.isFinite(n)&&n>0?`В наличии: ${n}`:'В наличии','']}''',
'cart stock helpers')

patch('cart.html',
'''else if(p.currency!=='RUB')reason='Эта валюта пока не поддерживается в корзине';else if(p.quantity!=null&&Number(p.quantity)<Number(c.quantity))''',
'''else if(p.currency!=='RUB')reason='Эта валюта пока не поддерживается в корзине';else if(stockStatus(p)==='OUT_OF_STOCK')reason='Товар сейчас нет в наличии';else if(p.quantity!=null&&Number(p.quantity)<Number(c.quantity))''',
'cart invalid unavailable')

patch('cart.html',
'''max=p.quantity==null?99:Math.max(0,Math.min(99,Math.trunc(Number(p.quantity))))''',
'''max=stockMax(p)''',
'cart render max')

patch('cart.html',
'''max=p?.quantity==null?99:Math.min(99,Math.trunc(Number(p.quantity)))''',
'''max=stockMax(p)''',
'cart plus max')

p=Path('cart.html');s=p.read_text(encoding='utf-8');s=s.replace('</style>','.stock.order{color:#6d28d9}\n</style>',1);p.write_text(s,encoding='utf-8')

print('stock status integration patched successfully')
