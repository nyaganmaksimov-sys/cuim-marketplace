function enhanceClassifieds(){
  if(!document.body.classList.contains('mode-ads')) return false;
  const host=document.querySelector('.classifieds-comfort');
  const categories=host?.querySelector('.classifieds-chips');
  const searchbox=document.querySelector('.catalog-main > .toolbar .searchbox, .catalog-main .toolbar .searchbox');
  if(!host||!categories||!searchbox) return false;
  if(document.querySelector('.classifieds-search-top')) return true;
  const search=document.createElement('div');
  search.className='classifieds-search-top';
  search.innerHTML='<div class="classifieds-search-caption"><b>Поиск по объявлениям</b><span>Введите, что хотите найти — например, квартира, диван или телефон</span></div>';
  search.appendChild(searchbox);
  host.insertBefore(search,categories);
  document.body.classList.add('classifieds-light-v2');
  return true;
}

if(!enhanceClassifieds()){
  const observer=new MutationObserver(()=>{if(enhanceClassifieds())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  setTimeout(()=>observer.disconnect(),12000);
}
