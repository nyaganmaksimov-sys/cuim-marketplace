import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const s=createClient('https://qgakliolffnwkymoqvzn.supabase.co','sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu');
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const money=v=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(Number(v||0));
const UNIT_OPTIONS=['шт','компл.','набор','упак.','пара','кг','г','л','мл','м','м²','м³'];
let partnerId=null,methods=[],installed=false,saveSeq=0;

function type(){return({goods:'PRODUCT',services:'SERVICE',jobs:'JOB',food:'FOOD',auto:'AUTO',ads:'AD',events:'EVENT'})[$('section')?.value]||''}
function num(id){const v=$(id)?.value?.trim();return v===''||v==null?null:Number(v)}
function checked(id){return !!$(id)?.checked}
function unitValue(){return $('saleUnit')?.value?.trim()||null}
async function ensurePartner(){if(partnerId)return partnerId;const{data:{session}}=await s.auth.getSession();if(!session)return null;const{data,error}=await s.rpc('current_partner_id');if(error||!data)return null;partnerId=data;return partnerId}

function injectUnit(){
  const inv=$('inventoryFields');if(!inv||$('saleUnit'))return;
  inv.classList.remove('two');inv.classList.add('three');
  const f=document.createElement('div');f.className='field';f.innerHTML=`<label>Единица продажи</label><select id="saleUnit">${UNIT_OPTIONS.map((x,i)=>`<option value="${esc(x)}" ${i===0?'selected':''}>${esc(x)}</option>`).join('')}</select><div class="commerce-mini">Покупатель увидит цену как «за шт.», «за кг», «за набор» и т. п.</div>`;
  inv.appendChild(f);
  const q=$('quantity');if(q){q.step='0.01';q.placeholder='Оставьте пустым, если остаток не ограничен'}
}

function injectPanel(){
  const dynamic=$('dynamicFields');if(!dynamic||$('commerceAssist'))return;
  const box=document.createElement('section');box.id='commerceAssist';box.className='commerce-assist';
  box.innerHTML=`
    <div class="commerce-head"><div><b>Готовность к продаже</b><span>Проверяем цену, остаток, единицу продажи, фото и получение заказа.</span></div><strong id="commerceScore">0 / 5</strong></div>
    <div id="commerceChecklist" class="commerce-checklist"></div>
    <div id="deliveryManager" class="delivery-manager hidden">
      <div class="delivery-head"><div><b>Способы получения</b><span>Самовывоз и доставка используются в корзине покупателя.</span></div><button type="button" class="btn light small" id="deliveryNew">+ Доставка</button></div>
      <div id="deliveryList" class="delivery-list"></div>
      <form id="deliveryForm" class="delivery-form hidden">
        <input id="deliveryId" type="hidden">
        <div class="two"><div class="field"><label>Название *</label><input id="deliveryTitle" placeholder="Например, доставка по городу"></div><div class="field"><label>Стоимость, ₽ *</label><input id="deliveryPrice" type="number" min="0" step="0.01" placeholder="0 — бесплатно"></div></div>
        <div class="two"><div class="field"><label>Бесплатно от, ₽</label><input id="deliveryFreeFrom" type="number" min="0" step="0.01"></div><div class="field"><label>Минимальный заказ, ₽</label><input id="deliveryMinOrder" type="number" min="0" step="0.01"></div></div>
        <div class="two"><div class="field"><label>Город / зона</label><input id="deliveryCity" placeholder="Например, Нягань"></div><div class="field"><label>Срок</label><input id="deliveryEta" placeholder="Например, сегодня или 1–2 дня"></div></div>
        <div class="field"><label>Комментарий</label><input id="deliveryDescription" placeholder="Условия, ограничения, детали"></div>
        <div class="delivery-actions"><button class="btn small" type="submit">Сохранить способ</button><button class="btn light small" id="deliveryCancel" type="button">Отмена</button></div>
        <div id="deliveryMsg" class="msg"></div>
      </form>
    </div>`;
  dynamic.insertAdjacentElement('afterend',box);
  const st=document.createElement('style');
  st.textContent=`
    .commerce-mini{font-size:9px;color:#94a3b8;line-height:1.4;margin-top:2px}.commerce-assist{margin:12px 0 4px;padding:14px;border:1px solid #dbeafe;border-radius:15px;background:linear-gradient(135deg,#f8fbff,#fff)}
    .commerce-head,.delivery-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.commerce-head b,.delivery-head b{display:block;font-size:13px}.commerce-head span,.delivery-head span{display:block;color:#64748b;font-size:10px;line-height:1.45;margin-top:3px}.commerce-head strong{white-space:nowrap;border-radius:999px;background:#eef2ff;color:#4338ca;padding:6px 8px;font-size:9px}
    .commerce-checklist{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.commerce-check{border:1px solid #e2e8f0;border-radius:11px;padding:9px;background:#fff;font-size:10px;line-height:1.4}.commerce-check b{display:block;margin-bottom:2px}.commerce-check.good{border-color:#a7f3d0;background:#ecfdf5;color:#166534}.commerce-check.warn{border-color:#fde68a;background:#fffbeb;color:#92400e}
    .delivery-manager{margin-top:12px;border-top:1px solid #e2e8f0;padding-top:12px}.delivery-list{display:grid;gap:7px;margin-top:9px}.delivery-method{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 10px;border:1px solid #e2e8f0;border-radius:11px;background:#fff}.delivery-method b{display:block;font-size:10px}.delivery-method span{display:block;font-size:9px;color:#64748b;margin-top:2px;line-height:1.4}.delivery-method .delivery-actions{margin:0}.delivery-form{margin-top:10px;padding:11px;border:1px solid #c7d2fe;border-radius:12px;background:#fafbff}.delivery-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.delivery-empty{padding:10px;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;font-size:10px;line-height:1.5;background:#fff}.hidden{display:none!important}
    @media(max-width:650px){.commerce-checklist{grid-template-columns:1fr}.delivery-method{align-items:flex-start;flex-direction:column}.delivery-method .delivery-actions,.delivery-method .btn{width:100%}}
  `;
  document.head.appendChild(st);
  bindPanel();
}

