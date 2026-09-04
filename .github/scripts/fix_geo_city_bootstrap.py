from pathlib import Path

p=Path('geo-core.js')
s=p.read_text(encoding='utf-8')
old="""function chooseCity(){
  const wanted=context.city_id?cities.find(x=>x.id===context.city_id):null;
"""
new="""function chooseInitialCity(){
  const wanted=context.city_id?cities.find(x=>x.id===context.city_id):null;
"""
if old not in s:
    raise SystemExit('initial chooseCity marker not found')
s=s.replace(old,new,1)
start=s.index('async function ensureCities(){')
end=s.index('\nfunction renderCities(){',start)
block=s[start:end]
if block.count('chooseCity()')!=2:
    raise SystemExit(f'unexpected bootstrap calls: {block.count("chooseCity()")}')
block=block.replace('chooseCity()','chooseInitialCity()')
s=s[:start]+block+s[end:]
p.write_text(s,encoding='utf-8')
