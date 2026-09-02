const classifiedIconMap={
  realestate:'/images/classifieds/realestate.webp',
  personal:'/images/classifieds/personal.webp',
  appliances:'/images/classifieds/appliances.webp',
  furniture:'/images/classifieds/furniture.webp',
  animals:'/images/classifieds/animals.webp',
  build:'/images/classifieds/build.webp',
  rent:'/images/classifieds/rent.webp',
  buy:'/images/classifieds/buy.webp',
  free:'/images/classifieds/free.webp'
};

function installClassifiedIcons(categories){
  categories.querySelectorAll('.classifieds-chip').forEach(card=>{
    const href=card.getAttribute('href')||'';
    const slug=Object.keys(classifiedIconMap).find(x=>href.includes(`/ads/${x}/`));
    if(!slug)return;
    const slot=card.firstElementChild;
    if(!slot)return;
    slot.innerHTML=`<img src="${classifiedIconMap[slug]}" alt="" loading="lazy">`;
    card.classList.add('has-image-icon');
  });
}

function installSidebarFilters(host){
  const filters=host.querySelector('.classifieds-filters');
  const sidebar=document.getElementById('catalogSidebar');
  const sidebarContent=document.getElementById('sidebarContent');
  const open=document.getElementById('sidebarOpen');
  if(!filters||!sidebar||!sidebarContent||sidebar.classList.contains('classifieds-filter-sidebar'))return;
  sidebar.classList.add('classifieds-filter-sidebar');
  const head=sidebar.querySelector('.sidebar-head b');
  if(head)head.textContent='Фильтры объявлений';
  if(open)open.textContent='⚙ Фильтры';
  sidebarContent.innerHTML='';
  const shell=document.createElement('div');
  shell.className='classifieds-filter-stack';
  const title=document.createElement('div');
  title.className='classifieds-filter-note';
  title.innerHTML='<b>Уточнить поиск</b><span>Настройте цену, состояние и дополнительные параметры.</span>';
  shell.appendChild(title);
  [...filters.children].forEach(node=>shell.appendChild(node));
  sidebarContent.appendChild(shell);
  filters.remove();
  const inputs=shell.querySelectorAll('input,select');
  const updateCount=()=>{
    let n=0;
    inputs.forEach(el=>{if(el.type==='checkbox'?el.checked:String(el.value||'').trim()!=='')n++});
    sidebar.dataset.activeFilters=String(n);
    if(open)open.textContent=n?`⚙ Фильтры · ${n}`:'⚙ Фильтры';
  };
  inputs.forEach(el=>el.addEventListener('change',updateCount));
  shell.querySelectorAll('input[type="number"]').forEach(el=>el.addEventListener('input',updateCount));
  shell.querySelector('.classifieds-reset')?.addEventListener('click',()=>setTimeout(updateCount));
  updateCount();
}

function installAdDetailLinks(){
  document.querySelectorAll('.ad-card').forEach(card=>{
    if(card.dataset.detailReady==='1')return;
    const fav=card.querySelector('[data-ad-fav]');
    const id=fav?.dataset.adFav;
    if(!id)return;
    const href=`/ad/?id=${encodeURIComponent(id)}`;
    card.dataset.detailReady='1';
    const title=card.querySelector('h3');
    if(title&&!title.querySelector('a'))title.innerHTML=`<a class="ad-detail-title" href="${href}">${title.innerHTML}</a>`;
    const primary=card.querySelector('.product-actions .primary');
    if(primary){primary.href=href;primary.textContent='Подробнее'}
    const photo=card.querySelector('.product-img');
    if(photo){photo.classList.add('ad-detail-photo');photo.addEventListener('click',e=>{if(e.target.closest('button,a'))return;location.href=href})}
  });
}

function enhanceClassifieds(){
  if(!document.body.classList.contains('mode-ads')) return false;
  const host=document.querySelector('.classifieds-comfort');
  const categories=host?.querySelector('.classifieds-chips');
  const searchbox=document.querySelector('.catalog-main > .toolbar .searchbox, .catalog-main .toolbar .searchbox');
  if(!host||!categories||!searchbox) return false;
  installClassifiedIcons(categories);
  if(!document.querySelector('.classifieds-search-top')){
    const search=document.createElement('div');
    search.className='classifieds-search-top';
    search.innerHTML='<div class="classifieds-search-caption"><b>Поиск по объявлениям</b><span>Введите, что хотите найти — например, квартира, диван или телефон</span></div>';
    search.appendChild(searchbox);
    host.insertBefore(search,categories);
  }
  installSidebarFilters(host);
  if(!document.getElementById('classified-detail-link-style')){
    const style=document.createElement('style');style.id='classified-detail-link-style';style.textContent='.ad-detail-title{color:inherit;text-decoration:none}.ad-detail-title:hover{color:#1d4ed8}.ad-detail-photo{cursor:pointer}';document.head.appendChild(style)
  }
  installAdDetailLinks();
  document.body.classList.add('classifieds-light-v2');
  return true;
}

if(!enhanceClassifieds()){
  const observer=new MutationObserver(()=>{if(enhanceClassifieds())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  setTimeout(()=>observer.disconnect(),12000);
}
const cardObserver=new MutationObserver(()=>installAdDetailLinks());
cardObserver.observe(document.documentElement,{childList:true,subtree:true});

import('/catalog/classifieds-advertising.js').catch(error=>console.warn('Advertising module unavailable',error));
