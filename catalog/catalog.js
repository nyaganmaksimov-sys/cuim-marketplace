import'/geo-core.js';
import'/marketplace-card-ui.js';
import'/marketplace-reviews.js';
import'/marketplace-favorites.js';
import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const s=createClient('https://qgakliolffnwkymoqvzn.supabase.co','sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu');
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(v||0));
const order=['goods','services','jobs','food','auto','ads','events'];
const typeLabel={PRODUCT:'Товар',SERVICE:'Услуга',JOB:'Работа',FOOD:'Еда',AUTO:'Авто',AD:'Объявление',EVENT:'Афиша'};
const conditionLabel={NEW:'Новое',USED:'Б/у',REFURBISHED:'Восстановленное',OTHER:'Другое',SERVICE:'Сервис'};
const adIcons={'ads-realestate':'🏠','ads-personal':'👕','ads-appliances':'🔌','ads-furniture':'🛋️','ads-animals':'🐾','ads-build':'🧰','ads-rent':'🔑','ads-buy':'🔎','ads-free':'🎁'};
const geoPin=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>`;
let currentSection='all',currentSub='',sections=[],subs=[],all=[],shown=[],geoContext=window.CUIM_GEO?.get?.()||null;
const sectionCopy={
  all:['Все категории','Товары, услуги и предложения компаний и специалистов города в одном месте.'],
  goods:['Товары','Магазины, локальные продавцы и городские товары.'],
  services:['Услуги','Компании, мастера и специалисты для личных и деловых задач.'],
  jobs:['Работа','Вакансии, подработка, удалённая и проектная работа.'],
  food:['Еда','Кафе, рестораны, доставка и продукты в городе.'],
  auto:['Авто','Сервисы, запчасти и предложения для автомобилистов.'],
  ads:['Доска объявлений','Покупайте, продавайте, арендуйте и отдавайте вещи в своём городе — просто и без лишних шагов.'],
  events:['Афиша','Концерты, события, выставки и городские мероприятия.']
};

function geoRadiusKm(){return Math.max(1,Math.round(Number(geoContext?.radius_m||3000)/1000))}
function refreshGeoButton(){
  const b=$('cityButton');if(!b)return;geoContext=window.CUIM_GEO?.get?.()||geoContext;
  const area=geoContext?.metro_name?`м. ${geoContext.metro_name} · ${geoRadiusKm()} км`:(geoContext?.area_short_name||geoContext?.area_name||'Вся Москва');
  b.innerHTML=`${geoPin}<span><b>${esc(geoContext?.city_name||'Москва')}</b><small>${esc(area)}</small></span>`;
}
function installGeoButton(){
  const actions=document.querySelector('.top-actions');if(!actions)return;
  let b=$('cityButton');if(!b){b=document.createElement('button');b.id='cityButton';b.type='button';b.className='btn light cuim-geo-trigger';actions.prepend(b)}
  b.onclick=e=>{e.preventDefault();window.CUIM_GEO?.open?.()};refreshGeoButton();
}
function geoScopeText(){
  if(!geoContext?.city_name)return'Москва';
  if(geoContext.metro_name)return`${geoContext.city_name} · м. ${geoContext.metro_name} · ${geoRadiusKm()} км`;
  return geoContext.area_name?`${geoContext.city_name} · ${geoContext.area_short_name||geoContext.area_name}`:geoContext.city_name;
}

function sectionByKey(k){return sections.find(x=>x.section_key===k)||null}
function subByKey(k){return subs.find(x=>x.subcategory_key===k)||null}
function activeSection(){return sectionByKey(currentSection)}
function activeSub(){return subs.find(x=>x.subcategory_key===currentSub&&x.section_key===currentSection)||null}
function sectionSubs(k){return subs.filter(x=>x.section_key===k)}
function route(section,sub=''){
  if(!section||section==='all')return'/catalog/';
  const sec=sectionByKey(section),sSlug=sec?.slug||section;
  if(!sub)return`/catalog/${encodeURIComponent(sSlug)}/`;
  const sb=subByKey(sub);
  return`/catalog/${encodeURIComponent(sSlug)}/${encodeURIComponent(sb?.slug||sub)}/`;
}
function resolveRoute(){
  const p=new URLSearchParams(location.search),parts=location.pathname.split('/').filter(Boolean),pathSection=parts[0]==='catalog'?decodeURIComponent(parts[1]||''):'',pathSub=parts[0]==='catalog'?decodeURIComponent(parts[2]||''):'';
  let sec=null,sub=null;
  if(pathSection){
    sec=sections.find(x=>x.slug===pathSection||x.section_key===pathSection)||null;
    if(sec&&pathSub)sub=subs.find(x=>x.section_key===sec.section_key&&(x.slug===pathSub||x.subcategory_key===pathSub))||null;
  }else{
    const qs=p.get('section');if(qs)sec=sections.find(x=>x.section_key===qs||x.slug===qs)||null;
    const qsub=p.get('sub');if(sec&&qsub)sub=subs.find(x=>x.section_key===sec.section_key&&(x.subcategory_key===qsub||x.slug===qsub))||null;
  }
  currentSection=sec?.section_key||'all';currentSub=sub?.subcategory_key||'';
  const clean=route(currentSection,currentSub);if(location.pathname+location.search!==clean)history.replaceState(null,'',clean);
}
function text(x){
  const d=x.marketplace_details||{};
  return[x.title,x.category,x.description,x.partner_name,typeLabel[x.marketplace_offer_type],x.city,...Object.values(d).filter(v=>typeof v==='string')].filter(Boolean).join(' ').toLowerCase();
}
function setMeta(){
  const sec=activeSection(),sub=activeSub(),title=sub?.title||sec?.title||sectionCopy[currentSection]?.[0]||'Каталог',scope=geoScopeText();
  const desc=sub?`${sub.title}: актуальные предложения на городской доске и в маркетплейсе ЦУИМ.`:(sectionCopy[currentSection]?.[1]||sectionCopy.all[1]);
  document.title=`${title}${geoContext?.city_name?` в ${geoContext.city_name}`:''} — ЦУИМ`;
  document.querySelector('meta[name="description"]')?.setAttribute('content',desc+(scope?` География: ${scope}.`:''));
  let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}canonical.href=location.origin+route(currentSection,currentSub);
  $('pageTitle').textContent=title;$('pageDescription').textContent=desc;
  $('heroEyebrow').textContent=scope||currentSection==='ads'?'Объявления вашего города':sub?`${sec?.title||'Каталог'} · подкатегория`:currentSection==='all'?'Городской каталог':sec?.subtitle||'Городской раздел';
  if(scope)$('heroEyebrow').textContent=scope;
  $('contentTitle').textContent=currentSection==='ads'?(sub?.title||'Свежие объявления'):(sub?sub.title:(currentSection==='all'?'Все предложения':sec?.title||'Предложения'));
  $('contentSubtitle').textContent=(currentSection==='ads'?'Удобный поиск по частным и коммерческим объявлениям.':sub?'Предложения, которым продавец или администратор назначил эту подкатегорию.':(sectionCopy[currentSection]?.[1]||'Актуальные предложения Marketplace.'))+(scope?` · ${scope}`:'');
  $('mobileCurrent').textContent=sub?.title||sec?.title||'Все категории';
  $('heroIcon').innerHTML=sec?.icon_url?`<img src="${esc(sec.icon_url)}" alt="${esc(title)}">`:esc(sec?.icon_fallback||'⌂');
  const bc=[`<a href="/">Главная</a><span>›</span><a href="/catalog/">Каталог</a>`];if(sec)bc.push(`<span>›</span><a href="${route(sec.section_key)}">${esc(sec.title)}</a>`);if(sub)bc.push(`<span>›</span><span>${esc(sub.title)}</span>`);$('breadcrumbs').innerHTML=bc.join('');
}
function renderNavigation(){
  $('sectionStrip').innerHTML=`<a class="section-pill ${currentSection==='all'?'active':''}" href="/catalog/">Все</a>`+order.map(k=>{const x=sectionByKey(k);return x?`<a class="section-pill ${currentSection===k?'active':''}" href="${route(k)}">${esc(x.title)}</a>`:''}).join('');
  $('sidebarContent').innerHTML=`<div class="side-section"><a class="side-title ${currentSection==='all'?'active':''}" href="/catalog/">Все категории <span>→</span></a></div>`+order.map(k=>{const x=sectionByKey(k);if(!x)return'';const ss=sectionSubs(k);return`<div class="side-section"><a class="side-title ${currentSection===k&&!currentSub?'active':''}" href="${route(k)}">${esc(x.title)} <span>${ss.length}</span></a><div class="side-subs">${ss.map(v=>`<a class="side-sub ${currentSub===v.subcategory_key?'active':''}" href="${route(k,v.subcategory_key)}">${esc(v.title)}</a>`).join('')}</div></div>`}).join('');
}
function adFilters(){
  return{
    min:Number(document.getElementById('adMinPrice')?.value||0),
    max:Number(document.getElementById('adMaxPrice')?.value||0),
    condition:document.getElementById('adCondition')?.value||'',
    city:document.getElementById('adCity')?.value||'',
    photo:!!document.getElementById('adPhoto')?.checked,
    negotiable:!!document.getElementById('adNegotiable')?.checked,
    exchange:!!document.getElementById('adExchange')?.checked
  };
}
function apply(){
  const q=$('search').value.trim().toLowerCase(),seller=$('sellerFilter').value,sort=$('sort').value;
  shown=[...all];
  if(q)shown=shown.filter(x=>text(x).includes(q));
  if(seller)shown=shown.filter(x=>x.partner_id===seller);
  if(currentSection==='ads'){
    const f=adFilters();
    shown=shown.filter(x=>{const d=x.marketplace_details||{},p=x.price==null?null:Number(x.price);if(f.min&&!(p!=null&&p>=f.min))return false;if(f.max&&!(p!=null&&p<=f.max))return false;if(f.condition&&d.condition!==f.condition)return false;if(f.city&&x.city!==f.city)return false;if(f.photo&&!x.image_url)return false;if(f.negotiable&&!d.negotiable)return false;if(f.exchange&&!d.exchange)return false;return true});
  }
  if(sort==='newest')shown.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
  else if(sort==='priceAsc')shown.sort((a,b)=>sortPrice(a)-sortPrice(b));
  else if(sort==='priceDesc')shown.sort((a,b)=>sortPrice(b)-sortPrice(a));
  else if(sort==='title')shown.sort((a,b)=>String(a.title).localeCompare(String(b.title),'ru'));
  renderResults();
}
function sortPrice(x){const d=x.marketplace_details||{};if(x.marketplace_offer_type==='JOB')return Number(d.salary_from??d.salary_to??Infinity);if(x.marketplace_offer_type==='EVENT')return Number(d.ticket_price??x.price??Infinity);return Number(x.price??Infinity)}
function taxonomyLabel(x){return subByKey(x.marketplace_subcategory_key)?.title||sectionByKey(x.marketplace_section_key)?.title||x.category||'Предложение'}
function priceText(x){
  const d=x.marketplace_details||{},t=x.marketplace_offer_type;
  if(t==='JOB'){const a=d.salary_from,b=d.salary_to,p={MONTH:'в месяц',SHIFT:'за смену',HOUR:'в час',PROJECT:'за проект'}[d.salary_period]||'';if(a!=null&&b!=null)return`${money(a)}–${money(b)} ${p}`;if(a!=null)return`от ${money(a)} ${p}`;if(b!=null)return`до ${money(b)} ${p}`;return'Зарплата по договорённости'}
  if(t==='EVENT'){const v=d.ticket_price??x.price;if(v==null)return'Цена билета не указана';if(Number(v)===0)return'Бесплатно';return`Билет ${money(v)}`}
  if(t==='SERVICE'){if(x.price==null)return'Цена по запросу';const suffix={HOUR:' / час',FROM:' и выше',NEGOTIABLE:' · договорная'}[d.price_unit]||'';return`${money(x.price)}${suffix}`}
  return x.price==null?'Цена по договорённости':money(x.price);
}
function factList(x){
  const d=x.marketplace_details||{},t=x.marketplace_offer_type,a=[];
  if(t==='PRODUCT'){if(d.condition)a.push(conditionLabel[d.condition]||d.condition);if(d.delivery)a.push('Доставка');if(d.pickup)a.push('Самовывоз');if(d.warranty_months)a.push(`Гарантия ${d.warranty_months} мес.`)}
  if(t==='SERVICE'){if(d.format)a.push({ONSITE:'На месте',REMOTE:'Удалённо',HYBRID:'На месте или удалённо'}[d.format]||d.format);if(d.duration_minutes)a.push(`${d.duration_minutes} мин.`);if(d.service_area)a.push(d.service_area)}
  if(t==='JOB'){if(d.employment_type)a.push({FULL:'Полная занятость',PART:'Частичная занятость',PROJECT:'Проектная работа',INTERNSHIP:'Стажировка'}[d.employment_type]||d.employment_type);if(d.schedule)a.push(d.schedule);if(d.remote)a.push('Удалённо');if(d.experience)a.push({NONE:'Без опыта','1_3':'Опыт 1–3 года','3_6':'Опыт 3–6 лет','6_PLUS':'Опыт 6+ лет'}[d.experience]||d.experience)}
  if(t==='FOOD'){if(d.weight)a.push(`${d.weight} ${d.weight_unit||'г'}`);if(d.cooking_minutes)a.push(`Готовность ~${d.cooking_minutes} мин.`);if(d.delivery)a.push('Доставка')}
  if(t==='AUTO'){if(d.brand)a.push(d.brand);if(d.model_compatibility)a.push(d.model_compatibility);if(d.condition)a.push(conditionLabel[d.condition]||d.condition);if(d.installation)a.push('Установка / работы')}
  if(t==='AD'){if(d.condition)a.push(conditionLabel[d.condition]||d.condition);if(d.negotiable)a.push('Торг');if(d.exchange)a.push('Обмен')}
  if(t==='EVENT'){if(d.start_at){const dt=new Date(d.start_at);if(!Number.isNaN(dt.getTime()))a.push(dt.toLocaleString('ru-RU',{day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'}))}if(d.venue)a.push(d.venue);if(d.age_limit)a.push(d.age_limit)}
  return a.filter(Boolean).slice(0,3);
}
function actionHtml(x){
  const t=x.marketplace_offer_type;
  if(['PRODUCT','FOOD'].includes(t))return`<button class="primary" data-cart="${x.id}">В корзину</button><a class="secondary" href="/offer.html?id=${encodeURIComponent(x.id)}">Подробнее</a>`;
  const label={SERVICE:'Заказать',JOB:'Откликнуться',AUTO:'Связаться',AD:'Связаться',EVENT:'Подробнее'}[t]||'Подробнее';
  return`<a class="primary" href="/offer.html?id=${encodeURIComponent(x.id)}">${label}</a><a class="secondary" href="/seller.html?id=${encodeURIComponent(x.partner_id)}">Компания</a>`;
}
function timeAgo(v){
  if(!v)return'Недавно';const d=new Date(v);if(Number.isNaN(d.getTime()))return'Недавно';const days=Math.floor((Date.now()-d.getTime())/86400000);if(days<=0)return'Сегодня';if(days===1)return'Вчера';if(days<7)return`${days} дн. назад`;return d.toLocaleDateString('ru-RU',{day:'2-digit',month:'short'});
}
function favoriteIds(){try{return JSON.parse(localStorage.getItem('cuim-classified-favorites')||'[]')}catch{return[]}}
function locationText(x){
  const base=[x.city,x.address].filter(Boolean).join(', ')||'Москва';
  if(geoContext?.metro_name&&Number.isFinite(Number(x.metro_distance_m)))return`${base} · ${Math.max(0.1,Number(x.metro_distance_m)/1000).toFixed(Number(x.metro_distance_m)<1000?1:0)} км от м. ${geoContext.metro_name}`;
  return base;
}
function adCard(x){
  const d=x.marketplace_details||{},facts=[];if(d.condition)facts.push(`<span class="ad-fact">${esc(conditionLabel[d.condition]||d.condition)}</span>`);if(d.negotiable)facts.push('<span class="ad-fact hot">Торг</span>');if(d.exchange)facts.push('<span class="ad-fact">Обмен</span>');
  const saved=favoriteIds().includes(x.id),desc=String(x.description||'').trim();
  return`<article class="product ad-card"><div class="product-img">${x.image_url?`<img src="${esc(x.image_url)}" loading="lazy" alt="${esc(x.title)}">`:'<div class="ad-no-photo">📷<span>Без фото</span></div>'}<span class="badge">${esc(taxonomyLabel(x))}</span><button class="ad-favorite ${saved?'saved':''}" data-ad-fav="${x.id}" aria-label="Сохранить">${saved?'♥':'♡'}</button><span class="ad-time">${esc(timeAgo(x.created_at))}</span></div><div class="product-body"><div class="seller">Продавец · <a href="/seller.html?id=${encodeURIComponent(x.partner_id)}">${esc(x.partner_name||'Участник города')}</a></div><h3>${esc(x.title)}</h3><div class="price">${esc(priceText(x))}</div>${desc?`<div class="ad-description">${esc(desc)}</div>`:''}${facts.length?`<div class="ad-facts">${facts.join('')}</div>`:''}<div class="ad-location">📍 ${esc(locationText(x))}</div><div class="product-actions"><a class="primary" href="/seller.html?id=${encodeURIComponent(x.partner_id)}">Связаться</a><a class="secondary" href="/seller.html?id=${encodeURIComponent(x.partner_id)}">Профиль</a></div></div></article>`;
}
function card(x){
  if(currentSection==='ads')return adCard(x);
  const facts=factList(x);
  return`<article class="product" data-offer="${x.id}"><div class="product-img">${x.image_url?`<img src="${esc(x.image_url)}" loading="lazy" alt="${esc(x.title)}">`:'<span class="empty" style="padding:10px;border:0;background:transparent">Нет фото</span>'}<span class="badge">${esc(taxonomyLabel(x))}</span></div><div class="product-body"><div class="seller">${esc(typeLabel[x.marketplace_offer_type]||'Предложение')} · <a href="/seller.html?id=${encodeURIComponent(x.partner_id)}">${esc(x.partner_name||'Участник города')}</a></div><h3>${esc(x.title)}</h3><div class="price">${esc(priceText(x))}</div>${facts.length?`<div class="address">${facts.map(esc).join(' · ')}</div>`:''}<div class="address">${esc(locationText(x))}</div><div class="product-actions">${actionHtml(x)}</div></div></article>`;
}
function renderResults(){
  const noun=currentSection==='ads'?'объявлений':'предложений';$('resultCount').textContent=`${shown.length} ${noun}`;$('offersMeta').textContent=`${shown.length} ${noun}`;
  const companiesMap=new Map;for(const x of shown){if(!x.partner_id)continue;if(!companiesMap.has(x.partner_id))companiesMap.set(x.partner_id,{id:x.partner_id,name:x.partner_name||'Участник города',city:x.city||'',count:0});companiesMap.get(x.partner_id).count++}
  const companies=[...companiesMap.values()];$('companiesMeta').textContent=currentSection==='ads'?'Частные и коммерческие предложения':`${companies.length} компаний и специалистов`;
  if(shown.length)$('products').innerHTML=shown.map(card).join('');
  else if(currentSection==='ads')$('products').innerHTML=`<div class="classifieds-empty"><div class="empty-icon">📣</div><h3>Здесь пока свободно</h3><p>Разместите первое объявление — добавление занимает пару минут, а фотографию можно загрузить прямо с телефона или компьютера.</p><a class="btn" href="/post-ad.html">+ Подать объявление</a></div>`;
  else $('products').innerHTML='<div class="empty"><b>В этой категории пока нет предложений.</b><br>Страница готова — новые публикации появятся здесь после назначения категории.</div>';
  $('companies').innerHTML=companies.length?companies.slice(0,12).map(x=>`<a class="company" href="/seller.html?id=${encodeURIComponent(x.id)}"><div class="avatar">${esc(String(x.name).split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase())}</div><div><b>${esc(x.name)}</b><span>${x.count} предложений${x.city?` · ${esc(x.city)}`:''}</span></div></a>`).join(''):'<div class="empty">Компании появятся здесь вместе с предложениями.</div>';
  $('companiesBlock').style.display=currentSection==='ads'?'none':companies.length?'block':'none';
  bindOfferCards();bindCart();bindAdFavorites();
}
function bindOfferCards(){document.querySelectorAll('[data-offer]').forEach(el=>el.onclick=e=>{if(e.target.closest('a,button'))return;location.href='/offer.html?id='+encodeURIComponent(el.dataset.offer)})}
function bindCart(){document.querySelectorAll('[data-cart]').forEach(b=>b.onclick=e=>{e.stopPropagation();const key='cuim-cart:v1';let a=[];try{a=JSON.parse(localStorage.getItem(key)||'[]')}catch{}const f=a.find(v=>v.product_id===b.dataset.cart);f?f.quantity++:a.push({product_id:b.dataset.cart,quantity:1});localStorage.setItem(key,JSON.stringify(a));b.textContent='Добавлено ✓';setTimeout(()=>b.textContent='В корзину',1100)})}
function bindAdFavorites(){document.querySelectorAll('[data-ad-fav]').forEach(b=>b.onclick=()=>{let a=favoriteIds();const id=b.dataset.adFav;if(a.includes(id))a=a.filter(v=>v!==id);else a.push(id);localStorage.setItem('cuim-classified-favorites',JSON.stringify(a));b.classList.toggle('saved',a.includes(id));b.textContent=a.includes(id)?'♥':'♡'})}
function renderSellerFilter(){const g=new Map;for(const x of all)if(x.partner_id&&!g.has(x.partner_id))g.set(x.partner_id,x.partner_name||'Компания');$('sellerFilter').innerHTML=`<option value="">${currentSection==='ads'?'Все продавцы':'Все компании'}</option>`+[...g.entries()].sort((a,b)=>a[1].localeCompare(b[1],'ru')).map(([id,n])=>`<option value="${esc(id)}">${esc(n)}</option>`).join('')}
function setupClassifieds(){
  const ads=currentSection==='ads';document.body.classList.toggle('mode-ads',ads);if(!ads)return;
  if(!document.querySelector('link[href="/catalog/classifieds.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/catalog/classifieds.css';document.head.appendChild(l)}
  $('search').placeholder='Что вы ищете? Например: диван, квартира, телефон';
  $('sort').innerHTML='<option value="newest">Сначала новые</option><option value="priceAsc">Сначала дешевле</option><option value="priceDesc">Сначала дороже</option><option value="title">По названию</option>';
  const cities=[...new Set(all.map(x=>x.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
  const host=document.createElement('section');host.className='classifieds-comfort';
  const adsSubs=sectionSubs('ads');
  host.innerHTML=`<div class="classifieds-intro"><div><h2>Найдите нужное рядом</h2><p>Покупайте и продавайте вещи, недвижимость и другие предложения внутри города.</p></div><a class="btn classifieds-post" href="/post-ad.html">+ Подать объявление</a></div><div class="classifieds-chips">${adsSubs.map(x=>`<a class="classifieds-chip ${currentSub===x.subcategory_key?'active':''}" href="${route('ads',x.subcategory_key)}"><span>${adIcons[x.subcategory_key]||'📌'}</span>${esc(x.title)}</a>`).join('')}</div><div class="classifieds-filters"><label>Цена от<input id="adMinPrice" type="number" min="0" step="1" placeholder="0"></label><label>Цена до<input id="adMaxPrice" type="number" min="0" step="1" placeholder="Любая"></label><label>Состояние<select id="adCondition"><option value="">Любое</option><option value="NEW">Новое</option><option value="USED">Б/у</option><option value="OTHER">Другое</option></select></label><label>Город<select id="adCity"><option value="">Все города</option>${cities.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></label><div class="classifieds-checks"><label><input id="adPhoto" type="checkbox"> Только с фото</label><label><input id="adNegotiable" type="checkbox"> Возможен торг</label><label><input id="adExchange" type="checkbox"> Обмен</label></div><button class="btn light classifieds-reset" id="adReset" type="button">Сбросить</button></div>`;
  const toolbar=document.querySelector('.toolbar');toolbar.parentNode.insertBefore(host,toolbar);
  ['adMinPrice','adMaxPrice'].forEach(id=>$(id).addEventListener('input',apply));['adCondition','adCity','adPhoto','adNegotiable','adExchange'].forEach(id=>$(id).addEventListener('change',apply));
  $('adReset').onclick=()=>{['adMinPrice','adMaxPrice'].forEach(id=>$(id).value='');['adCondition','adCity'].forEach(id=>$(id).value='');['adPhoto','adNegotiable','adExchange'].forEach(id=>$(id).checked=false);apply()};
}
async function load(){
  await window.CUIM_GEO?.ready?.catch?.(()=>{});geoContext=window.CUIM_GEO?.get?.()||geoContext;refreshGeoButton();
  const[secR,subR]=await Promise.all([s.from('marketplace_city_sections').select('section_key,slug,title,subtitle,icon_url,icon_fallback,sort_order').eq('active',true).order('sort_order'),s.from('marketplace_city_subcategories').select('section_key,subcategory_key,slug,title,sort_order').eq('active',true).order('sort_order')]);
  if(secR.error||subR.error){$('products').innerHTML=`<div class="empty">Не удалось загрузить структуру каталога.<br>${esc(secR.error?.message||subR.error?.message||'')}</div>`;return}
  sections=(secR.data||[]).filter(x=>x.section_key!=='all');subs=subR.data||[];resolveRoute();
  const{data,error}=await s.rpc('marketplace_catalog_products_v4',{p_query:null,p_section:currentSection==='all'?null:currentSection,p_subcategory:currentSub||null,p_partner_id:null,p_city_id:geoContext?.city_id||null,p_area_id:geoContext?.area_id||null,p_metro_id:geoContext?.metro_id||null,p_radius_m:Number(geoContext?.radius_m||3000)});
  if(error){$('products').innerHTML=`<div class="empty">Не удалось загрузить каталог.<br>${esc(error.message)}</div>`;return}
  all=data||[];setMeta();renderNavigation();renderSellerFilter();setupClassifieds();apply();
}
installGeoButton();
window.addEventListener('cuim:geo-change',e=>{const next=e.detail||null;const same=next?.city_id===geoContext?.city_id&&next?.area_id===geoContext?.area_id&&next?.metro_id===geoContext?.metro_id&&Number(next?.radius_m||3000)===Number(geoContext?.radius_m||3000);geoContext=next;refreshGeoButton();if(!same)location.reload()});
$('search').oninput=apply;$('searchBtn').onclick=apply;$('sellerFilter').onchange=apply;$('sort').onchange=apply;$('search').onkeydown=e=>{if(e.key==='Enter')apply()};
const openSide=()=>{$('catalogSidebar').classList.add('open');$('sidebarShade').classList.add('show')},closeSide=()=>{$('catalogSidebar').classList.remove('open');$('sidebarShade').classList.remove('show')};
$('sidebarOpen').onclick=openSide;$('sidebarClose').onclick=closeSide;$('sidebarShade').onclick=closeSide;
load();