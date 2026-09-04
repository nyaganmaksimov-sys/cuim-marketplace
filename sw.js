self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});

function safePath(value){
  try{
    const u=new URL(String(value||'/seller.html'),self.location.origin);
    return u.origin===self.location.origin?u.pathname+u.search+u.hash:'/seller.html';
  }catch{return'/seller.html'}
}

self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};
    try{data=event.data?.json()||{}}catch{try{data={body:event.data?.text()||''}}catch{}}
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    if(windows.some(client=>client.visibilityState==='visible'))return;
    const title=String(data.title||'ЦУИМ');
    const url=safePath(data.url);
    await self.registration.showNotification(title,{
      body:String(data.body||''),
      icon:'/images/logo_cuim.png',
      badge:'/images/logo_cuim.png',
      tag:String(data.tag||data.notification_id||data.conversation_id||'cuim-notification'),
      renotify:false,
      data:{url},
      actions:[{action:'open',title:'Открыть'}]
    });
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=safePath(event.notification?.data?.url);
  event.waitUntil((async()=>{
    const absolute=new URL(target,self.location.origin).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(new URL(client.url).origin!==self.location.origin)continue;
      try{await client.navigate(absolute)}catch{}
      return client.focus();
    }
    return self.clients.openWindow(absolute);
  })());
});