function activePickup(){return methods.find(x=>x.is_active&&x.code==='PICKUP')||null}
function activeDeliveries(){return methods.filter(x=>x.is_active&&!['PICKUP','DIGITAL'].includes(x.code))}
function methodMeta(m){const a=[];a.push(Number(m.price||0)>0?money(m.price):'бесплатно');if(m.free_from!=null)a.push('бесплатно от '+money(m.free_from));if(m.min_order!=null)a.push('минимум '+money(m.min_order));if(m.city)a.push(m.city);if(m.eta_text)a.push(m.eta_text);return a.join(' · ')}
function renderMethods(){
  const box=$('deliveryList');if(!box)return;
  const list=methods.filter(x=>x.is_active).sort((a,b)=>(a.sort_order||100)-(b.sort_order||100));
  if(!list.length){box.innerHTML='<div class="delivery-empty">Способы получения ещё не настроены.</div>';return}
  box.innerHTML=list.map(m=>`<div class="delivery-method"><div><b>${esc(m.title)}${m.code==='PICKUP'?' · самовывоз':''}</b><span>${esc(methodMeta(m)||m.description||'')}</span></div><div class="delivery-actions">${m.code==='PICKUP'?'':`<button type="button" class="btn light small" data-delivery-edit="${m.id}">Изменить</button><button type="button" class="btn danger small" data-delivery-off="${m.id}">Отключить</button>`}</div></div>`).join('');
  document.querySelectorAll('[data-delivery-edit]').forEach(b=>b.onclick=()=>openDelivery(b.dataset.deliveryEdit));
  document.querySelectorAll('[data-delivery-off]').forEach(b=>b.onclick=()=>disableDelivery(b.dataset.deliveryOff));
}
async function loadMethods(){
  if(!await ensurePartner())return;
  const{data,error}=await s.from('partner_delivery_methods').select('id,partner_id,code,title,description,price,free_from,min_order,city,eta_text,is_active,sort_order').eq('partner_id',partnerId).order('sort_order');
  if(error)return;methods=data||[];renderMethods();updateAssist();
}
function clearDeliveryForm(){for(const id of ['deliveryId','deliveryTitle','deliveryPrice','deliveryFreeFrom','deliveryMinOrder','deliveryCity','deliveryEta','deliveryDescription'])if($(id))$(id).value='';$('deliveryMsg').textContent=''}
function openDelivery(id=''){
  clearDeliveryForm();const f=$('deliveryForm');if(!f)return;f.classList.remove('hidden');
  const m=methods.find(x=>x.id===id);if(m){$('deliveryId').value=m.id;$('deliveryTitle').value=m.title||'';$('deliveryPrice').value=m.price??'';$('deliveryFreeFrom').value=m.free_from??'';$('deliveryMinOrder').value=m.min_order??'';$('deliveryCity').value=m.city||'';$('deliveryEta').value=m.eta_text||'';$('deliveryDescription').value=m.description||''}else{$('deliveryTitle').value='';$('deliveryPrice').value=''}
  $('deliveryTitle')?.focus();
}
async function saveDelivery(e){
  e.preventDefault();if(!await ensurePartner())return;
  const title=$('deliveryTitle').value.trim(),price=num('deliveryPrice');if(!title||price==null||Number.isNaN(price)){$('deliveryMsg').className='msg err';$('deliveryMsg').textContent='Укажите название и стоимость доставки. Для бесплатной доставки поставьте 0.';return}
  const id=$('deliveryId').value;let error;
  const payload={title,description:$('deliveryDescription').value.trim()||null,price,free_from:num('deliveryFreeFrom'),min_order:num('deliveryMinOrder'),city:$('deliveryCity').value.trim()||null,eta_text:$('deliveryEta').value.trim()||null,is_active:true,updated_at:new Date().toISOString()};
  if(id){({error}=await s.from('partner_delivery_methods').update(payload).eq('id',id).eq('partner_id',partnerId))}else{payload.partner_id=partnerId;payload.code='DELIVERY_'+Date.now().toString(36).toUpperCase();payload.sort_order=20+methods.length;({error}=await s.from('partner_delivery_methods').insert(payload))}
  if(error){$('deliveryMsg').className='msg err';$('deliveryMsg').textContent='Ошибка: '+error.message;return}
  $('deliveryMsg').className='msg ok';$('deliveryMsg').textContent='Способ сохранён.';await loadMethods();setTimeout(()=>{$('deliveryForm')?.classList.add('hidden');clearDeliveryForm()},350)
}
async function disableDelivery(id){
  if(!await ensurePartner())return;const m=methods.find(x=>x.id===id);if(!m)return;
  if(!confirm(`Отключить способ «${m.title}»?`))return;
  const{error}=await s.from('partner_delivery_methods').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',id).eq('partner_id',partnerId);
  if(error)return alert(error.message);await loadMethods();
}

