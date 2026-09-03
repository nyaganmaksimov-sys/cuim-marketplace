import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const s=createClient(
  'https://qgakliolffnwkymoqvzn.supabase.co',
  'sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu'
);

const KEY='cuim-geo:v1';
const FALLBACK={
  version:3,
  city_id:null,
  city_name:'Москва',
  city_slug:'moscow',
  region_name:null,
  timezone:'Europe/Moscow',
  admin_id:null,
  admin_name:null,
  admin_short_name:null,
  area_id:null,
  area_name:null,
  area_short_name:null,
  area_type:null,
  metro_id:null,
  metro_name:null,
  radius_m:3000,
  market_radius_m:null,
  updated_at:new Date().toISOString()
};

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pin=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>`;
const metroIcon=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 19 3-14h8l3 14M7 15h10M8 9h8M6 19h12M9 19l-2 3m8-3 2 3"/></svg>`;

function readLocal(){
  try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}
}
function persist(v){
  try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}
}
function marketRadiusFor(c){return c?.slug==='nyagan'?300000:null}
function cityWideText(c=city){
  if(c?.slug==='nyagan')return'Нягань и рядом · до 300 км';
  return`Весь ${c?.name||context.city_name||'город'}`;
}

let context={...FALLBACK,...(readLocal()||{})};
let cities=[];
let city=null;
let directAreas=[];
let admins=[];
let districts=[];
let metros=[];
let selectedAdmin=null;
let selectedArea=null;
let selectedMetro=null;
let selectedRadius=Number(context.radius_m||3000);
let readyResolve;
const ready=new Promise(r=>readyResolve=r);

function detail(v=context){
  if(v?.metro_name)return`м. ${v.metro_name} · ${Math.round(Number(v.radius_m||3000)/1000)} км`;
  if(v?.area_name)return v.area_short_name||v.area_name;
  if(v?.city_slug==='nyagan')return'Нягань и рядом · до 300 км';
  return`Весь ${v?.city_name||'город'}`;
}

function applyContext(){
  const cityName=context.city_name||city?.name||'Москва';
  const citySlug=context.city_slug||city?.slug||'moscow';
  const b=document.getElementById('cityButton');
  if(b){
    b.classList.add('cuim-geo-trigger');
    b.type='button';
    b.innerHTML=`${pin}<span><b>${esc(cityName)}</b><small>${esc(detail())}</small></span>`;
    b.onclick=e=>{e.preventDefault();e.stopPropagation();open()};
  }
  const q=document.getElementById('q');
  if(q)q.placeholder=`Что ищете в ${cityName}?`;
  document.documentElement.dataset.cuimCity=citySlug;
}

function emit(){
  applyContext();
  window.dispatchEvent(new CustomEvent('cuim:geo-change',{detail:context}));
}

