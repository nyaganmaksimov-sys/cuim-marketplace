from pathlib import Path

p=Path('seller-catalog.html')
s=p.read_text(encoding='utf-8')
anchor='<script type="module" src="/seller-commerce.js"></script>'
insert=anchor+'\n<script type="module" src="/seller-location.js"></script>'
if '/seller-location.js' not in s:
    if anchor not in s:
        raise SystemExit('seller commerce anchor not found')
    s=s.replace(anchor,insert,1)
    p.write_text(s,encoding='utf-8')

p=Path('geo-core.js')
s=p.read_text(encoding='utf-8')
start=s.find('async function ensureCities(){')
end=s.find('\n\nfunction renderCities()',start)
if start<0 or end<0:
    raise SystemExit('ensureCities block not found')
new="""const LOCAL_CITIES=[
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
}"""
s=s[:start]+new+s[end:]
p.write_text(s,encoding='utf-8')
