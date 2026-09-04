from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label}: marker not found')
    return text.replace(old, new, 1)

# seller-catalog.html
p=Path('seller-catalog.html')
s=p.read_text(encoding='utf-8')
s=replace_once(
    s,
    "<label class=\"toggle\"><input id=\"d_food_delivery\" type=\"checkbox\"> Доступна доставка</label>",
    "<div class=\"two\"><label class=\"toggle\"><input id=\"d_food_delivery\" type=\"checkbox\"> Доступна доставка</label><label class=\"toggle\"><input id=\"d_food_pickup\" type=\"checkbox\"> Доступен самовывоз</label></div>",
    'food pickup'
)
s=replace_once(s,"$('inventoryFields').classList.toggle('hidden',!['PRODUCT','AUTO'].includes(type))","$('inventoryFields').classList.toggle('hidden',!['PRODUCT','FOOD','AUTO'].includes(type))",'food inventory UI')
s=replace_once(s,"checkIf('d_food_delivery',d.delivery)","checkIf('d_food_delivery',d.delivery);checkIf('d_food_pickup',d.pickup)",'food populate pickup')
s=replace_once(s,"allergens:val('d_allergens')||null,delivery:checked('d_food_delivery')","allergens:val('d_allergens')||null,delivery:checked('d_food_delivery'),pickup:checked('d_food_pickup')",'food collect pickup')
s=replace_once(s,"const hasInventory=['PRODUCT','AUTO'].includes(type);","const hasInventory=['PRODUCT','FOOD','AUTO'].includes(type);",'food inventory save')
start=s.index("$('offerForm').onsubmit=async e=>")
end=s.index("\nif(await sessionGuard())loadAll();",start)
new_handler=r'''$('offerForm').onsubmit=async e=>{
  e.preventDefault();
  const sec=$('section').value,sub=$('subcategory').value,type=typeBySection[sec];
  const fail=text=>{const m=$('formMsg');m.className='msg err';m.textContent=text};
  if(!sec||!sub||!type){fail('Выберите раздел и подкатегорию.');return}
  const details=collectDetails(type);
  const hasInventory=['PRODUCT','FOOD','AUTO'].includes(type);
  let quantity=hasInventory?valNum('quantity'):null;
  if(hasInventory){
    const stockStatus=val('stockStatus')||'IN_STOCK';details.stock_status=stockStatus;
    if(stockStatus==='OUT_OF_STOCK')quantity=0;
    else if(stockStatus==='ON_ORDER')quantity=null;
    else if(stockStatus==='LOW_STOCK'&&!(quantity>0)){fail('Для ограниченного остатка укажите количество больше нуля.');return}
    else if(stockStatus==='IN_STOCK'&&quantity!==null&&quantity<=0){fail('Для статуса «В наличии» остаток должен быть больше нуля или оставлен пустым.');return}
  }
  if(type==='JOB'&&details.salary_from!=null&&details.salary_to!=null&&details.salary_from>details.salary_to){fail('Зарплата «от» не может быть больше зарплаты «до».');return}
  if(type==='EVENT'&&!details.start_at){fail('Для события укажите дату и время начала.');return}
  let price=type==='JOB'?null:valNum('price');
  if(type==='EVENT'&&details.ticket_price!=null)price=details.ticket_price;
  const id=$('id').value.trim();
  const unit=['PRODUCT','FOOD'].includes(type)?(window.CUIM_SELLER_COMMERCE?.unit?.()||null):null;
  const city=window.CUIM_SELLER_LOCATION?.city?.()||null;
  const area=window.CUIM_SELLER_LOCATION?.area?.()||null;
  const payload={
    id:id||null,
    title:$('title').value.trim(),
    description:$('description').value.trim()||null,
    price,
    old_price:type==='JOB'?null:valNum('oldPrice'),
    sku:['PRODUCT','AUTO'].includes(type)?($('sku').value.trim()||null):null,
    unit,
    quantity,
    category:$('legacyCategory').value.trim()||null,
    image_url:$('imageUrl').value.trim()||null,
    marketplace_visible:$('visible').checked,
    is_active:$('active').checked,
    marketplace_section_key:sec,
    marketplace_subcategory_key:sub,
    marketplace_offer_type:type,
    marketplace_details:details,
    marketplace_geo_city_id:city,
    marketplace_geo_area_id:area
  };
  const m=$('formMsg');m.className='msg';m.textContent='Сохраняем…';
  const{data,error}=await s.rpc('marketplace_partner_save_offer',{p_offer:payload});
  if(error){
    const raw=String(error.message||error.details||'');
    const code=['AUTH_REQUIRED','PARTNER_REQUIRED','PRODUCT_NOT_FOUND','TITLE_REQUIRED','TITLE_TOO_LONG','INVALID_OFFER_TYPE','INVALID_SECTION','INVALID_SUBCATEGORY','INVALID_NUMBER','INVALID_PRICE','INVALID_OLD_PRICE','OLD_PRICE_MUST_BE_HIGHER','INVALID_QUANTITY','INVALID_CITY','INVALID_AREA','PRICE_REQUIRED','UNIT_REQUIRED','IMAGE_REQUIRED','CITY_REQUIRED','INVALID_STOCK_STATUS','LOW_STOCK_QUANTITY_REQUIRED','IN_STOCK_QUANTITY_INVALID','SALARY_RANGE_INVALID','EVENT_START_REQUIRED'].find(x=>raw.includes(x));
    const messages={AUTH_REQUIRED:'Войдите в аккаунт продавца заново.',PARTNER_REQUIRED:'У аккаунта нет активного профиля продавца.',PRODUCT_NOT_FOUND:'Публикация не найдена или больше недоступна.',TITLE_REQUIRED:'Укажите название публикации.',TITLE_TOO_LONG:'Название слишком длинное.',INVALID_OFFER_TYPE:'Тип публикации не соответствует выбранному разделу.',INVALID_SECTION:'Выбранный раздел недоступен.',INVALID_SUBCATEGORY:'Выбранная подкатегория недоступна.',INVALID_NUMBER:'Проверьте числовые поля.',INVALID_PRICE:'Цена не может быть отрицательной.',INVALID_OLD_PRICE:'Старая цена не может быть отрицательной.',OLD_PRICE_MUST_BE_HIGHER:'Старая цена должна быть выше текущей.',INVALID_QUANTITY:'Остаток указывается целым неотрицательным числом.',INVALID_CITY:'Выберите доступный город.',INVALID_AREA:'Выберите район или населённый пункт из списка.',PRICE_REQUIRED:'Для товара или еды на витрине укажите цену.',UNIT_REQUIRED:'Выберите единицу продажи.',IMAGE_REQUIRED:'Для публикации на витрине добавьте хотя бы одно фото.',CITY_REQUIRED:'Для публикации на витрине выберите город.',INVALID_STOCK_STATUS:'Проверьте статус наличия.',LOW_STOCK_QUANTITY_REQUIRED:'Для ограниченного остатка укажите количество больше нуля.',IN_STOCK_QUANTITY_INVALID:'Для статуса «В наличии» остаток должен быть больше нуля или оставлен пустым.',SALARY_RANGE_INVALID:'Зарплата «от» не может быть больше зарплаты «до».',EVENT_START_REQUIRED:'Укажите дату и время начала события.'};
    fail(messages[code]||('Ошибка: '+raw));return;
  }
  const savedId=String(data||'').trim();
  if(!savedId){fail('Сервер не вернул ID публикации. Попробуйте ещё раз.');return}
  const created=!id;
  $('id').value=savedId;
  $('formTitle').textContent='Редактирование публикации';
  m.className='msg ok';m.textContent=created?'Публикация создана. Сохраняем связанные данные…':'Изменения сохранены.';
  await loadRows();
  document.dispatchEvent(new CustomEvent('cuim:seller-offer-saved',{detail:{id:savedId,created,type}}));
};'''
s=s[:start]+new_handler+s[end:]
p.write_text(s,encoding='utf-8')