function installStyle(){
  if(document.getElementById('cuimGeoStyle'))return;
  const st=document.createElement('style');
  st.id='cuimGeoStyle';
  st.textContent=`
  .cuim-geo-trigger{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;text-align:left!important}.cuim-geo-trigger>svg{width:21px;height:21px;flex:0 0 auto}.cuim-geo-trigger span{display:grid;min-width:0}.cuim-geo-trigger b{font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cuim-geo-trigger small{font-size:10px;opacity:.72;font-weight:650;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cuim-geo-shade{position:fixed;inset:0;background:#02061780;backdrop-filter:blur(5px);z-index:1000;opacity:0;pointer-events:none;transition:.18s}.cuim-geo-shade.show{opacity:1;pointer-events:auto}
  .cuim-geo-modal{position:fixed;z-index:1001;left:50%;top:50%;transform:translate(-50%,-46%) scale(.98);width:min(860px,calc(100% - 28px));max-height:min(840px,calc(100vh - 28px));overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:24px;box-shadow:0 30px 90px #02061755;opacity:0;pointer-events:none;transition:.18s}.cuim-geo-modal.show{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}
  .cuim-geo-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 22px 16px;border-bottom:1px solid #eef2f7;position:sticky;top:0;background:#fff;z-index:5}.cuim-geo-head h2{margin:0;font-size:23px}.cuim-geo-head p{margin:5px 0 0;color:#64748b;font-size:13px;line-height:1.45}.cuim-geo-close{border:1px solid #e2e8f0;background:#fff;border-radius:12px;width:38px;height:38px;font-size:24px;cursor:pointer}
  .cuim-geo-body{padding:18px 22px 22px}.cuim-geo-label{margin:18px 0 9px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:900}.cuim-geo-note{font-size:11px;color:#94a3b8;margin:-4px 0 10px}.cuim-geo-cities,.cuim-geo-areas,.cuim-geo-admins,.cuim-geo-districts,.cuim-geo-metros{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cuim-geo-cities{grid-template-columns:repeat(3,minmax(0,1fr))}
  .cuim-geo-option{border:1px solid #e2e8f0;background:#fff;border-radius:15px;padding:12px 13px;text-align:left;cursor:pointer;min-width:0}.cuim-geo-option:hover{border-color:#a5b4fc;background:#f8faff}.cuim-geo-option.active{border-color:#6366f1;background:#eef2ff;box-shadow:inset 0 0 0 1px #6366f1}.cuim-geo-option b{display:block;color:#0f172a;font-size:14px}.cuim-geo-option span{display:block;color:#64748b;font-size:11px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cuim-geo-city.active{border-color:#2563eb;background:#eff6ff}.cuim-geo-city.active b{color:#1d4ed8}.cuim-geo-locate{margin-top:12px;width:100%;border:1px solid #dbeafe;background:#fff;color:#1d4ed8;border-radius:13px;padding:11px 13px;font-weight:850;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}.cuim-geo-locate svg{width:18px;height:18px}.cuim-geo-locate:disabled{opacity:.6;cursor:wait}
  .cuim-geo-search{width:100%;border:1px solid #cbd5e1;border-radius:13px;padding:12px 14px;font:inherit;outline:none;box-sizing:border-box}.cuim-geo-search:focus{border-color:#6366f1;box-shadow:0 0 0 3px #6366f11a}.cuim-geo-metro-tools{display:grid;grid-template-columns:1fr auto;gap:8px}.cuim-geo-clear{border:1px solid #e2e8f0;background:#fff;border-radius:13px;padding:0 14px;font-weight:800;color:#475569;cursor:pointer}.cuim-geo-metros{margin-top:9px;max-height:250px;overflow:auto;padding-right:3px}.cuim-geo-metro{display:flex;align-items:center;gap:9px}.cuim-geo-metro>svg{width:18px;height:18px;flex:0 0 auto;color:#2563eb}.cuim-geo-metro b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cuim-geo-radius{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.cuim-geo-radius button{border:1px solid #dbe3ef;background:#fff;border-radius:999px;padding:8px 13px;font-weight:850;color:#475569;cursor:pointer}.cuim-geo-radius button.active{background:#0f172a;color:#fff;border-color:#0f172a}.cuim-geo-empty{padding:17px;border:1px dashed #cbd5e1;border-radius:14px;color:#64748b;font-size:12px;text-align:center;grid-column:1/-1}
  .cuim-geo-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px;padding-top:17px;border-top:1px solid #eef2f7}.cuim-geo-current{font-size:12px;color:#64748b;line-height:1.45}.cuim-geo-current b{display:block;color:#0f172a;font-size:13px}.cuim-geo-save{border:0;border-radius:13px;padding:12px 20px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-weight:900;cursor:pointer}
  @media(max-width:640px){.cuim-geo-modal{top:auto;bottom:0;left:0;width:100%;max-height:91vh;border-radius:24px 24px 0 0;transform:translateY(20px)}.cuim-geo-modal.show{transform:none}.cuim-geo-cities,.cuim-geo-areas,.cuim-geo-admins,.cuim-geo-districts,.cuim-geo-metros{grid-template-columns:1fr}.cuim-geo-head,.cuim-geo-body{padding-left:16px;padding-right:16px}.cuim-geo-foot{align-items:stretch;flex-direction:column}.cuim-geo-save{width:100%}.cuim-geo-metros{max-height:220px}}
  `;
  document.head.appendChild(st);
}

