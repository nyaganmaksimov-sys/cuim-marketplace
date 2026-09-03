import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const s=createClient('https://qgakliolffnwkymoqvzn.supabase.co','sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu');
const id=new URLSearchParams(location.search).get('id');
let rows=[],index=0,installed=false,touchX=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function title(){return document.querySelector('.buy-card h1')?.textContent?.trim()||'Предложение ЦУИМ'}
function show(i){
  if(!rows.length)return;index=(i+rows.length)%rows.length;
  const main=document.querySelector('[data-offer-gallery-main] img');if(main){main.src=rows[index].image_url;main.alt=rows[index].alt_text||title()}
  const counter=document.querySelector('[data-offer-gallery-counter]');if(counter)counter.textContent=`${index+1} / ${rows.length}`;
  document.querySelectorAll('[data-offer-thumb]').forEach((b,n)=>b.classList.toggle('active',n===index));
}
function install(){
  const gallery=document.querySelector('.gallery'),main=gallery?.querySelector('.main-photo');if(!gallery||!main||installed)return false;
  const current=main.querySelector('img')?.src||'';
  if(!rows.length&&current)rows=[{image_url:current,alt_text:title(),is_cover:true,sort_order:0}];
  if(!rows.length)return false;
  main.dataset.offerGalleryMain='1';main.innerHTML=`<img src="${esc(rows[index].image_url)}" alt="${esc(rows[index].alt_text||title())}">`;
  if(rows.length>1){
    const prev=document.createElement('button');prev.type='button';prev.className='og-arrow og-prev';prev.setAttribute('aria-label','Предыдущее изображение');prev.textContent='‹';prev.onclick=()=>show(index-1);
    const next=document.createElement('button');next.type='button';next.className='og-arrow og-next';next.setAttribute('aria-label','Следующее изображение');next.textContent='›';next.onclick=()=>show(index+1);
    const counter=document.createElement('span');counter.className='og-counter';counter.dataset.offerGalleryCounter='1';counter.textContent=`${index+1} / ${rows.length}`;
    gallery.append(prev,next,counter);
    const thumbs=document.createElement('div');thumbs.className='og-thumbs';thumbs.innerHTML=rows.map((x,i)=>`<button type="button" class="og-thumb ${i===index?'active':''}" data-offer-thumb="${i}" aria-label="Изображение ${i+1}"><img src="${esc(x.image_url)}" alt=""></button>`).join('');gallery.appendChild(thumbs);
    thumbs.querySelectorAll('[data-offer-thumb]').forEach(b=>b.onclick=()=>show(Number(b.dataset.offerThumb)));
    main.addEventListener('touchstart',e=>{touchX=e.touches?.[0]?.clientX??null},{passive:true});
    main.addEventListener('touchend',e=>{if(touchX==null)return;const x=e.changedTouches?.[0]?.clientX??touchX,d=x-touchX;touchX=null;if(Math.abs(d)>45)show(index+(d<0?1:-1))},{passive:true});
  }
  const style=document.createElement('style');style.textContent=`.gallery{position:relative}.og-arrow{position:absolute;z-index:6;top:46%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1px solid #e2e8f0;background:#ffffffed;color:#0f172a;font-size:31px;line-height:1;display:grid;place-items:center;cursor:pointer;box-shadow:0 8px 24px #0f172a18}.og-prev{left:29px}.og-next{right:29px}.og-counter{position:absolute;z-index:6;right:29px;bottom:88px;padding:6px 9px;border-radius:999px;background:#0f172acc;color:#fff;font-size:10px;font-weight:900}.og-thumbs{display:flex;gap:8px;overflow-x:auto;padding:10px 1px 1px;scrollbar-width:thin}.og-thumb{width:75px;height:66px;flex:0 0 75px;padding:4px;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc;cursor:pointer;overflow:hidden}.og-thumb.active{border-color:#6366f1;box-shadow:0 0 0 2px #eef2ff}.og-thumb img{width:100%;height:100%;object-fit:contain}@media(max-width:820px){.og-prev{left:20px}.og-next{right:20px}.og-counter{right:20px;bottom:84px}.og-arrow{width:40px;height:40px}}@media(max-width:520px){.og-prev{left:14px}.og-next{right:14px}.og-counter{right:14px;bottom:79px}.og-thumb{width:66px;height:58px;flex-basis:66px}}`;
  document.head.appendChild(style);installed=true;return true;
}
async function load(){
  if(!id)return;
  const{data,error}=await s.from('marketplace_product_images').select('image_url,sort_order,is_cover,alt_text').eq('product_id',id).order('sort_order');
  if(!error&&data?.length){rows=data.filter(x=>x.image_url).slice(0,6);const cover=rows.findIndex(x=>x.is_cover);index=cover>=0?cover:0}
  let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(t)},100)
}
load();
