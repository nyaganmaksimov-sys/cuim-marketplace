(()=>{
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function taskUrl(){
    const id=$('id')?.value||'';
    const title=$('title')?.value?.trim()||'';
    const p=new URLSearchParams({task:'infographic'});
    if(id)p.set('offer_id',id);
    if(title)p.set('title',title);
    return '/find-executor.html?'+p.toString();
  }

  function updateState(box){
    const hasImage=Boolean($('imageUrl')?.value?.trim());
    const status=box.querySelector('[data-media-status]');
    if(status){
      status.className='seller-media-status '+(hasImage?'good':'warn');
      status.innerHTML=hasImage
        ?'<b>✓ Обложка указана.</b> Для более понятной карточки рекомендуем добавить инфографику с преимуществами и характеристиками.'
        :'<b>Добавьте изображение.</b> Карточка без понятной обложки хуже объясняет покупателю, что именно вы предлагаете.';
    }
    const request=box.querySelector('[data-infographic-request]');
    if(request)request.href=taskUrl();
  }

  function install(){
    const image=$('imageUrl');
    if(!image||document.querySelector('[data-seller-media-guide]'))return false;
    const field=image.closest('.field');
    if(!field)return false;
    const box=document.createElement('section');
    box.dataset.sellerMediaGuide='1';
    box.className='seller-media-guide';
    box.innerHTML=`
      <div class="seller-media-head">
        <div><b>Фото и инфографика</b><span>Помогите покупателю понять предложение за несколько секунд.</span></div>
        <span class="seller-media-badge">Рекомендуется</span>
      </div>
      <div class="seller-media-status" data-media-status></div>
      <div class="seller-media-grid">
        <div><strong>1. Обложка</strong><span>Сам товар, результат услуги или понятный пример работы.</span></div>
        <div><strong>2. Преимущества</strong><span>3–5 коротких тезисов без мелкого и перегруженного текста.</span></div>
        <div><strong>3. Детали</strong><span>Размеры, характеристики, комплектация, состав или условия выполнения.</span></div>
        <div><strong>4. Пример</strong><span>Покажите использование товара, процесс или результат услуги.</span></div>
      </div>
      <div class="seller-media-note">Инфографика желательна, но не обязательна для публикации. Она должна дополнять карточку и не вводить покупателя в заблуждение.</div>
      <div class="seller-media-actions">
        <a class="btn light" href="/catalog/services/design/?q=${encodeURIComponent('инфографика карточки товара')}" target="_blank" rel="noopener">🎨 Найти исполнителя</a>
        <a class="btn" data-infographic-request href="${esc(taskUrl())}">+ Разместить заявку</a>
      </div>`;
    field.insertAdjacentElement('afterend',box);

    const st=document.createElement('style');
    st.textContent=`
      .seller-media-guide{margin:4px 0 13px;padding:14px;border:1px solid #c7d2fe;border-radius:15px;background:linear-gradient(135deg,#f8fbff,#faf5ff)}
      .seller-media-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.seller-media-head b{display:block;font-size:13px}.seller-media-head span{display:block;color:#64748b;font-size:10px;margin-top:3px;line-height:1.45}
      .seller-media-badge{margin:0!important;white-space:nowrap;background:#eef2ff;color:#4338ca!important;border-radius:999px;padding:6px 8px;font-size:9px!important;font-weight:900}
      .seller-media-status{margin:11px 0;padding:10px 11px;border-radius:11px;font-size:10px;line-height:1.45}.seller-media-status b{display:block;margin-bottom:2px}.seller-media-status.warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e}.seller-media-status.good{background:#ecfdf5;border:1px solid #a7f3d0;color:#166534}
      .seller-media-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.seller-media-grid>div{background:#fff;border:1px solid #e2e8f0;border-radius:11px;padding:9px}.seller-media-grid strong{display:block;font-size:10px}.seller-media-grid span{display:block;color:#64748b;font-size:9px;line-height:1.4;margin-top:2px}
      .seller-media-note{font-size:9px;line-height:1.5;color:#64748b;margin-top:9px}.seller-media-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.seller-media-actions .btn{font-size:10px;min-height:36px;padding:8px 10px}
      @media(max-width:650px){.seller-media-grid{grid-template-columns:1fr}.seller-media-actions,.seller-media-actions .btn{width:100%}}
    `;
    document.head.appendChild(st);
    image.addEventListener('input',()=>updateState(box));
    $('title')?.addEventListener('input',()=>updateState(box));
    const idObserver=new MutationObserver(()=>updateState(box));
    if($('id'))idObserver.observe($('id'),{attributes:true,attributeFilter:['value']});
    document.addEventListener('click',e=>{if(e.target.closest('[data-edit],#newOffer,#reset'))setTimeout(()=>updateState(box),80)});
    updateState(box);
    return true;
  }

  if(!install()){
    let tries=0;
    const t=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(t)},125);
  }
})();