# seller-gallery.js
p=Path('seller-gallery.js')
s=p.read_text(encoding='utf-8')
s=replace_once(s,"let pid=beforeId;if(!pid)pid=await resolveNewProduct(beforeTitle,coverUrl);","let pid=beforeId||productId();if(!pid)pid=await resolveNewProduct(beforeTitle,coverUrl);",'gallery saved id')
s=replace_once(s,"if(beforeId){lastProductId=pid;await loadGallery(pid)}else{releaseAll();items=[];lastProductId='';render()}","lastProductId=pid;await loadGallery(pid)",'gallery keep new product')
p.write_text(s,encoding='utf-8')

# seller-commerce.js
p=Path('seller-commerce.js')
s=p.read_text(encoding='utf-8')
s=replace_once(s,"const UNIT_OPTIONS=['шт','компл.','набор','упак.','пара','кг','г','л','мл','м','м²','м³'];","const UNIT_OPTIONS=['шт','компл.','набор','упак.','пара','порция','кг','г','л','мл','м','м²','м³'];",'food sale unit')
s=replace_once(s,"let partnerId=null,methods=[],installed=false,saveSeq=0;","let partnerId=null,methods=[],installed=false;",'remove commerce save seq')
s=replace_once(s,"q.step='0.01';","q.step='1';",'whole stock step')
s=replace_once(s,"const t=type(),items=[];if(t!=='PRODUCT')return items;","const t=type(),items=[];if(!['PRODUCT','FOOD'].includes(t))return items;",'commerce product food readiness')
s=replace_once(s,"const pickup=checked('d_pickup'),delivery=checked('d_delivery'),hasDelivery=activeDeliveries().length>0;","const pickup=checked(t==='FOOD'?'d_food_pickup':'d_pickup'),delivery=checked(t==='FOOD'?'d_food_delivery':'d_delivery'),hasDelivery=activeDeliveries().length>0;",'commerce product food fulfillment')
s=replace_once(s,"assist.classList.toggle('hidden',t!=='PRODUCT');if(t!=='PRODUCT')return;","assist.classList.toggle('hidden',!['PRODUCT','FOOD'].includes(t));if(!['PRODUCT','FOOD'].includes(t))return;",'commerce assist product food')
s=replace_once(s,"if(type()!=='PRODUCT'||!$('visible')?.checked)return true;\n  const price=num('price'),old=num('oldPrice'),pickup=checked('d_pickup'),delivery=checked('d_delivery');","const t=type();if(!['PRODUCT','FOOD'].includes(t)||!$('visible')?.checked)return true;\n  const price=num('price'),old=num('oldPrice'),pickup=checked(t==='FOOD'?'d_food_pickup':'d_pickup'),delivery=checked(t==='FOOD'?'d_food_delivery':'d_delivery');",'commerce validation product food')
pattern=r"async function resolveSavedProduct\(snapshot\)\{.*?\nasync function loadUnitFor"
s,n=re.subn(pattern,"async function loadUnitFor",s,count=1,flags=re.S)
if n!=1: raise SystemExit('commerce polling block: marker not found')
s=replace_once(s,"form.addEventListener('submit',e=>{if(!validateSale()){e.preventDefault();e.stopImmediatePropagation();return}const snap={id:$('id')?.value||'',title:$('title')?.value?.trim()||'',unit:type()==='PRODUCT'?unitValue():null,startedAt:Date.now()};if(type()==='PRODUCT')persistUnit(snap)},true);","form.addEventListener('submit',e=>{if(!validateSale()){e.preventDefault();e.stopImmediatePropagation()}},true);",'commerce submit')
s=replace_once(s,"document.addEventListener('change',e=>{if(e.target?.id==='d_pickup'||e.target?.id==='d_delivery')updateAssist()});","document.addEventListener('change',e=>{if(['d_pickup','d_delivery','d_food_pickup','d_food_delivery'].includes(e.target?.id))updateAssist()});",'commerce change listeners')
s=replace_once(s,"let tries=0;const timer=setInterval", "window.CUIM_SELLER_COMMERCE={unit:()=>unitValue(),update:()=>updateAssist()};\n\nlet tries=0;const timer=setInterval", 'commerce api')
p.write_text(s,encoding='utf-8')

