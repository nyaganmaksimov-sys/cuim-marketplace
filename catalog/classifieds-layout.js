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
  document.body.classList.add('classifieds-light-v2');
  return true;
}

if(!enhanceClassifieds()){
  const observer=new MutationObserver(()=>{if(enhanceClassifieds())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  setTimeout(()=>observer.disconnect(),12000);
}

import('/catalog/classifieds-advertising.js').catch(error=>console.warn('Advertising module unavailable',error));
