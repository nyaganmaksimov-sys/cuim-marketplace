import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const s=createClient('https://qgakliolffnwkymoqvzn.supabase.co','sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu');
const $=id=>document.getElementById(id);
const MAX_IMAGES=6,MAX_BYTES=8*1024*1024,ALLOWED=new Set(['image/jpeg','image/png','image/webp']);
let items=[],session=null,partnerId=null,lastProductId=null,loading=false,installed=false;
const objectUrls=new Set;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function uuid(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function notify(){document.dispatchEvent(new CustomEvent('cuim:seller-gallery-change',{detail:{count:items.length,cover:items.find(x=>x.cover)?.url||null}}))}
function setMsg(text,bad=false){const el=$('galleryMsg');if(!el)return;el.className='sg-msg '+(bad?'bad':'');el.textContent=text||''}
function revoke(item){if(item?.preview&&objectUrls.has(item.preview)){URL.revokeObjectURL(item.preview);objectUrls.delete(item.preview)}}
function releaseAll(){items.forEach(revoke)}
function currentCover(){return items.find(x=>x.cover)||items[0]||null}
function normalized(){if(items.length&&!items.some(x=>x.cover))items[0].cover=true;let first=true;for(const x of items){if(x.cover){if(first)first=false;else x.cover=false}}}
function productId(){return String($('id')?.value||'').trim()}
function syncLegacyInput(){const cover=currentCover();if(cover?.url&&$('imageUrl'))$('imageUrl').value=cover.url}
function render(){
  normalized();
  const count=$('galleryCount');if(count)count.textContent=`${items.length} / ${MAX_IMAGES}`;
  const box=$('galleryItems');if(!box)return;
  if(!items.length){box.innerHTML='<div class="sg-empty">Добавьте 2–6 изображений. Первое или выбранное изображение станет обложкой карточки.</div>'}
  else box.innerHTML=items.map((x,i)=>`<article class="sg-item ${x.cover?'cover':''}" data-gallery-index="${i}"><div class="sg-photo"><img src="${esc(x.preview||x.url||'')}" alt=""><span>${i+1}</span>${x.cover?'<b>Обложка</b>':''}</div><div class="sg-controls"><button type="button" class="sg-mini" data-cover="${i}" ${x.cover?'disabled':''}>${x.cover?'Главная':'Сделать обложкой'}</button><div class="sg-row"><button type="button" class="sg-icon" data-left="${i}" ${i===0?'disabled':''} aria-label="Влево">←</button><button type="button" class="sg-icon" data-right="${i}" ${i===items.length-1?'disabled':''} aria-label="Вправо">→</button><button type="button" class="sg-icon danger" data-remove-img="${i}" aria-label="Удалить">×</button></div></div></article>`).join('');
  document.querySelectorAll('[data-cover]').forEach(b=>b.onclick=()=>setCover(Number(b.dataset.cover)));
  document.querySelectorAll('[data-left]').forEach(b=>b.onclick=()=>move(Number(b.dataset.left),-1));
  document.querySelectorAll('[data-right]').forEach(b=>b.onclick=()=>move(Number(b.dataset.right),1));
  document.querySelectorAll('[data-remove-img]').forEach(b=>b.onclick=()=>removeItem(Number(b.dataset.removeImg)));
  syncLegacyInput();notify();
}
function setCover(i){if(!items[i])return;items.forEach((x,n)=>x.cover=n===i);render();setMsg('Обложка изменена. Нажмите «Сохранить», чтобы применить изменения.')}
function move(i,d){const j=i+d;if(!items[i]||!items[j])return;[items[i],items[j]]=[items[j],items[i]];render();setMsg('Порядок изменён. Нажмите «Сохранить», чтобы применить изменения.')}
function removeItem(i){const x=items[i];if(!x)return;revoke(x);items.splice(i,1);normalized();render();setMsg('Изображение убрано из галереи. Изменение применится после сохранения публикации.')}
function extFor(file){if(file.type==='image/png')return'png';if(file.type==='image/webp')return'webp';return'jpg'}
function addFiles(list){
  const files=[...list];if(!files.length)return;
  const room=MAX_IMAGES-items.length;if(room<=0){setMsg(`В карточке можно разместить не более ${MAX_IMAGES} изображений.`,true);return}
  let added=0;
  for(const file of files.slice(0,room)){
    if(!ALLOWED.has(file.type)){setMsg('Поддерживаются JPG, PNG и WebP.',true);continue}
    if(file.size>MAX_BYTES){setMsg(`Файл «${file.name}» больше 8 МБ.`,true);continue}
    const preview=URL.createObjectURL(file);objectUrls.add(preview);
    items.push({key:uuid(),url:null,preview,file,storagePath:null,source:'pending',cover:items.length===0});added++;
  }
  if(files.length>room)setMsg(`Добавлено ${room}. Максимум — ${MAX_IMAGES} изображений.`,true);else if(added)setMsg('Фото добавлены. Выберите обложку и порядок, затем сохраните публикацию.');
  render();
}
async function ensureSession(){if(session&&partnerId)return true;session=(await s.auth.getSession()).data.session;if(!session)return false;const r=await s.rpc('current_partner_id');if(r.error||!r.data)return false;partnerId=r.data;return true}
async function loadGallery(pid){
  if(loading)return;loading=true;releaseAll();items=[];render();setMsg(pid?'Загружаем галерею…':'');
  try{
    if(!pid){const legacy=$('imageUrl')?.value?.trim();if(legacy)items=[{key:'legacy',url:legacy,preview:null,file:null,storagePath:null,source:'legacy',cover:true}];render();return}
    const{data,error}=await s.from('marketplace_product_images').select('id,image_url,storage_path,sort_order,is_cover,alt_text').eq('product_id',pid).order('sort_order');
    if(error)throw error;
    if(data?.length){items=data.slice(0,MAX_IMAGES).map((x,i)=>({key:x.id,url:x.image_url,preview:null,file:null,storagePath:x.storage_path||null,source:'existing',cover:!!x.is_cover||(i===0&&!data.some(v=>v.is_cover)),altText:x.alt_text||null}))}
    else{const legacy=$('imageUrl')?.value?.trim();if(legacy)items=[{key:'legacy',url:legacy,preview:null,file:null,storagePath:null,source:'legacy',cover:true}]}
    render();setMsg(items.length>1?`В галерее ${items.length} изображения. Можно менять обложку и порядок.`:items.length?'Сейчас в карточке одно изображение. Рекомендуем добавить инфографику или дополнительные фото.':'Добавьте изображения для более понятной карточки.');
  }catch(e){setMsg('Не удалось загрузить галерею: '+(e?.message||e),true)}finally{loading=false}
}
async function uploadPending(){
  if(!await ensureSession())throw new Error('Сессия продавца не найдена. Войдите заново.');
  const uploaded=[];
  for(const x of items){
    if(!x.file)continue;
    const path=`${session.user.id}/products/${uuid()}/${uuid()}.${extFor(x.file)}`;
    const{error}=await s.storage.from('marketplace-public').upload(path,x.file,{cacheControl:'3600',upsert:false,contentType:x.file.type});
    if(error)throw Object.assign(new Error(error.message),{uploaded});
    const pub=s.storage.from('marketplace-public').getPublicUrl(path).data.publicUrl;
    uploaded.push(path);x.storagePath=path;x.url=pub;x.source='uploaded';
    revoke(x);x.preview=null;x.file=null;
  }
  return uploaded;
}
async function cleanupPaths(paths){
  if(!paths?.length||!session)return;
  const safe=[...new Set(paths)].filter(p=>String(p).startsWith(session.user.id+'/'));
  if(safe.length)try{await s.storage.from('marketplace-public').remove(safe)}catch{}
}
async function resolveNewProduct(title,coverUrl){
  if(!await ensureSession())return null;
  let q=s.from('partner_products').select('id,title,image_url,created_at').eq('partner_id',partnerId).eq('title',title).order('created_at',{ascending:false}).limit(5);
  const{data,error}=await q;if(error)throw error;
  const exact=coverUrl?(data||[]).find(x=>x.image_url===coverUrl):null;
  return exact?.id||data?.[0]?.id||null;
}
async function replaceGallery(pid,title){
  const{data:oldRows,error:oldErr}=await s.from('marketplace_product_images').select('id,image_url,storage_path,sort_order,is_cover,alt_text').eq('product_id',pid).order('sort_order');
  if(oldErr)throw oldErr;
  const finalItems=items.filter(x=>x.url).slice(0,MAX_IMAGES);normalized();
  const{error:delErr}=await s.from('marketplace_product_images').delete().eq('product_id',pid);if(delErr)throw delErr;
  if(finalItems.length){
    const rows=finalItems.map((x,i)=>({product_id:pid,image_url:x.url,storage_path:x.storagePath||null,sort_order:i,is_cover:!!x.cover,alt_text:title||null}));
    const{error:insErr}=await s.from('marketplace_product_images').insert(rows);
    if(insErr){if(oldRows?.length)try{await s.from('marketplace_product_images').insert(oldRows.map(({id,...x})=>x))}catch{}throw insErr}
  }
  const keep=new Set(finalItems.map(x=>x.storagePath).filter(Boolean));
  await cleanupPaths((oldRows||[]).map(x=>x.storage_path).filter(p=>p&&!keep.has(p)));
}
function watchLegacy(){
  const input=$('imageUrl');if(!input)return;
  input.addEventListener('input',()=>{
    const v=input.value.trim();
    if(items.length===0&&v){items=[{key:'legacy',url:v,preview:null,file:null,storagePath:null,source:'legacy',cover:true}];render()}
    else if(items.length===1&&items[0].source==='legacy'){if(v){items[0].url=v;render()}else{items=[];render()}}
  });
}
function inject(){
  const image=$('imageUrl');if(!image||$('sellerGallery'))return false;
  const field=image.closest('.field');if(!field)return false;
  const label=field.querySelector('label');if(label)label.textContent='Обложка — URL (резервный способ)';
  const box=document.createElement('section');box.id='sellerGallery';box.className='sg-box';
  box.innerHTML=`<div class="sg-head"><div><b>Фотографии карточки</b><span>До 6 изображений. Рекомендуем 2–6: обложка, преимущества, характеристики и примеры.</span></div><strong id="galleryCount">0 / ${MAX_IMAGES}</strong></div><label class="sg-drop" id="galleryDrop"><input id="galleryFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden><span class="sg-plus">＋</span><b>Добавить фотографии</b><small>JPG, PNG или WebP · до 8 МБ каждое</small></label><div id="galleryItems" class="sg-items"></div><div id="galleryMsg" class="sg-msg"></div><div class="sg-foot">Перетаскивайте порядок стрелками и выберите главную обложку. Изменения сохраняются вместе с публикацией.</div>`;
  field.insertAdjacentElement('afterend',box);
  const style=document.createElement('style');style.textContent=`.sg-box{margin:4px 0 13px;padding:14px;border:1px solid #dbe3ef;border-radius:15px;background:#fff}.sg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.sg-head b{display:block;font-size:13px}.sg-head span{display:block;margin-top:3px;color:#64748b;font-size:10px;line-height:1.45}.sg-head strong{white-space:nowrap;font-size:10px;background:#f1f5f9;padding:6px 8px;border-radius:999px}.sg-drop{margin-top:11px;min-height:82px;border:1.5px dashed #a5b4fc;border-radius:13px;background:linear-gradient(135deg,#f8fbff,#faf5ff);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;text-align:center;padding:12px}.sg-drop.drag{border-color:#4f46e5;background:#eef2ff}.sg-drop b{font-size:11px}.sg-drop small{font-size:9px;color:#64748b;margin-top:2px}.sg-plus{font-size:24px;line-height:1;color:#4f46e5}.sg-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.sg-empty{grid-column:1/-1;padding:13px;border-radius:11px;background:#f8fafc;color:#94a3b8;font-size:10px;line-height:1.5;text-align:center}.sg-item{border:1px solid #e2e8f0;border-radius:12px;padding:7px;background:#fff}.sg-item.cover{border-color:#818cf8;box-shadow:0 0 0 2px #eef2ff}.sg-photo{height:112px;border-radius:9px;background:#f1f5f9;overflow:hidden;position:relative;display:grid;place-items:center}.sg-photo img{width:100%;height:100%;object-fit:contain}.sg-photo>span{position:absolute;left:6px;top:6px;width:21px;height:21px;border-radius:999px;background:#0f172acc;color:#fff;display:grid;place-items:center;font-size:9px;font-weight:900}.sg-photo>b{position:absolute;right:6px;top:6px;border-radius:999px;background:#4f46e5;color:#fff;padding:5px 7px;font-size:8px}.sg-controls{display:grid;gap:6px;margin-top:6px}.sg-mini,.sg-icon{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:8px;min-height:29px;font-size:9px;font-weight:850;cursor:pointer}.sg-mini:disabled,.sg-icon:disabled{opacity:.45;cursor:default}.sg-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px}.sg-icon.danger{color:#b91c1c;border-color:#fecaca}.sg-msg{font-size:9px;color:#475569;line-height:1.45;margin-top:8px}.sg-msg.bad{color:#b91c1c}.sg-foot{font-size:9px;color:#94a3b8;line-height:1.45;margin-top:7px}@media(max-width:650px){.sg-items{grid-template-columns:1fr 1fr}.sg-photo{height:104px}}`;
  document.head.appendChild(style);
  const input=$('galleryFiles'),drop=$('galleryDrop');input.onchange=()=>{addFiles(input.files);input.value=''};
  for(const ev of ['dragenter','dragover'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')});
  for(const ev of ['dragleave','drop'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')});
  drop.addEventListener('drop',e=>addFiles(e.dataTransfer?.files||[]));
  watchLegacy();render();installed=true;return true;
}
function wrapSubmit(){
  const form=$('offerForm');if(!form||form.dataset.galleryWrapped==='1'||typeof form.onsubmit!=='function')return false;
  const original=form.onsubmit;form.dataset.galleryWrapped='1';
  form.onsubmit=async e=>{
    e.preventDefault();
    const beforeId=productId(),beforeTitle=$('title')?.value?.trim()||'',newUploadPaths=[];
    try{
      setMsg('Подготавливаем изображения…');
      const uploaded=await uploadPending();newUploadPaths.push(...uploaded);normalized();syncLegacyInput();
      const coverUrl=currentCover()?.url||$('imageUrl')?.value?.trim()||null;
      await original.call(form,e);
      const ok=$('formMsg')?.classList.contains('ok');
      if(!ok){await cleanupPaths(newUploadPaths);setMsg('Публикация не сохранена — новые файлы не были привязаны.',true);return}
      let pid=beforeId;if(!pid)pid=await resolveNewProduct(beforeTitle,coverUrl);
      if(!pid){setMsg('Публикация сохранена, но не удалось привязать галерею. Обложка сохранена как обычно.',true);return}
      setMsg('Сохраняем галерею…');await replaceGallery(pid,beforeTitle);
      if(beforeId){lastProductId=pid;await loadGallery(pid)}else{releaseAll();items=[];lastProductId='';render()}
      const fm=$('formMsg');if(fm){fm.className='msg ok';fm.textContent='Сохранено. Фото и порядок галереи обновлены.'}
      setMsg('Галерея сохранена.');
    }catch(err){
      const paths=[...newUploadPaths,...(err?.uploaded||[])];await cleanupPaths(paths);
      setMsg('Ошибка галереи: '+(err?.message||err),true);
      const fm=$('formMsg');if(fm&&!fm.classList.contains('ok')){fm.className='msg err';fm.textContent='Ошибка: '+(err?.message||err)}
    }
  };
  return true;
}
function monitorProduct(){setInterval(()=>{const id=productId();if(id===lastProductId)return;lastProductId=id;setTimeout(()=>loadGallery(id),40)},250)}
async function boot(){
  let tries=0;const t=setInterval(async()=>{tries++;if(!installed)inject();const wrapped=wrapSubmit();if(installed&&wrapped){clearInterval(t);await ensureSession();lastProductId=productId();await loadGallery(lastProductId);monitorProduct()}else if(tries>100)clearInterval(t)},100)
}
window.CUIM_SELLER_GALLERY={count:()=>items.length,cover:()=>currentCover()?.url||null};
boot();
