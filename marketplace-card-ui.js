const SUPABASE_URL='https://qgakliolffnwkymoqvzn.supabase.co';
const SUPABASE_KEY='sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu';
const STOCK_STATES=new Set(['IN_STOCK','LOW_STOCK','ON_ORDER','OUT_OF_STOCK']);
let catalogPromise=null;

function money(v){return new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(Number(v||0))}
function pageClass(){const p=location.pathname;return p==='/index.html'||p==='/'?'mc-page-home':p.includes('/catalog/')||p==='/catalog'?'mc-page-catalog':p.endsWith('/seller.html')||p==='/seller.html'?'mc-page-seller':'mc-page-other'}
function injectStyles(){if(document.getElementById('marketplace-card-ui-style'))return;const st=document.createElement('style');st.id='marketplace-card-ui-style';st.textContent=`
.marketplace-card-v2{border-radius:22px!important;border-color:#e2e8f0!important;box-shadow:0 8px 26px rgba(15,23,42,.075)!important;background:#fff!important;overflow:hidden!important;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease!important}
.marketplace-card-v2:hover{transform:translateY(-3px)!important;border-color:#c7d2fe!important;box-shadow:0 18px 42px rgba(15,23,42,.14)!important}
.marketplace-card-v2 .product-img{height:225px!important;padding:12px!important;background:linear-gradient(145deg,#fff,#f7f9ff)!important;border-bottom:1px solid #eef2f7;position:relative}
.marketplace-card-v2 .product-img img{width:100%!important;height:100%!important;object-fit:contain!important;transition:transform .22s ease}
.marketplace-card-v2:hover .product-img img{transform:scale(1.025)}
.marketplace-card-v2 .badge,.marketplace-card-v2 .cat{left:11px!important;top:11px!important;max-width:65%!important;background:rgba(255,255,255,.94)!important;border:1px solid #e2e8f0!important;box-shadow:0 3px 10px rgba(15,23,42,.06)!important;color:#475569!important;font-size:10px!important;font-weight:850!important}
.mc-discount-badge{position:absolute;right:11px;top:11px;z-index:4;padding:7px 9px;border-radius:999px;background:#ef4444;color:#fff;font-size:11px;font-weight:950;box-shadow:0 5px 14px rgba(239,68,68,.24)}
.marketplace-card-v2 .body,.marketplace-card-v2 .product-body{padding:15px 16px 16px!important;display:flex!important;flex-direction:column!important;flex:1!important}
.marketplace-card-v2 .seller-link,.marketplace-card-v2 .seller,.marketplace-card-v2 .label{font-size:11px!important;line-height:1.35!important;font-weight:850!important;letter-spacing:0!important;text-transform:none!important;color:#475569!important;margin-bottom:0!important}
.marketplace-card-v2 .seller a{color:#2563eb!important;text-decoration:none!important}
.marketplace-card-v2 h3{font-size:15px!important;line-height:1.38!important;margin:7px 0 0!important;min-height:42px!important;color:#0f172a!important;font-weight:800!important}
.marketplace-card-v2 .price-row{display:flex!important;align-items:baseline!important;gap:7px!important;flex-wrap:wrap!important;margin-top:11px!important}
.marketplace-card-v2 .price{font-size:22px!important;line-height:1.15!important;font-weight:950!important;color:#0f172a!important;margin-top:11px!important}
.marketplace-card-v2 .price-row .price{margin-top:0!important}
.mc-old-price{color:#94a3b8;font-size:12px;font-weight:750;text-decoration:line-through;white-space:nowrap}
.mc-trust-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;color:#64748b;font-size:10px;font-weight:750}
.mc-trust-dot{color:#cbd5e1}.mc-trust-brand{color:#2563eb}
.marketplace-card-v2 .stock-line,.mc-stock-line{margin-top:8px!important;font-size:11px!important;font-weight:850!important;display:flex;align-items:center;gap:6px;color:#047857!important}
.marketplace-card-v2 .stock-line:before,.mc-stock-line:before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor;flex:0 0 7px}
.marketplace-card-v2 .stock-line.low,.mc-stock-line.low{color:#b45309!important}.marketplace-card-v2 .stock-line.order,.mc-stock-line.order{color:#6d28d9!important}.marketplace-card-v2 .stock-line.none,.mc-stock-line.none{color:#b91c1c!important}
.mc-card-location{margin-top:8px;color:#64748b;font-size:11px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mc-fulfillment{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.mc-fulfillment span{display:inline-flex;align-items:center;gap:4px;padding:5px 7px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:9px;font-weight:800}
.marketplace-card-v2 .address{font-size:10px!important;color:#64748b!important;margin-top:6px!important}.marketplace-card-v2 .address.mc-location-source{display:none!important}
.marketplace-card-v2 .product-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:auto!important;padding-top:13px!important}
.marketplace-card-v2 .product-actions .btn,.marketplace-card-v2 .product-actions a,.marketplace-card-v2 .product-actions button{min-height:40px!important;border-radius:11px!important;font-size:11px!important;font-weight:900!important}
.marketplace-card-v2 .product-actions button:disabled{background:#e2e8f0!important;color:#64748b!important;border:1px solid #e2e8f0!important;cursor:not-allowed!important;opacity:1!important}
.marketplace-card-v2 .more{margin-top:10px!important;padding-top:9px!important;color:#64748b!important;border-top:1px solid #f1f5f9!important}
@media(max-width:680px){.marketplace-card-v2 .product-img{height:165px!important}.marketplace-card-v2 .body,.marketplace-card-v2 .product-body{padding:11px 12px 12px!important}.marketplace-card-v2 h3{font-size:13px!important;min-height:36px!important}.marketplace-card-v2 .price{font-size:19px!important}.marketplace-card-v2 .product-actions{grid-template-columns:1fr!important}.mc-page-home .marketplace-card-v2 .product-img,.mc-page-seller .marketplace-card-v2 .product-img{height:min(58vw,245px)!important}.mc-page-home .marketplace-card-v2 .product-actions,.mc-page-seller .marketplace-card-v2 .product-actions{grid-template-columns:1fr 1fr!important}}
@media(max-width:430px){.mc-page-catalog .marketplace-card-v2 .product-img{height:145px!important}.mc-page-catalog .marketplace-card-v2 .product-actions{grid-template-columns:1fr!important}.mc-page-catalog .marketplace-card-v2 .mc-trust-row{display:none}.mc-page-catalog .marketplace-card-v2 .mc-fulfillment span{font-size:8px;padding:4px 6px}}
`;document.head.appendChild(st)}

