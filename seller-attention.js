import'/marketplace-notifications.js';
import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const s=createClient('https://qgakliolffnwkymoqvzn.supabase.co','sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu');
const TYPES={ORDER:'MARKETPLACE_ORDER_NEW',REVIEW:'MARKETPLACE_REVIEW_NEW'};
const params=new URLSearchParams(location.search);
const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))?String(v):null;
const targetOrder=location.pathname.endsWith('/seller-orders.html')?uuid(params.get('order')):null;
const targetReview=location.pathname.endsWith('/seller-reviews.html')?uuid(params.get('review')):null;
const pushSupported='Notification'in window&&'serviceWorker'in navigator&&'PushManager'in window;
let session=null,partnerId=null,channel=null,observer=null,deepLinkDone=false,deepLinkPrepared=false,lastOrders=0,lastReviews=0;
let pushRegistration=null,pushSubscribed=false,pushBusy=false;

function style(){
  if(document.getElementById('seller-attention-style'))return;
  const e=document.createElement('style');
  e.id='seller-attention-style';
  e.textContent=`.seller-attention-link{position:relative}.seller-attention-badge{display:none;position:absolute;right:-6px;top:-7px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e11d48;color:#fff;font:900 9px/18px Inter,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff}.seller-attention-link.has-attention .seller-attention-badge{display:block}.seller-browser-notify{white-space:nowrap}.seller-browser-notify.on{background:#ecfdf5!important;color:#047857!important;border-color:#a7f3d0!important}.seller-browser-notify.blocked{background:#f8fafc!important;color:#94a3b8!important}.seller-browser-notify:disabled{opacity:.65;cursor:wait}.seller-deep-link-focus{outline:3px solid #7c3aed!important;outline-offset:3px;box-shadow:0 0 0 7px #7c3aed20,0 18px 50px #312e8133!important;animation:sellerFocusPulse 1s ease-in-out 2}@keyframes sellerFocusPulse{50%{transform:translateY(-2px);box-shadow:0 0 0 10px #7c3aed14,0 22px 58px #312e8140}}@media(max-width:720px){.seller-browser-notify .notify-label{display:none}.seller-browser-notify{padding-left:10px!important;padding-right:10px!important}}`;
  document.head.appendChild(e);
}

function safeUrl(v){const x=String(v||'');return x.startsWith('/')&&!x.startsWith('//')?x:'/seller-orders.html'}
function badgeFor(a){let b=a.querySelector('.seller-attention-badge');if(!b){a.classList.add('seller-attention-link');b=document.createElement('span');b.className='seller-attention-badge';a.appendChild(b)}return b}
function relevantLinks(kind){const name=kind==='ORDER'?'seller-orders.html':'seller-reviews.html';return[...document.querySelectorAll(`a[href*="${name}"]`)]}
function decorate(orderCount,reviewCount){style();lastOrders=Number(orderCount||0);lastReviews=Number(reviewCount||0);for(const[k,n]of [['ORDER',lastOrders],['REVIEW',lastReviews]])for(const a of relevantLinks(k)){const b=badgeFor(a),count=Number(n||0),text=count>99?'99+':String(count);if(b.textContent!==text)b.textContent=text;a.classList.toggle('has-attention',count>0);const label=(a.textContent||'').replace(/\d+$/,'').trim()+(count?`: ${count} новых`:'');if(a.getAttribute('aria-label')!==label)a.setAttribute('aria-label',label)}}

async function counts(){
  if(!session)return decorate(0,0);
  const{data,error}=await s.from('marketplace_notifications').select('type').eq('recipient_auth_user_id',session.user.id).eq('is_read',false).in('type',[TYPES.ORDER,TYPES.REVIEW]).limit(500);
  if(error)return;
  let orders=0,reviews=0;
  for(const x of data||[]){if(x.type===TYPES.ORDER)orders++;if(x.type===TYPES.REVIEW)reviews++}
  decorate(orders,reviews);
}

async function markSectionRead(){
  if(!session)return;
  let type=null;
  if(location.pathname.endsWith('/seller-orders.html'))type=TYPES.ORDER;
  if(location.pathname.endsWith('/seller-reviews.html'))type=TYPES.REVIEW;
  if(!type)return;
  await s.from('marketplace_notifications').update({is_read:true,read_at:new Date().toISOString()}).eq('recipient_auth_user_id',session.user.id).eq('type',type).eq('is_read',false);
}

function applicationServerKey(value){
  const padding='='.repeat((4-value.length%4)%4);
  const base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(base64),out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}

async function registration(){
  if(!pushSupported)return null;
  if(pushRegistration)return pushRegistration;
  await navigator.serviceWorker.register('/sw.js',{scope:'/'});
  pushRegistration=await navigator.serviceWorker.ready;
  return pushRegistration;
}

async function persistPushSubscription(sub){
  const value=sub?.toJSON?.()||{};
  const keys=value.keys||{};
  if(!value.endpoint||!keys.p256dh||!keys.auth)throw new Error('Браузер не вернул ключи push-подписки');
  const{error}=await s.rpc('marketplace_partner_upsert_push_subscription',{
    p_endpoint:value.endpoint,
    p_p256dh:keys.p256dh,
    p_auth:keys.auth,
    p_user_agent:navigator.userAgent
  });
  if(error)throw error;
}