# seller-location.js
p=Path('seller-location.js')
s=p.read_text(encoding='utf-8')
s=replace_once(s,"let cities=[...FALLBACK_CITIES],areas=[],partnerId=null,installed=false,saveSeq=0;","let cities=[...FALLBACK_CITIES],areas=[],partnerId=null,installed=false;",'remove location save seq')
pattern=r"async function resolveSavedProduct\(snap\)\{.*?\nfunction bind\(\)\{"
s,n=re.subn(pattern,"function bind(){",s,count=1,flags=re.S)
if n!=1: raise SystemExit('location polling block: marker not found')
s=replace_once(s,"form.addEventListener('submit',e=>{if(!validate()){e.preventDefault();e.stopImmediatePropagation();return}const snap={id:$('id')?.value||'',title:$('title')?.value?.trim()||'',city:cityId(),area:areaId(),startedAt:Date.now()};persistLocation(snap)},true);","form.addEventListener('submit',e=>{if(!validate()){e.preventDefault();e.stopImmediatePropagation()}},true);",'location submit')
s=replace_once(s,"if(!bind()){", "window.CUIM_SELLER_LOCATION={city:()=>cityId()||null,area:()=>areaId()||null};\n\nif(!bind()){", 'location api')
p.write_text(s,encoding='utf-8')