function stockStatus(x){const d=x?.marketplace_details||{},explicit=d.stock_status;if(STOCK_STATES.has(explicit))return explicit;if(x?.marketplace_offer_type==='FOOD'&&x?.quantity==null)return'IN_STOCK';if(x?.quantity==null)return x?.marketplace_offer_type==='PRODUCT'?'ON_ORDER':'IN_STOCK';const q=Number(x.quantity);if(!Number.isFinite(q))return'IN_STOCK';if(q<=0)return'OUT_OF_STOCK';if(q<=3)return'LOW_STOCK';return'IN_STOCK'}
function stockMeta(x){const st=stockStatus(x),q=Number(x?.quantity),unit=String(x?.unit||'шт.');if(st==='OUT_OF_STOCK')return['Нет в наличии','none'];if(st==='ON_ORDER')return['Под заказ','order'];if(st==='LOW_STOCK')return[Number.isFinite(q)&&q>0?`Осталось ${q} ${unit}`:'Ограниченный остаток','low'];return[Number.isFinite(q)&&q>0&&q<=10?`В наличии: ${q} ${unit}`:'В наличии','']}
function discountPercent(x){const old=Number(x?.old_price),cur=Number(x?.price);return Number.isFinite(old)&&Number.isFinite(cur)&&old>cur&&cur>=0?Math.max(1,Math.min(99,Math.round((1-cur/old)*100))):0}
function fulfillment(x){const d=x?.marketplace_details||{},a=[];if(d.delivery===true)a.push(['🚚','Доставка']);if(d.pickup===true)a.push(['🏪','Самовывоз']);if(x?.marketplace_offer_type==='FOOD'&&d.delivery===true&&!a.length)a.push(['🚚','Доставка']);return a}
function productId(card){return card.dataset.offer||card.dataset.open||''}

