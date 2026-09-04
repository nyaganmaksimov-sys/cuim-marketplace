import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const s=createClient('https://qgakliolffnwkymoqvzn.supabase.co','sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu');
const $=id=>document.getElementById(id);
const FALLBACK_CITIES=[
  {id:'4dd4372f-98ef-4efa-ab92-102b11670a95',name:'Барнаул',slug:'barnaul',region_name:'Алтайский край',timezone:'Asia/Barnaul'},
  {id:'b3e5b0ad-f657-45ab-a718-3157fdd914ec',name:'Нягань',slug:'nyagan',region_name:'ХМАО — Югра',timezone:'Asia/Yekaterinburg'},
  {id:'a5faed33-d248-4830-8d95-71379982dfc1',name:'Москва',slug:'moscow',region_name:'Москва',timezone:'Europe/Moscow'}
];
let cities=[...FALLBACK_CITIES],areas=[],partnerId=null,installed=false;

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function type(){return({goods:'PRODUCT',services:'SERVICE',jobs:'JOB',food:'FOOD',auto:'AUTO',ads:'AD',events:'EVENT'})[$('section')?.value]||''}
function cityId(){return $('offerCity')?.value||''}
function areaId(){return $('offerArea')?.value||''}
function cityObj(){return cities.find(x=>x.id===cityId())||null}
function localGeo(){try{return JSON.parse(localStorage.getItem('cuim-geo:v1')||'null')}catch{return null}}
async function ensurePartner(){if(partnerId)return partnerId;const{data:{session}}=await s.auth.getSession();if(!session)return null;const{data,error}=await s.rpc('current_partner_id');if(error||!data)return null;partnerId=data;return data}

function inject(){
  if(installed||$('offerLocation'))return !!$('offerLocation');
  const typebox=document.querySelector('.typebox');if(!typebox)return false;
  const box=document.createElement('section');box.id='offerLocation';box.className='offer-location';
  box.innerHTML=`<div class="ol-head"><div><b>Где доступно предложение</b><span>Город влияет на выдачу товара, услуги и продавца покупателю.</span></div><strong id="offerLocationStatus">Не выбрано</strong></div><div class="two ol-fields"><div class="field"><label>Город *</label><select id="offerCity"><option value="">Выберите город</option></select></div><div class="field"><label id="offerAreaLabel">Район / населённый пункт</label><select id="offerArea"><option value="">Весь город</option></select></div></div><div id="offerLocationHint" class="ol-hint">Для товара на витрине город обязателен. Район или населённый пункт можно не указывать.</div>`;
  typebox.insertAdjacentElement('afterend',box);
  const st=document.createElement('style');st.textContent=`.offer-location{margin:0 0 14px;padding:13px;border:1px solid #dbeafe;border-radius:14px;background:linear-gradient(135deg,#f8fbff,#fff)}.ol-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.ol-head b{display:block;font-size:12px}.ol-head span{display:block;margin-top:3px;color:#64748b;font-size:10px;line-height:1.45}.ol-head strong{white-space:nowrap;padding:5px 8px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:9px}.ol-head strong.good{background:#ecfdf5;color:#166534}.ol-fields{margin-top:10px}.ol-hint{font-size:9px;line-height:1.45;color:#64748b;margin-top:-2px}@media(max-width:650px){.ol-head{display:block}.ol-head strong{display:inline-flex;margin-top:8px}}`;
  document.head.appendChild(st);
  $('offerCity').onchange=async()=>{await loadAreas(cityId());updateStatus()};
  $('offerArea').onchange=updateStatus;
  installed=true;return true;
}

function fillCities(selected=''){
  const el=$('offerCity');if(!el)return;
  el.innerHTML='<option value="">Выберите город</option>'+cities.map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.name)}</option>`).join('');
}
function areaLabel(c){if(c?.slug==='nyagan')return'Населённый пункт';if(c?.slug==='moscow')return'Округ / район';return'Район / населённый пункт'}
function fillAreas(selected=''){
  const el=$('offerArea');if(!el)return;const c=cityObj();$('offerAreaLabel').textContent=areaLabel(c);
  const all=c?.slug==='nyagan'?'Нягань / весь рынок до 300 км':'Весь город';
  el.innerHTML=`<option value="">${esc(all)}</option>`+areas.map(a=>`<option value="${esc(a.id)}" ${a.id===selected?'selected':''}>${esc(a.short_name||a.name)}</option>`).join('');
  el.disabled=!cityId()||!areas.length;
}
async function loadCities(){
  fillCities(cityId());
  const{data,error}=await s.rpc('marketplace_geo_cities',{p_query:null});
  if(!error&&data?.length){cities=data;fillCities(cityId())}
}
async function loadAreas(id,selected=''){
  areas=[];fillAreas('');if(!id)return;
  const c=cities.find(x=>x.id===id);let types=['SETTLEMENT','ADMIN_DISTRICT','DISTRICT'];
  if(c?.slug==='nyagan')types=['SETTLEMENT'];
  const{data,error}=await s.rpc('marketplace_geo_children',{p_parent_id:id,p_types:types});
  if(!error)areas=data||[];
  fillAreas(selected);
}
function updateStatus(){
  const st=$('offerLocationStatus'),c=cityObj(),a=areas.find(x=>x.id===areaId());if(!st)return;
  if(!c){st.className='';st.textContent='Не выбрано';return}
  st.className='good';st.textContent=a?(a.short_name||a.name):c.name;
}
function defaultCity(){
  const g=localGeo();return cities.find(x=>x.id===g?.city_id)?.id||cities.find(x=>x.slug===g?.city_slug)?.id||'';
}
async function resetLocation(){
  const d=defaultCity();fillCities(d);if($('offerCity'))$('offerCity').value=d;await loadAreas(d);updateStatus();
}
async function loadLocationFor(id){
  if(!id||!await ensurePartner())return;
  const{data,error}=await s.from('partner_products').select('marketplace_geo_city_id,marketplace_geo_area_id').eq('id',id).eq('partner_id',partnerId).maybeSingle();if(error)return;
  const cid=data?.marketplace_geo_city_id||defaultCity();fillCities(cid);$('offerCity').value=cid||'';await loadAreas(cid,data?.marketplace_geo_area_id||'');$('offerArea').value=data?.marketplace_geo_area_id||'';updateStatus();
}
function validate(){
  const visible=$('visible')?.checked,t=type();if(!visible||!['PRODUCT','FOOD','AUTO','AD','EVENT'].includes(t))return true;
  if(cityId())return true;
  const fm=$('formMsg');if(fm){fm.className='msg err';fm.textContent='Для публикации на витрине выберите город.'}return false;
}
function bind(){
  if(!inject())return false;const form=$('offerForm');if(!form)return false;
  form.addEventListener('submit',e=>{if(!validate()){e.preventDefault();e.stopImmediatePropagation()}},true);
  document.addEventListener('click',e=>{const edit=e.target.closest('[data-edit]');if(edit)setTimeout(()=>loadLocationFor(edit.dataset.edit),140);if(e.target.closest('#newOffer,#reset'))setTimeout(resetLocation,120)});
  loadCities().then(resetLocation);return true;
}

window.CUIM_SELLER_LOCATION={city:()=>cityId()||null,area:()=>areaId()||null};

if(!bind()){
  let n=0;const t=setInterval(()=>{n++;if(bind()||n>80)clearInterval(t)},125);
}