function paintNotifyButtons(){
  document.querySelectorAll('.seller-browser-notify').forEach(b=>{
    const label=b.querySelector('.notify-label');
    b.disabled=pushBusy;
    b.classList.toggle('on',pushSupported&&Notification.permission==='granted'&&pushSubscribed);
    b.classList.toggle('blocked',!pushSupported||Notification.permission==='denied');
    if(!pushSupported){b.title='Фоновые уведомления не поддерживаются этим браузером';if(label)label.textContent='Недоступно';return}
    if(Notification.permission==='denied'){b.title='Уведомления заблокированы в настройках браузера';if(label)label.textContent='Заблокированы';return}
    if(pushBusy){b.title='Настраиваем фоновые уведомления';if(label)label.textContent='Подключение…';return}
    if(pushSubscribed){b.title='Фоновые уведомления о заказах и отзывах включены';if(label)label.textContent='Push включён';return}
    b.title=Notification.permission==='granted'?'Подключить фоновые push-уведомления':'Включить уведомления';
    if(label)label.textContent=Notification.permission==='granted'?'Включить push':'Уведомления';
  });
}

async function syncPush(createIfMissing=false){
  if(!pushSupported||!session||!partnerId)return false;
  if(Notification.permission!=='granted'){pushSubscribed=false;paintNotifyButtons();return false}
  pushBusy=true;paintNotifyButtons();
  try{
    const reg=await registration();
    let sub=await reg.pushManager.getSubscription();
    if(!sub&&createIfMissing){
      const{data:key,error}=await s.rpc('marketplace_push_public_key');
      if(error)throw error;
      if(!key)throw new Error('Push-ключ не настроен');
      sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationServerKey(String(key))});
    }
    if(sub)await persistPushSubscription(sub);
    pushSubscribed=!!sub;
    return pushSubscribed;
  }catch(error){
    console.error('CUIM push setup failed',error);
    pushSubscribed=false;
    if(createIfMissing)alert('Не удалось включить фоновые уведомления. Проверьте разрешения браузера и попробуйте ещё раз.');
    return false;
  }finally{pushBusy=false;paintNotifyButtons()}
}

async function enablePush(){
  if(!pushSupported){alert('Этот браузер не поддерживает фоновые push-уведомления.');return}
  if(Notification.permission==='denied'){alert('Разрешите уведомления для tcuim.online в настройках браузера.');return}
  if(Notification.permission!=='granted'){
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){paintNotifyButtons();return}
  }
  await syncPush(true);
}

function notifyPermissionButton(){
  if(!partnerId)return;
  const host=document.querySelector('.top-actions')||document.querySelector('#sellerLocationCard .location-actions')||document.querySelector('header .actions');
  if(!host)return;
  let b=host.querySelector('.seller-browser-notify');
  if(!b){
    b=document.createElement('button');
    b.type='button';
    b.className='btn light seller-browser-notify';
    b.innerHTML='<span aria-hidden="true">🔔</span><span class="notify-label">Уведомления</span>';
    const logout=host.querySelector('#logout,#logoutBtn');
    logout?host.insertBefore(b,logout):host.appendChild(b);
    b.onclick=enablePush;
  }
  paintNotifyButtons();
}

function showBrowserNotification(n){
  if(document.hidden||!n||!Object.values(TYPES).includes(n.type)||!('Notification'in window)||Notification.permission!=='granted')return;
  try{
    const x=new Notification(n.title||'ЦУИМ',{body:n.body||'',icon:'/images/logo_cuim.png',tag:'cuim-seller-'+String(n.id||n.entity_id||n.type)});
    x.onclick=()=>{window.focus();location.href=safeUrl(n.url);x.close()};
  }catch{}
}

function focusDeepLink(){
  if(deepLinkDone||(!targetOrder&&!targetReview))return;
  if(targetOrder&&!deepLinkPrepared){const all=document.querySelector('#tabs [data-filter="ALL"]');if(all&&!all.classList.contains('active'))all.click();deepLinkPrepared=true}
  const selector=targetOrder?`[data-order="${targetOrder}"]`:`[data-review="${targetReview}"]`;
  const el=document.querySelector(selector);
  if(!el)return;
  deepLinkDone=true;style();el.classList.add('seller-deep-link-focus');
  requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'center'}));
  setTimeout(()=>el.classList.remove('seller-deep-link-focus'),6500);
}

async function installRealtime(){
  if(!session)return;
  if(channel)await s.removeChannel(channel);
  channel=s.channel(`seller-attention-${session.user.id}`)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'marketplace_notifications',filter:`recipient_auth_user_id=eq.${session.user.id}`},payload=>{const n=payload.new||{};counts();showBrowserNotification(n)})
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'marketplace_notifications',filter:`recipient_auth_user_id=eq.${session.user.id}`},()=>counts())
    .subscribe();
}

async function boot(){
  session=(await s.auth.getSession()).data.session;
  if(!session)return;
  const{data,error}=await s.rpc('current_partner_id');
  if(error||!data)return;
  partnerId=data;
  await markSectionRead();
  await counts();
  notifyPermissionButton();
  await syncPush(false);
  await installRealtime();
  focusDeepLink();
  observer=new MutationObserver(()=>{decorate(lastOrders,lastReviews);notifyPermissionButton();focusDeepLink()});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{observer?.disconnect();observer=null},20000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){counts();focusDeepLink();paintNotifyButtons()}});
  setInterval(()=>{if(!document.hidden)counts()},60000);
}

boot();