async function loadCatalog(){if(catalogPromise)return catalogPromise;catalogPromise=(async()=>{try{const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/marketplace_catalog_products_v4`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_query:null,p_section:null,p_subcategory:null,p_partner_id:null,p_city_id:null,p_area_id:null,p_metro_id:null,p_radius_m:3000})});if(!r.ok)throw new Error(`catalog ${r.status}`);const rows=await r.json();return new Map((Array.isArray(rows)?rows:[]).map(x=>[String(x.id),x]))}catch(e){console.warn('CUIM card UI: catalog data unavailable',e);return new Map}})();return catalogPromise}
function insertAfter(node,newNode){node?.parentNode?.insertBefore(newNode,node.nextSibling)}
function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}

function enhanceCard(card,x){if(!card||card.classList.contains('marketplace-card-v2')||!x)return;card.classList.add('marketplace-card-v2');const img=card.querySelector('.product-img'),body=card.querySelector('.body,.product-body');if(!body)return;
  const discount=discountPercent(x);if(img&&discount&&!img.querySelector('.mc-discount-badge'))img.appendChild(make('span','mc-discount-badge',`−${discount}%`));
  const seller=body.querySelector('.seller-link,.seller,.label');if(seller&&!body.querySelector('.mc-trust-row')){const trust=make('div','mc-trust-row');trust.append(make('span','', '☆ Без рейтинга'),make('span','mc-trust-dot','•'),make('span','mc-trust-brand','На ЦУИМ'));insertAfter(seller,trust)}
  const price=body.querySelector('.price');const priceRow=body.querySelector('.price-row');if(discount&&x.old_price!=null&&!body.querySelector('.mc-old-price')){const old=make('span','mc-old-price',money(x.old_price));if(priceRow)priceRow.appendChild(old);else if(price)insertAfter(price,old)}
  if(['PRODUCT','FOOD'].includes(x.marketplace_offer_type)){const [text,cls]=stockMeta(x);let line=body.querySelector('.stock-line');if(!line){line=make('div','mc-stock-line');const anchor=priceRow||price||body.querySelector('h3');insertAfter(anchor,line)}line.classList.remove('low','order','none');if(cls)line.classList.add(cls);line.textContent=text}
  const existingAddresses=[...body.querySelectorAll('.address')];if(existingAddresses.length)existingAddresses[existingAddresses.length-1].classList.add('mc-location-source');
  if(x.city&&!body.querySelector('.mc-card-location')){const loc=make('div','mc-card-location',`📍 ${x.city}`);const stock=body.querySelector('.stock-line,.mc-stock-line'),old=body.querySelector('.mc-old-price'),anchor=stock||old||priceRow||price||body.querySelector('h3');insertAfter(anchor,loc)}
  const ships=fulfillment(x);if(ships.length&&!body.querySelector('.mc-fulfillment')){const host=make('div','mc-fulfillment');for(const [ico,label] of ships)host.appendChild(make('span','',`${ico} ${label}`));const loc=body.querySelector('.mc-card-location'),stock=body.querySelector('.stock-line,.mc-stock-line');insertAfter(loc||stock||priceRow||price,host)}
  const st=stockStatus(x);if(st==='OUT_OF_STOCK'){for(const btn of card.querySelectorAll('[data-cart]')){btn.disabled=true;btn.textContent='Нет в наличии';btn.setAttribute('aria-disabled','true')}}
}

let scheduled=false;
async function enhanceAll(){scheduled=false;const cards=[...document.querySelectorAll('.product[data-offer],.product[data-open]')].filter(x=>!x.classList.contains('ad-card')&&!x.classList.contains('marketplace-card-v2'));if(!cards.length)return;const map=await loadCatalog();for(const card of cards){const x=map.get(String(productId(card)));if(x)enhanceCard(card,x)}}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>setTimeout(enhanceAll,0))}
function start(){document.body?.classList.add(pageClass());injectStyles();schedule();const target=document.querySelector('#products')||document.body;if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:true});setTimeout(schedule,700);setTimeout(schedule,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