function readiness(){
  const t=type(),items=[];if(t!=='PRODUCT')return items;
  const price=num('price');items.push({ok:price!=null&&!Number.isNaN(price),title:'Цена',text:price==null?'Укажите цену товара.':'Указана '+money(price)});
  const q=num('quantity');items.push({ok:q==null||q>0,title:'Остаток',text:q==null?'Без ограничения остатка.':q>0?`Доступно: ${q}`:'Остаток равен 0 — покупатель не сможет заказать.'});
  const u=unitValue();items.push({ok:!!u,title:'Единица продажи',text:u?'Цена будет показана за '+u+'.':'Выберите единицу продажи.'});
  const photo=Boolean($('imageUrl')?.value?.trim())||Number(window.CUIM_SELLER_GALLERY?.count?.()||0)>0;items.push({ok:photo,title:'Фото',text:photo?'Обложка добавлена.':'Добавьте хотя бы одну фотографию.'});
  const pickup=checked('d_pickup'),delivery=checked('d_delivery'),hasDelivery=activeDeliveries().length>0;items.push({ok:pickup||(delivery&&hasDelivery),title:'Получение',text:pickup&&delivery&&hasDelivery?'Самовывоз и доставка готовы.':pickup?'Доступен самовывоз.':delivery&&hasDelivery?'Доставка настроена.':delivery?'Вы включили доставку, но способ доставки ещё не настроен.':'Выберите самовывоз или доставку.'});
  return items;
}
function updateAssist(){
  injectUnit();injectPanel();const t=type(),assist=$('commerceAssist');if(!assist)return;
  assist.classList.toggle('hidden',t!=='PRODUCT');if(t!=='PRODUCT')return;
  const list=readiness();$('commerceChecklist').innerHTML=list.map(x=>`<div class="commerce-check ${x.ok?'good':'warn'}"><b>${x.ok?'✓':'!'} ${esc(x.title)}</b>${esc(x.text)}</div>`).join('');$('commerceScore').textContent=`${list.filter(x=>x.ok).length} / ${list.length}`;
  $('deliveryManager').classList.remove('hidden');renderMethods();
}
function validateSale(){
  if(type()!=='PRODUCT'||!$('visible')?.checked)return true;
  const price=num('price'),old=num('oldPrice'),pickup=checked('d_pickup'),delivery=checked('d_delivery');
  let msg='';if(price==null||Number.isNaN(price))msg='Для товара на витрине укажите цену.';else if(old!=null&&old<=price)msg='Старая цена должна быть выше текущей цены.';else if(!unitValue())msg='Выберите единицу продажи.';else if(!pickup&&!delivery)msg='Выберите хотя бы один способ получения: самовывоз или доставка.';else if(delivery&&!activeDeliveries().length)msg='Вы включили доставку, но не настроили ни одного активного способа доставки.';
  if(!msg)return true;const fm=$('formMsg');if(fm){fm.className='msg err';fm.textContent=msg}updateAssist();return false;
}
async function resolveSavedProduct(snapshot){
  if(snapshot.id)return snapshot.id;if(!await ensurePartner())return null;
  const since=new Date(snapshot.startedAt-15000).toISOString();const{data,error}=await s.from('partner_products').select('id,title,created_at').eq('partner_id',partnerId).eq('title',snapshot.title).gte('created_at',since).order('created_at',{ascending:false}).limit(1);if(error)return null;return data?.[0]?.id||null
}
async function persistUnit(snapshot){
  const seq=++saveSeq;for(let i=0;i<300;i++){if(seq!==saveSeq)return;await new Promise(r=>setTimeout(r,200));const fm=$('formMsg');if(fm?.classList.contains('err'))return;if(!fm?.classList.contains('ok'))continue;const id=await resolveSavedProduct(snapshot);if(!id)return;const{error}=await s.from('partner_products').update({unit:snapshot.unit,updated_at:new Date().toISOString()}).eq('id',id).eq('partner_id',partnerId);if(!error&&snapshot.id){const cur=$('id')?.value;if(cur===snapshot.id&&$('saleUnit'))$('saleUnit').value=snapshot.unit||'шт'}return}}