function installModal(){
  if(document.getElementById('cuimGeoModal'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="cuim-geo-shade" id="cuimGeoShade"></div>
    <section class="cuim-geo-modal" id="cuimGeoModal" role="dialog" aria-modal="true" aria-labelledby="cuimGeoTitle">
      <div class="cuim-geo-head">
        <div><h2 id="cuimGeoTitle">Выберите локацию</h2><p id="cuimGeoIntro">Город влияет на товары, услуги, работу и продавцов в выдаче.</p></div>
        <button class="cuim-geo-close" id="cuimGeoClose" type="button" aria-label="Закрыть">×</button>
      </div>
      <div class="cuim-geo-body">
        <div class="cuim-geo-label">Город</div>
        <div class="cuim-geo-cities" id="cuimGeoCities"><div class="cuim-geo-empty">Загрузка городов…</div></div>
        <button class="cuim-geo-locate" id="cuimGeoLocate" type="button">${pin}<span>Определить мою локацию</span></button>

        <div id="cuimGeoDirectBlock" hidden>
          <div class="cuim-geo-label" id="cuimGeoDirectLabel">Населённый пункт</div>
          <div class="cuim-geo-note" id="cuimGeoDirectNote"></div>
          <div class="cuim-geo-areas" id="cuimGeoDirectAreas"></div>
        </div>

        <div id="cuimGeoAdminBlock" hidden>
          <div class="cuim-geo-label">Административный округ</div>
          <div class="cuim-geo-admins" id="cuimGeoAdmins"></div>
          <div id="cuimGeoDistrictBlock" hidden>
            <div class="cuim-geo-label">Район</div>
            <div class="cuim-geo-districts" id="cuimGeoDistricts"></div>
          </div>
        </div>

        <div id="cuimGeoMetroBlock" hidden>
          <div class="cuim-geo-label">Метро</div>
          <div class="cuim-geo-note">Метро — дополнительный фильтр. Радиус считается от станции.</div>
          <div class="cuim-geo-metro-tools"><input class="cuim-geo-search" id="cuimGeoMetroSearch" placeholder="Например: Беляево, Тверская, Вавиловская"><button class="cuim-geo-clear" id="cuimGeoMetroClear" type="button">Сбросить</button></div>
          <div class="cuim-geo-metros" id="cuimGeoMetros"></div>
          <div class="cuim-geo-radius" id="cuimGeoRadius"><button type="button" data-radius="1000">1 км</button><button type="button" data-radius="3000">3 км</button><button type="button" data-radius="5000">5 км</button><button type="button" data-radius="10000">10 км</button></div>
        </div>

        <div class="cuim-geo-foot"><div class="cuim-geo-current" id="cuimGeoCurrent"></div><button class="cuim-geo-save" id="cuimGeoSave" type="button">Применить</button></div>
      </div>
    </section>`);

  const close=()=>{
    document.getElementById('cuimGeoShade')?.classList.remove('show');
    document.getElementById('cuimGeoModal')?.classList.remove('show');
  };
  document.getElementById('cuimGeoClose').onclick=close;
  document.getElementById('cuimGeoShade').onclick=close;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  document.getElementById('cuimGeoLocate').onclick=locate;
  document.getElementById('cuimGeoMetroSearch').oninput=renderMetros;
  document.getElementById('cuimGeoMetroClear').onclick=()=>{
    selectedMetro=null;
    document.getElementById('cuimGeoMetroSearch').value='';
    renderMetros();renderCurrent();
  };
  document.getElementById('cuimGeoRadius').onclick=e=>{
    const b=e.target.closest('[data-radius]');
    if(!b)return;
    selectedRadius=Number(b.dataset.radius)||3000;
    renderRadius();renderCurrent();
  };
  document.getElementById('cuimGeoSave').onclick=save;
}

const LOCAL_CITIES=[
  {id:'4dd4372f-98ef-4efa-ab92-102b11670a95',name:'Барнаул',slug:'barnaul',region_name:'Алтайский край',timezone:'Asia/Barnaul',lat:53.3742,lng:83.7769},
  {id:'b3e5b0ad-f657-45ab-a718-3157fdd914ec',name:'Нягань',slug:'nyagan',region_name:'ХМАО — Югра',timezone:'Asia/Yekaterinburg',lat:62.1458,lng:65.4339},
  {id:'a5faed33-d248-4830-8d95-71379982dfc1',name:'Москва',slug:'moscow',region_name:'Москва',timezone:'Europe/Moscow',lat:55.7558,lng:37.6176}
];
function chooseCity(){
  const wanted=context.city_id?cities.find(x=>x.id===context.city_id):null;
  const bySlug=context.city_slug?cities.find(x=>x.slug===context.city_slug):null;
  city=wanted||bySlug||cities.find(x=>x.slug==='moscow')||cities[0]||null;
  if(city){
    context={...context,city_id:city.id,city_name:city.name,city_slug:city.slug,region_name:city.region_name||null,timezone:city.timezone||context.timezone,lat:city.lat??context.lat,lng:city.lng??context.lng,market_radius_m:marketRadiusFor(city)};
    persist(context);
  }
  renderCities();applyContext();
}
async function ensureCities(){
  if(cities.length)return cities;
  cities=LOCAL_CITIES.map(x=>({...x}));
  chooseCity();
  try{
    const timeout=new Promise(r=>setTimeout(()=>r({data:null,error:new Error('geo_cities_timeout')}),3500));
    const result=await Promise.race([s.rpc('marketplace_geo_cities',{p_query:null}),timeout]);
    if(!result?.error&&result?.data?.length){cities=result.data;chooseCity()}
  }catch{}
  return cities;
}

function renderCities(){
  const host=document.getElementById('cuimGeoCities');if(!host)return;
  host.innerHTML=cities.length?cities.map(x=>{
    const sub=x.slug==='nyagan'?'ХМАО — Югра · + посёлки до 300 км':(x.region_name||'Россия');
    return`<button class="cuim-geo-option cuim-geo-city ${city?.id===x.id?'active':''}" type="button" data-city="${x.id}"><b>${esc(x.name)}</b><span>${esc(sub)}</span></button>`;
  }).join(''):'<div class="cuim-geo-empty">Города пока не найдены.</div>';
  host.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>chooseCity(cities.find(x=>x.id===b.dataset.city)||null));
}

async function chooseCity(next,{keepContext=false}={}){
  if(!next)return;
  const changed=city?.id!==next.id;
  city=next;
  if(changed&&!keepContext){
    selectedAdmin=null;selectedArea=null;selectedMetro=null;selectedRadius=3000;
  }
  context={...context,city_id:city.id,city_name:city.name,city_slug:city.slug,region_name:city.region_name||null,timezone:city.timezone||context.timezone,lat:city.lat??context.lat,lng:city.lng??context.lng,market_radius_m:marketRadiusFor(city)};
  renderCities();
  await loadCityData();
  renderCurrent();
}

async function loadCityData(){
  directAreas=[];admins=[];districts=[];metros=[];
  if(!city)return renderAll();
  const [areaRes,adminRes,metroRes]=await Promise.all([
    s.rpc('marketplace_geo_children',{p_parent_id:city.id,p_types:['SETTLEMENT','DISTRICT','NEIGHBORHOOD']}),
    s.rpc('marketplace_geo_children',{p_parent_id:city.id,p_types:['ADMIN_DISTRICT']}),
    s.rpc('marketplace_geo_children',{p_parent_id:city.id,p_types:['METRO']})
  ]);
  directAreas=areaRes.data||[];
  admins=adminRes.data||[];
  metros=(metroRes.data||[]).sort((a,b)=>String(a.name).localeCompare(String(b.name),'ru'));
  renderAll();
}

function renderAll(){renderCities();renderDirectAreas();renderAdmins();renderDistricts();renderMetros();renderRadius();renderCurrent()}

function renderDirectAreas(){
  const block=document.getElementById('cuimGeoDirectBlock');
  const host=document.getElementById('cuimGeoDirectAreas');
  const label=document.getElementById('cuimGeoDirectLabel');
  const note=document.getElementById('cuimGeoDirectNote');
  if(!block||!host)return;
  const show=directAreas.length>0;
  block.hidden=!show;
  if(!show){host.innerHTML='';return}
  if(label)label.textContent=city?.slug==='nyagan'?'Населённый пункт рядом':'Район / населённый пункт';
  if(note)note.textContent=city?.slug==='nyagan'?'Локальный рынок Нягани: населённые пункты в зоне до 300 км.':'Можно уточнить район или населённый пункт.';
  host.innerHTML=`<button class="cuim-geo-option ${!selectedArea&&!selectedAdmin?'active':''}" type="button" data-area=""><b>${esc(cityWideText())}</b><span>Без уточнения населённого пункта</span></button>`+
    directAreas.map(x=>`<button class="cuim-geo-option ${selectedArea?.id===x.id?'active':''}" type="button" data-area="${x.id}"><b>${esc(x.short_name||x.name)}</b><span>${city?.slug==='nyagan'?'Нягань и рядом':esc(x.place_type||'')}</span></button>`).join('');
  host.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>{
    selectedAdmin=null;
    selectedArea=directAreas.find(x=>x.id===b.dataset.area)||null;
    renderDirectAreas();renderAdmins();renderDistricts();renderCurrent();
  });
}

function renderAdmins(){
  const block=document.getElementById('cuimGeoAdminBlock');
  const host=document.getElementById('cuimGeoAdmins');if(!block||!host)return;
  block.hidden=admins.length===0;
  if(!admins.length){host.innerHTML='';return}
  host.innerHTML=`<button class="cuim-geo-option ${!selectedAdmin&&!selectedArea?'active':''}" type="button" data-admin=""><b>${esc(cityWideText())}</b><span>Без ограничения по округу</span></button>`+
    admins.map(x=>`<button class="cuim-geo-option ${selectedAdmin?.id===x.id?'active':''}" type="button" data-admin="${x.id}"><b>${esc(x.short_name||x.name)}</b><span>${esc(x.name)}</span></button>`).join('');
  host.querySelectorAll('[data-admin]').forEach(b=>b.onclick=()=>chooseAdmin(admins.find(x=>x.id===b.dataset.admin)||null));
}

async function chooseAdmin(admin,keepArea=null){
  selectedAdmin=admin;
  selectedArea=null;
  districts=[];
  if(!admin){renderAdmins();renderDistricts();renderDirectAreas();renderCurrent();return}
  selectedArea=keepArea||admin;
  const host=document.getElementById('cuimGeoDistricts');
  if(host)host.innerHTML='<div class="cuim-geo-empty">Загрузка районов…</div>';
  const{data}=await s.rpc('marketplace_geo_children',{p_parent_id:admin.id,p_types:['DISTRICT','SETTLEMENT','NEIGHBORHOOD']});
  districts=data||[];
  if(keepArea){const real=districts.find(x=>x.id===keepArea.id);if(real)selectedArea=real}
  renderAdmins();renderDistricts();renderDirectAreas();renderCurrent();
}

function renderDistricts(){
  const block=document.getElementById('cuimGeoDistrictBlock');
  const host=document.getElementById('cuimGeoDistricts');
  if(!block||!host)return;
  if(!selectedAdmin){block.hidden=true;host.innerHTML='';return}
  block.hidden=false;
  host.innerHTML=`<button class="cuim-geo-option ${selectedArea?.id===selectedAdmin.id?'active':''}" type="button" data-district=""><b>Весь ${esc(selectedAdmin.short_name||'округ')}</b><span>Все районы округа</span></button>`+
    districts.map(x=>`<button class="cuim-geo-option ${selectedArea?.id===x.id?'active':''}" type="button" data-district="${x.id}"><b>${esc(x.short_name||x.name)}</b><span>Район ${esc(city?.name||'города')}</span></button>`).join('');
  host.querySelectorAll('[data-district]').forEach(b=>b.onclick=()=>{
    selectedArea=districts.find(x=>x.id===b.dataset.district)||selectedAdmin;
    renderDistricts();renderCurrent();
  });
}

function renderMetros(){
  const block=document.getElementById('cuimGeoMetroBlock');
  const host=document.getElementById('cuimGeoMetros');if(!block||!host)return;
  block.hidden=metros.length===0;
  if(!metros.length){host.innerHTML='';selectedMetro=null;return}
  const q=(document.getElementById('cuimGeoMetroSearch')?.value||'').trim().toLowerCase();
  let list=metros.filter(x=>!q||String(x.name).toLowerCase().includes(q));
  if(!q&&selectedMetro){
    const i=list.findIndex(x=>x.id===selectedMetro.id);
    if(i>0)list=[list[i],...list.slice(0,i),...list.slice(i+1)];
  }
  list=list.slice(0,q?80:40);
  host.innerHTML=list.length?list.map(x=>`<button class="cuim-geo-option cuim-geo-metro ${selectedMetro?.id===x.id?'active':''}" type="button" data-metro="${x.id}">${metroIcon}<b>${esc(x.name)}</b></button>`).join(''):'<div class="cuim-geo-empty">Станция не найдена.</div>';
  host.querySelectorAll('[data-metro]').forEach(b=>b.onclick=()=>{
    selectedMetro=metros.find(x=>x.id===b.dataset.metro)||null;
    renderMetros();renderCurrent();
  });
}

function renderRadius(){
  document.querySelectorAll('#cuimGeoRadius [data-radius]').forEach(b=>b.classList.toggle('active',Number(b.dataset.radius)===selectedRadius));
}

function renderCurrent(){
  const el=document.getElementById('cuimGeoCurrent');if(!el)return;
  const parts=[city?.name||context.city_name||'Москва'];
  if(selectedArea)parts.push(selectedArea.short_name||selectedArea.name);
  if(selectedMetro)parts.push(`м. ${selectedMetro.name} · ${Math.round(selectedRadius/1000)} км`);
  let sub='Поиск по выбранному городу';
  if(city?.slug==='nyagan'&&!selectedArea)sub='Нягань и ближайшие населённые пункты в зоне до 300 км';
  else if(selectedMetro)sub='Поиск рядом с выбранной станцией';
  else if(selectedArea)sub='Поиск по выбранной территории';
  el.innerHTML=`<b>${esc(parts.join(' · '))}</b><span>${esc(sub)}</span>`;
}

async function restore(){
  await ensureCities();
  const current=cities.find(x=>x.id===context.city_id)||cities.find(x=>x.slug===context.city_slug)||city;
  if(current)await chooseCity(current,{keepContext:true});
  selectedRadius=[1000,3000,5000,10000].includes(Number(context.radius_m))?Number(context.radius_m):3000;

  if(context.admin_id){
    const a=admins.find(x=>x.id===context.admin_id);
    if(a){
      const keep=context.area_id&&context.area_id!==a.id?{id:context.area_id,name:context.area_name,short_name:context.area_short_name}:null;
      await chooseAdmin(a,keep);
    }
  }else if(context.area_id){
    selectedArea=directAreas.find(x=>x.id===context.area_id)||null;
  }
  selectedMetro=context.metro_id?metros.find(x=>x.id===context.metro_id)||null:null;
  renderAll();
}

async function open(){
  installStyle();installModal();
  document.getElementById('cuimGeoShade')?.classList.add('show');
  document.getElementById('cuimGeoModal')?.classList.add('show');
  try{await restore()}catch{renderCurrent()}
}

async function save(){
  if(!city)await ensureCities().catch(()=>{});
  context={
    ...context,
    version:3,
    city_id:city?.id||context.city_id||null,
    city_name:city?.name||context.city_name||'Москва',
    city_slug:city?.slug||context.city_slug||'moscow',
    region_name:city?.region_name||null,
    timezone:city?.timezone||context.timezone||'Europe/Moscow',
    admin_id:selectedAdmin?.id||null,
    admin_name:selectedAdmin?.name||null,
    admin_short_name:selectedAdmin?.short_name||null,
    area_id:selectedArea?.id||null,
    area_name:selectedArea?.name||null,
    area_short_name:selectedArea?.short_name||null,
    area_type:selectedArea?.place_type||null,
    metro_id:selectedMetro?.id||null,
    metro_name:selectedMetro?.name||null,
    radius_m:selectedMetro?selectedRadius:3000,
    market_radius_m:marketRadiusFor(city),
    location_source:'manual',
    updated_at:new Date().toISOString()
  };
  persist(context);emit();
  try{
    const{data:{user}}=await s.auth.getUser();
    if(user&&context.city_id){
      await s.rpc('marketplace_set_my_geo_context_v2',{p_city_id:context.city_id,p_area_id:context.area_id,p_metro_id:context.metro_id,p_radius_m:context.radius_m});
    }
  }catch{}
  document.getElementById('cuimGeoShade')?.classList.remove('show');
  document.getElementById('cuimGeoModal')?.classList.remove('show');
}

function applyResolvedArea(found){
  if(found?.area_id){
    selectedAdmin=null;
    selectedArea=directAreas.find(x=>x.id===found.area_id)||null;
    return;
  }
  if(found?.admin_id){
    const a=admins.find(x=>x.id===found.admin_id);
    if(a)return chooseAdmin(a).then(()=>{const d=districts.find(x=>x.id===found.district_id);if(d)selectedArea=d});
  }
}

async function locate(){
  const btn=document.getElementById('cuimGeoLocate');
  const text=btn?.querySelector('span');
  if(!navigator.geolocation){if(text)text.textContent='Геопозиция не поддерживается';return}
  if(btn)btn.disabled=true;if(text)text.textContent='Определяем ближайший рынок…';
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const{data,error}=await s.rpc('marketplace_geo_resolve_point_v2',{p_lat:pos.coords.latitude,p_lng:pos.coords.longitude});
      if(error)throw error;
      const found=data?.[0];
      if(!found?.city_id){if(text)text.textContent='Пока нет активного рынка рядом';return}
      await ensureCities();
      const foundCity=cities.find(x=>x.id===found.city_id);
      if(!foundCity){if(text)text.textContent='Этот город пока не активен';return}
      await chooseCity(foundCity);
      await applyResolvedArea(found);
      selectedMetro=found.metro_id?metros.find(x=>x.id===found.metro_id)||null:null;
      selectedRadius=3000;
      renderAll();
      const resolvedName=found.area_name||found.district_name||found.city_name;
      if(text)text.textContent=resolvedName===found.city_name?found.city_name:`${found.city_name} · ${resolvedName}`;
    }catch{if(text)text.textContent='Не удалось определить локацию'}
    finally{if(btn)btn.disabled=false}
  },()=>{if(btn)btn.disabled=false;if(text)text.textContent='Доступ к геопозиции не предоставлен'},{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
}

async function hydrate(){
  applyContext();
  try{
    await ensureCities();
    const current=cities.find(x=>x.id===context.city_id)||cities.find(x=>x.slug===context.city_slug)||city;
    if(current){city=current;context={...context,city_id:current.id,city_name:current.name,city_slug:current.slug,region_name:current.region_name||null,timezone:current.timezone||context.timezone,lat:current.lat??context.lat,lng:current.lng??context.lng,market_radius_m:marketRadiusFor(current)}}
  }catch{}
  persist(context);applyContext();
  readyResolve?.(context);
}

const AUTO_KEY='cuim-geo-auto:v1';
function readAutoState(){try{return JSON.parse(localStorage.getItem(AUTO_KEY)||'null')}catch{return null}}
function writeAutoState(v){try{localStorage.setItem(AUTO_KEY,JSON.stringify(v))}catch{}}
async function autoDetectLocation(){
  if(!navigator.geolocation)return;
  if(context.location_source==='manual')return;
  if(readAutoState()?.done)return;
  const startedAt=context.updated_at;
  writeAutoState({done:true,status:'requested',requested_at:new Date().toISOString()});
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const current=window.CUIM_GEO?.get?.()||context;
      if(current.location_source==='manual'||current.updated_at!==startedAt){writeAutoState({done:true,status:'cancelled_by_user',updated_at:new Date().toISOString()});return}
      const{data,error}=await s.rpc('marketplace_geo_resolve_point_v2',{p_lat:pos.coords.latitude,p_lng:pos.coords.longitude});
      if(error)throw error;
      const found=data?.[0];
      if(!found?.city_id){writeAutoState({done:true,status:'outside_active_market',updated_at:new Date().toISOString()});return}
      await ensureCities();
      const foundCity=cities.find(x=>x.id===found.city_id);
      if(!foundCity){writeAutoState({done:true,status:'inactive_city',updated_at:new Date().toISOString()});return}
      const afterLookup=window.CUIM_GEO?.get?.()||context;
      if(afterLookup.location_source==='manual'||afterLookup.updated_at!==startedAt){writeAutoState({done:true,status:'cancelled_by_user',updated_at:new Date().toISOString()});return}
      await chooseCity(foundCity);
      await applyResolvedArea(found);
      selectedMetro=found.metro_id?metros.find(x=>x.id===found.metro_id)||null:null;
      selectedRadius=3000;
      context={
        ...context,
        version:3,
        city_id:foundCity.id,
        city_name:foundCity.name,
        city_slug:foundCity.slug,
        region_name:foundCity.region_name||null,
        timezone:foundCity.timezone||context.timezone,
        admin_id:selectedAdmin?.id||null,
        admin_name:selectedAdmin?.name||null,
        admin_short_name:selectedAdmin?.short_name||null,
        area_id:selectedArea?.id||null,
        area_name:selectedArea?.name||null,
        area_short_name:selectedArea?.short_name||null,
        area_type:selectedArea?.place_type||null,
        metro_id:selectedMetro?.id||null,
        metro_name:selectedMetro?.name||null,
        radius_m:selectedMetro?selectedRadius:3000,
        market_radius_m:marketRadiusFor(foundCity),
        location_source:'auto',
        auto_detected_at:new Date().toISOString(),
        updated_at:new Date().toISOString()
      };
      persist(context);renderAll();emit();
      writeAutoState({done:true,status:'applied',city_slug:foundCity.slug,area_id:context.area_id||null,updated_at:new Date().toISOString()});
      try{
        const{data:{user}}=await s.auth.getUser();
        if(user&&context.city_id)await s.rpc('marketplace_set_my_geo_context_v2',{p_city_id:context.city_id,p_area_id:context.area_id,p_metro_id:context.metro_id,p_radius_m:context.radius_m});
      }catch{}
    }catch{writeAutoState({done:true,status:'error',updated_at:new Date().toISOString()})}
  },err=>writeAutoState({done:true,status:err?.code===1?'denied':'unavailable',updated_at:new Date().toISOString()}),{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
}

installStyle();
installModal();
applyContext();
window.CUIM_GEO={get:()=>context,open,set:v=>{context={...context,...v,version:3};persist(context);emit()},ready};
hydrate();
ready.then(()=>setTimeout(autoDetectLocation,250)).catch(()=>{});
