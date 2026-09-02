import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';
const s=createClient('https://qgakliolffnwkymoqvzn.supabase.co','sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu');
const KEY='cuim-geo:v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pin=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>`;
const metroIcon=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 19 3-14h8l3 14M7 15h10M8 9h8M6 19h12M9 19l-2 3m8-3 2 3"/></svg>`;
function readLocal(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
let context=readLocal();
if(context?.city_slug==='nyagan'){localStorage.removeItem(KEY);context=null}
let cities=[],admins=[],districts=[],metros=[];
let selectedCity=null,selectedAdmin=null,selectedArea=null,selectedMetro=null,selectedRadius=3000;
let readyResolve;
const ready=new Promise(r=>readyResolve=r);

function contextDetail(v){
  if(!v?.city_name)return'Город и район';
  if(v.metro_name)return`м. ${v.metro_name} · ${Math.round(Number(v.radius_m||3000)/1000)} км`;
  if(v.area_name)return v.area_short_name||v.area_name;
  return'Вся Москва';
}
function writeLocal(v,{emit=true}={}){
  context=v;
  if(v)localStorage.setItem(KEY,JSON.stringify(v));else localStorage.removeItem(KEY);
  applyContext();
  if(emit)window.dispatchEvent(new CustomEvent('cuim:geo-change',{detail:v}));
}
function applyContext(){
  const b=document.getElementById('cityButton');
  if(b){b.classList.add('cuim-geo-trigger');b.innerHTML=`${pin}<span><b>${esc(context?.city_name||'Москва')}</b><small>${esc(contextDetail(context))}</small></span>`}
  const q=document.getElementById('q');if(q&&context?.city_name)q.placeholder=`Что ищете в ${context.city_name}?`;
  document.documentElement.dataset.cuimCity=context?.city_slug||'';
}
function installStyle(){
  if(document.getElementById('cuimGeoStyle'))return;
  const st=document.createElement('style');st.id='cuimGeoStyle';st.textContent=`
  .cuim-geo-trigger{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;text-align:left!important}.cuim-geo-trigger>svg{width:21px;height:21px;flex:0 0 auto}.cuim-geo-trigger span{display:grid;min-width:0}.cuim-geo-trigger b{font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cuim-geo-trigger small{font-size:10px;opacity:.72;font-weight:650;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cuim-geo-shade{position:fixed;inset:0;background:#02061780;backdrop-filter:blur(5px);z-index:1000;opacity:0;pointer-events:none;transition:.18s}.cuim-geo-shade.show{opacity:1;pointer-events:auto}
  .cuim-geo-modal{position:fixed;z-index:1001;left:50%;top:50%;transform:translate(-50%,-46%) scale(.98);width:min(820px,calc(100% - 28px));max-height:min(820px,calc(100vh - 28px));overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:24px;box-shadow:0 30px 90px #02061755;opacity:0;pointer-events:none;transition:.18s}.cuim-geo-modal.show{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}
  .cuim-geo-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 22px 16px;border-bottom:1px solid #eef2f7;position:sticky;top:0;background:#fff;z-index:5}.cuim-geo-head h2{margin:0;font-size:23px}.cuim-geo-head p{margin:5px 0 0;color:#64748b;font-size:13px}.cuim-geo-close{border:1px solid #e2e8f0;background:#fff;border-radius:12px;width:38px;height:38px;font-size:24px;cursor:pointer}
  .cuim-geo-body{padding:18px 22px 22px}.cuim-geo-locate{width:100%;border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8;border-radius:13px;padding:11px 13px;font-weight:850;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}.cuim-geo-locate svg{width:18px;height:18px}.cuim-geo-locate:disabled{opacity:.65;cursor:wait}
  .cuim-geo-label{margin:18px 0 9px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:900}.cuim-geo-note{font-size:11px;color:#94a3b8;margin:-4px 0 10px}.cuim-geo-search{width:100%;border:1px solid #cbd5e1;border-radius:13px;padding:12px 14px;font:inherit;outline:none;box-sizing:border-box}.cuim-geo-search:focus{border-color:#6366f1;box-shadow:0 0 0 3px #6366f11a}
  .cuim-geo-cities,.cuim-geo-admins,.cuim-geo-districts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cuim-geo-option{border:1px solid #e2e8f0;background:#fff;border-radius:15px;padding:12px 13px;text-align:left;cursor:pointer;min-width:0}.cuim-geo-option:hover{border-color:#a5b4fc;background:#f8faff}.cuim-geo-option.active{border-color:#6366f1;background:#eef2ff;box-shadow:inset 0 0 0 1px #6366f1}.cuim-geo-option b{display:block;color:#0f172a;font-size:14px}.cuim-geo-option span{display:block;color:#64748b;font-size:11px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cuim-geo-metro-tools{display:grid;grid-template-columns:1fr auto;gap:8px}.cuim-geo-clear{border:1px solid #e2e8f0;background:#fff;border-radius:13px;padding:0 14px;font-weight:800;color:#475569;cursor:pointer}.cuim-geo-metros{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px;max-height:250px;overflow:auto;padding-right:3px}.cuim-geo-metro{display:flex;align-items:center;gap:9px}.cuim-geo-metro>svg{width:18px;height:18px;flex:0 0 auto;color:#2563eb}.cuim-geo-metro b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cuim-geo-radius{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.cuim-geo-radius button{border:1px solid #dbe3ef;background:#fff;border-radius:999px;padding:8px 13px;font-weight:850;color:#475569;cursor:pointer}.cuim-geo-radius button.active{background:#0f172a;color:#fff;border-color:#0f172a}
  .cuim-geo-empty{padding:17px;border:1px dashed #cbd5e1;border-radius:14px;color:#64748b;font-size:12px;text-align:center;grid-column:1/-1}.cuim-geo-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px;padding-top:17px;border-top:1px solid #eef2f7}.cuim-geo-current{font-size:12px;color:#64748b;line-height:1.45}.cuim-geo-current b{display:block;color:#0f172a;font-size:13px}.cuim-geo-save{border:0;border-radius:13px;padding:12px 20px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-weight:900;cursor:pointer}.cuim-geo-save:disabled{opacity:.55;cursor:default}
  @media(max-width:560px){.cuim-geo-modal{top:auto;bottom:0;left:0;width:100%;max-height:90vh;border-radius:24px 24px 0 0;transform:translateY(20px)}.cuim-geo-modal.show{transform:none}.cuim-geo-cities,.cuim-geo-admins,.cuim-geo-districts,.cuim-geo-metros{grid-template-columns:1fr}.cuim-geo-head,.cuim-geo-body{padding-left:16px;padding-right:16px}.cuim-geo-foot{align-items:stretch;flex-direction:column}.cuim-geo-save{width:100%}.cuim-geo-metros{max-height:220px}}
  `;document.head.appendChild(st);
}
function installModal(){
  if(document.getElementById('cuimGeoModal'))return;
  document.body.insertAdjacentHTML('beforeend',`<div class="cuim-geo-shade" id="cuimGeoShade"></div><section class="cuim-geo-modal" id="cuimGeoModal" role="dialog" aria-modal="true" aria-labelledby="cuimGeoTitle"><div class="cuim-geo-head"><div><h2 id="cuimGeoTitle">Где искать в Москве?</h2><p>Выберите округ, район или станцию метро. Можно оставить всю Москву.</p></div><button class="cuim-geo-close" id="cuimGeoClose" aria-label="Закрыть">×</button></div><div class="cuim-geo-body"><button class="cuim-geo-locate" id="cuimGeoLocate">${pin}<span>Определить район и ближайшее метро</span></button><div class="cuim-geo-label">Город</div><div class="cuim-geo-cities" id="cuimGeoCities"><div class="cuim-geo-empty">Загрузка…</div></div><div class="cuim-geo-label">Административный округ</div><div class="cuim-geo-admins" id="cuimGeoAdmins"><div class="cuim-geo-empty">Сначала выберите город</div></div><div id="cuimGeoDistrictBlock" hidden><div class="cuim-geo-label">Район</div><div class="cuim-geo-districts" id="cuimGeoDistricts"></div></div><div class="cuim-geo-label">Метро</div><div class="cuim-geo-note">Метро — дополнительный фильтр. Радиус считается от станции по реальным координатам.</div><div class="cuim-geo-metro-tools"><input class="cuim-geo-search" id="cuimGeoMetroSearch" placeholder="Например: Беляево, Тверская, Вавиловская"><button class="cuim-geo-clear" id="cuimGeoMetroClear" type="button">Сбросить</button></div><div class="cuim-geo-metros" id="cuimGeoMetros"><div class="cuim-geo-empty">Сначала выберите город</div></div><div class="cuim-geo-radius" id="cuimGeoRadius"><button data-radius="1000">1 км</button><button data-radius="3000">3 км</button><button data-radius="5000">5 км</button><button data-radius="10000">10 км</button></div><div class="cuim-geo-foot"><div class="cuim-geo-current" id="cuimGeoCurrent">Москва · весь город</div><button class="cuim-geo-save" id="cuimGeoSave">Применить</button></div></div></section>`);
  const close=()=>{document.getElementById('cuimGeoShade').classList.remove('show');document.getElementById('cuimGeoModal').classList.remove('show')};
  document.getElementById('cuimGeoClose').onclick=close;document.getElementById('cuimGeoShade').onclick=close;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  document.getElementById('cuimGeoLocate').onclick=locate;
  document.getElementById('cuimGeoMetroSearch').oninput=renderMetros;
  document.getElementById('cuimGeoMetroClear').onclick=()=>{selectedMetro=null;document.getElementById('cuimGeoMetroSearch').value='';renderMetros();renderCurrent()};
  document.getElementById('cuimGeoRadius').onclick=e=>{const b=e.target.closest('[data-radius]');if(!b)return;selectedRadius=Number(b.dataset.radius)||3000;renderRadius();renderCurrent()};
  document.getElementById('cuimGeoSave').onclick=save;
}
function renderCities(){
  const host=document.getElementById('cuimGeoCities');if(!host)return;
  host.innerHTML=cities.length?cities.map(x=>`<button class="cuim-geo-option ${selectedCity?.id===x.id?'active':''}" data-city="${x.id}"><b>${esc(x.name)}</b><span>${x.slug==='moscow'?'Основной рынок ЦУИМ':esc(x.region_name||'')}</span></button>`).join(''):'<div class="cuim-geo-empty">Активные города пока не найдены.</div>';
  host.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>chooseCity(cities.find(x=>x.id===b.dataset.city));
}
async function loadCities(){const{data,error}=await s.rpc('marketplace_geo_cities',{p_query:null});if(error)throw error;cities=data||[];renderCities()}
async function loadAdmins(){
  admins=[];if(!selectedCity)return renderAdmins();
  const{data,error}=await s.rpc('marketplace_geo_children',{p_parent_id:selectedCity.id,p_types:['ADMIN_DISTRICT']});
  if(!error)admins=data||[];renderAdmins();
}
function renderAdmins(){
  const host=document.getElementById('cuimGeoAdmins');if(!host)return;
  if(!selectedCity){host.innerHTML='<div class="cuim-geo-empty">Сначала выберите город.</div>';return}
  host.innerHTML=`<button class="cuim-geo-option ${!selectedAdmin?'active':''}" data-admin=""><b>Вся Москва</b><span>Без ограничения по округу</span></button>`+admins.map(x=>`<button class="cuim-geo-option ${selectedAdmin?.id===x.id?'active':''}" data-admin="${x.id}"><b>${esc(x.short_name||x.name)}</b><span>${esc(x.name)}</span></button>`).join('');
  host.querySelectorAll('[data-admin]').forEach(b=>b.onclick=()=>chooseAdmin(admins.find(x=>x.id===b.dataset.admin)||null));
}
async function chooseAdmin(admin,keepArea=null){
  selectedAdmin=admin;districts=[];
  if(!admin){selectedArea=null;renderAdmins();renderDistricts();renderCurrent();return}
  selectedArea=keepArea||admin;renderAdmins();
  const block=document.getElementById('cuimGeoDistrictBlock');if(block)block.hidden=false;
  const host=document.getElementById('cuimGeoDistricts');if(host)host.innerHTML='<div class="cuim-geo-empty">Загрузка районов…</div>';
  const{data,error}=await s.rpc('marketplace_geo_children',{p_parent_id:admin.id,p_types:['DISTRICT','SETTLEMENT','NEIGHBORHOOD']});
  if(!error)districts=data||[];renderDistricts();renderCurrent();
}
function renderDistricts(){
  const block=document.getElementById('cuimGeoDistrictBlock'),host=document.getElementById('cuimGeoDistricts');if(!block||!host)return;
  if(!selectedAdmin){block.hidden=true;host.innerHTML='';return}
  block.hidden=false;
  host.innerHTML=`<button class="cuim-geo-option ${selectedArea?.id===selectedAdmin.id?'active':''}" data-district=""><b>Весь ${esc(selectedAdmin.short_name||'округ')}</b><span>Все районы округа</span></button>`+(districts.length?districts.map(x=>`<button class="cuim-geo-option ${selectedArea?.id===x.id?'active':''}" data-district="${x.id}"><b>${esc(x.short_name||x.name)}</b><span>Район Москвы</span></button>`).join(''):'<div class="cuim-geo-empty">Районы округа пока не добавлены.</div>');
  host.querySelectorAll('[data-district]').forEach(b=>b.onclick=()=>{selectedArea=districts.find(x=>x.id===b.dataset.district)||selectedAdmin;renderDistricts();renderCurrent()});
}
async function loadMetros(){
  metros=[];if(!selectedCity)return renderMetros();
  const{data,error}=await s.rpc('marketplace_geo_children',{p_parent_id:selectedCity.id,p_types:['METRO']});
  if(!error)metros=(data||[]).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru'));renderMetros();
}
function renderMetros(){
  const host=document.getElementById('cuimGeoMetros');if(!host)return;
  if(!selectedCity){host.innerHTML='<div class="cuim-geo-empty">Сначала выберите город.</div>';return}
  const q=(document.getElementById('cuimGeoMetroSearch')?.value||'').trim().toLowerCase();
  let list=metros.filter(x=>!q||String(x.name).toLowerCase().includes(q));
  if(!q&&selectedMetro){const i=list.findIndex(x=>x.id===selectedMetro.id);if(i>0)list=[list[i],...list.slice(0,i),...list.slice(i+1)]}
  list=list.slice(0,q?80:40);
  host.innerHTML=list.length?list.map(x=>`<button class="cuim-geo-option cuim-geo-metro ${selectedMetro?.id===x.id?'active':''}" data-metro="${x.id}">${metroIcon}<b>${esc(x.name)}</b></button>`).join(''):'<div class="cuim-geo-empty">Станция не найдена.</div>';
  host.querySelectorAll('[data-metro]').forEach(b=>b.onclick=()=>{selectedMetro=metros.find(x=>x.id===b.dataset.metro)||null;renderMetros();renderCurrent()});
}
function renderRadius(){document.querySelectorAll('#cuimGeoRadius [data-radius]').forEach(b=>b.classList.toggle('active',Number(b.dataset.radius)===selectedRadius))}
async function chooseCity(city,{keep=false}={}){
  selectedCity=city;if(!keep){selectedAdmin=null;selectedArea=null;selectedMetro=null;selectedRadius=3000}
  renderCities();await Promise.all([loadAdmins(),loadMetros()]);renderRadius();renderCurrent();
}
function renderCurrent(){
  const el=document.getElementById('cuimGeoCurrent'),saveBtn=document.getElementById('cuimGeoSave');if(!el||!saveBtn)return;
  if(!selectedCity){el.textContent='Выберите город';saveBtn.disabled=true;return}
  const parts=[selectedCity.name];
  if(selectedArea)parts.push(selectedArea.short_name||selectedArea.name);
  if(selectedMetro)parts.push(`м. ${selectedMetro.name} · ${Math.round(selectedRadius/1000)} км`);
  el.innerHTML=`<b>${esc(parts.join(' · '))}</b><span>${selectedMetro?'Будут приоритетны предложения рядом со станцией.':'Можно добавить метро для поиска рядом.'}</span>`;
  saveBtn.disabled=false;
}
async function restoreSelection(){
  if(!selectedCity)return;
  await Promise.all([loadAdmins(),loadMetros()]);
  selectedRadius=Number(context?.radius_m||3000);
  if(![1000,3000,5000,10000].includes(selectedRadius))selectedRadius=3000;
  const adminId=context?.admin_id||(admins.some(x=>x.id===context?.area_id)?context.area_id:null);
  if(adminId){const a=admins.find(x=>x.id===adminId);if(a){let keep=null;if(context?.area_id&&context.area_id!==a.id)keep={id:context.area_id,name:context.area_name,short_name:context.area_short_name,place_type:context.area_type};await chooseAdmin(a,keep);if(keep){const real=districts.find(x=>x.id===keep.id);if(real)selectedArea=real}}}
  if(context?.metro_id)selectedMetro=metros.find(x=>x.id===context.metro_id)||null;
  renderAdmins();renderDistricts();renderMetros();renderRadius();renderCurrent();
}
async function open(){
  installStyle();installModal();
  document.getElementById('cuimGeoShade').classList.add('show');document.getElementById('cuimGeoModal').classList.add('show');
  if(!cities.length)await loadCities();
  const c=cities.find(x=>x.id===context?.city_id)||cities.find(x=>x.slug==='moscow')||cities[0];
  if(c){selectedCity=c;selectedAdmin=null;selectedArea=null;selectedMetro=null;await restoreSelection()}else renderCurrent();
}
async function save(){
  if(!selectedCity)return;
  const v={version:2,city_id:selectedCity.id,city_name:selectedCity.name,city_slug:selectedCity.slug,region_name:selectedCity.region_name,timezone:selectedCity.timezone,lat:selectedCity.lat,lng:selectedCity.lng,admin_id:selectedAdmin?.id||null,admin_name:selectedAdmin?.name||null,admin_short_name:selectedAdmin?.short_name||null,area_id:selectedArea?.id||null,area_name:selectedArea?.name||null,area_short_name:selectedArea?.short_name||null,area_type:selectedArea?.place_type||null,metro_id:selectedMetro?.id||null,metro_name:selectedMetro?.name||null,radius_m:selectedMetro?selectedRadius:3000,updated_at:new Date().toISOString()};
  writeLocal(v);
  const btn=document.getElementById('cuimGeoSave');btn.disabled=true;
  try{const{data:{user}}=await s.auth.getUser();if(user)await s.rpc('marketplace_set_my_geo_context_v2',{p_city_id:v.city_id,p_area_id:v.area_id,p_metro_id:v.metro_id,p_radius_m:v.radius_m})}catch{}finally{btn.disabled=false;document.getElementById('cuimGeoShade').classList.remove('show');document.getElementById('cuimGeoModal').classList.remove('show')}
}
async function locate(){
  const btn=document.getElementById('cuimGeoLocate');if(!navigator.geolocation){btn.querySelector('span').textContent='Геопозиция не поддерживается';return}
  btn.disabled=true;btn.querySelector('span').textContent='Определяем район и метро…';
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const{data,error}=await s.rpc('marketplace_geo_resolve_point',{p_lat:pos.coords.latitude,p_lng:pos.coords.longitude});if(error)throw error;
      const found=data?.[0];if(!found?.city_id){btn.querySelector('span').textContent='Сейчас ЦУИМ запускается в Москве';return}
      if(!cities.length)await loadCities();const city=cities.find(x=>x.id===found.city_id);if(!city)throw new Error('city');
      selectedCity=city;selectedAdmin=null;selectedArea=null;selectedMetro=null;await Promise.all([loadAdmins(),loadMetros()]);
      if(found.admin_id){const a=admins.find(x=>x.id===found.admin_id);if(a){await chooseAdmin(a);const d=districts.find(x=>x.id===found.district_id);if(d)selectedArea=d}}
      if(found.metro_id)selectedMetro=metros.find(x=>x.id===found.metro_id)||null;
      selectedRadius=3000;renderCities();renderAdmins();renderDistricts();renderMetros();renderRadius();renderCurrent();
      btn.querySelector('span').textContent=found.district_name?`${found.district_name} · м. ${found.metro_name||'рядом'}`:`Москва · м. ${found.metro_name||'рядом'}`;
    }catch{btn.querySelector('span').textContent='Не удалось определить локацию'}finally{btn.disabled=false}
  },()=>{btn.disabled=false;btn.querySelector('span').textContent='Доступ к геопозиции не предоставлен'},{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
}
async function hydrate(){
  try{await loadCities()}catch{}
  if(context&&!cities.some(x=>x.id===context.city_id)){context=null;localStorage.removeItem(KEY)}
  try{
    const{data:{user}}=await s.auth.getUser();
    if(user&&!context){
      const{data:p}=await s.from('marketplace_geo_user_preferences').select('city_id,area_id,metro_id,radius_m').eq('auth_user_id',user.id).maybeSingle();
      if(p?.city_id&&cities.some(x=>x.id===p.city_id)){
        const ids=[p.city_id,p.area_id,p.metro_id].filter(Boolean),{data:places}=await s.from('marketplace_geo_places').select('id,parent_id,name,short_name,slug,place_type,timezone').in('id',ids);
        const city=places?.find(x=>x.id===p.city_id),area=places?.find(x=>x.id===p.area_id),metro=places?.find(x=>x.id===p.metro_id);
        let admin=null;if(area?.place_type==='ADMIN_DISTRICT')admin=area;else if(area?.parent_id){const{data:a}=await s.from('marketplace_geo_places').select('id,name,short_name').eq('id',area.parent_id).maybeSingle();admin=a||null}
        if(city)context={version:2,city_id:city.id,city_name:city.name,city_slug:city.slug,timezone:city.timezone,admin_id:admin?.id||null,admin_name:admin?.name||null,admin_short_name:admin?.short_name||null,area_id:area?.id||null,area_name:area?.name||null,area_short_name:area?.short_name||null,area_type:area?.place_type||null,metro_id:metro?.id||null,metro_name:metro?.name||null,radius_m:Number(p.radius_m||3000),updated_at:new Date().toISOString()};
      }
    }
  }catch{}
  if(!context){const m=cities.find(x=>x.slug==='moscow')||cities[0];if(m)context={version:2,city_id:m.id,city_name:m.name,city_slug:m.slug,region_name:m.region_name,timezone:m.timezone,lat:m.lat,lng:m.lng,admin_id:null,area_id:null,metro_id:null,radius_m:3000,updated_at:new Date().toISOString()}}
  if(context)writeLocal(context,{emit:false});else applyContext();
  const b=document.getElementById('cityButton');if(b)b.onclick=e=>{e.preventDefault();open()};
  readyResolve?.(context);
}
installStyle();installModal();
window.CUIM_GEO={get:()=>context,open,set:writeLocal,ready};
hydrate();