async function loadUnitFor(id){if(!id||!await ensurePartner())return;const{data}=await s.from('partner_products').select('unit').eq('id',id).eq('partner_id',partnerId).maybeSingle();if($('saleUnit'))$('saleUnit').value=UNIT_OPTIONS.includes(data?.unit)?data.unit:(data?.unit||'шт');updateAssist()}

function bindPanel(){
  $('deliveryNew').onclick=()=>openDelivery();$('deliveryCancel').onclick=()=>{$('deliveryForm').classList.add('hidden');clearDeliveryForm()};$('deliveryForm').onsubmit=saveDelivery;
}
function bind(){
  if(installed)return;const form=$('offerForm');if(!form)return;installed=true;injectUnit();injectPanel();
  form.addEventListener('submit',e=>{if(!validateSale()){e.preventDefault();e.stopImmediatePropagation();return}const snap={id:$('id')?.value||'',title:$('title')?.value?.trim()||'',unit:type()==='PRODUCT'?unitValue():null,startedAt:Date.now()};if(type()==='PRODUCT')persistUnit(snap)},true);
  for(const id of ['price','oldPrice','quantity','saleUnit','visible','imageUrl'])$(id)?.addEventListener('input',updateAssist);
  $('section')?.addEventListener('change',()=>setTimeout(updateAssist,0));document.addEventListener('cuim:seller-gallery-change',updateAssist);
  document.addEventListener('change',e=>{if(e.target?.id==='d_pickup'||e.target?.id==='d_delivery')updateAssist()});
  document.addEventListener('click',e=>{const edit=e.target.closest('[data-edit]');if(edit)setTimeout(()=>loadUnitFor(edit.dataset.edit),120);if(e.target.closest('#newOffer,#reset'))setTimeout(()=>{if($('saleUnit'))$('saleUnit').value='шт';updateAssist()},100)});
  loadMethods();updateAssist();
}

let tries=0;const timer=setInterval(()=>{tries++;if($('offerForm')){clearInterval(timer);bind()}else if(tries>100)clearInterval(timer)},100);
