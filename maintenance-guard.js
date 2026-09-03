(()=>{
  const SUPABASE_URL='https://qgakliolffnwkymoqvzn.supabase.co';
  const API_KEY='sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu';
  const root=document.documentElement;
  const previousVisibility=root.style.visibility;
  root.style.visibility='hidden';

  const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const showSite=()=>{root.style.visibility=previousVisibility||''};
  const showMaintenance=state=>{
    const title=escapeHtml(state?.maintenance_title||'Сайт находится в стадии разработки');
    const message=escapeHtml(state?.maintenance_message||'Мы проводим технические работы. Скоро всё заработает.');
    const render=()=>{
      document.title='ЦУИМ — технические работы';
      document.body.innerHTML=`
        <main class="cuim-maintenance">
          <div class="cuim-maintenance-glow glow-a"></div>
          <div class="cuim-maintenance-glow glow-b"></div>
          <section class="cuim-maintenance-card">
            <img src="/images/logo_cuim.png" alt="ЦУИМ" class="cuim-maintenance-logo">
            <div class="cuim-maintenance-badge"><span></span> Технические работы</div>
            <h1>${title}</h1>
            <p>${message}</p>
            <div class="cuim-maintenance-line"></div>
            <small>ЦУИМ · городской маркетплейс</small>
          </section>
        </main>`;
      const st=document.createElement('style');
      st.textContent=`
        html,body{margin:0;min-height:100%;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;background:#071633;color:#fff}
        body{min-height:100vh;overflow:hidden}.cuim-maintenance{position:relative;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:radial-gradient(circle at 15% 15%,#2563eb33,transparent 33%),radial-gradient(circle at 85% 85%,#7c3aed33,transparent 33%),linear-gradient(145deg,#030b1d,#071633 50%,#111c44);overflow:hidden}.cuim-maintenance-card{position:relative;z-index:2;width:min(620px,100%);padding:52px 46px 42px;border:1px solid #ffffff20;border-radius:32px;background:#ffffff0c;backdrop-filter:blur(20px);box-shadow:0 30px 100px #0008;text-align:center}.cuim-maintenance-logo{width:min(260px,70%);height:88px;object-fit:contain;margin-bottom:20px}.cuim-maintenance-badge{display:inline-flex;align-items:center;gap:9px;padding:8px 13px;border-radius:999px;background:#ffffff10;border:1px solid #ffffff1f;color:#bfdbfe;font-size:12px;font-weight:800;letter-spacing:.04em}.cuim-maintenance-badge span{width:8px;height:8px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 6px #f59e0b1f}.cuim-maintenance h1{margin:24px 0 14px;font-size:clamp(32px,6vw,54px);line-height:1.02;letter-spacing:-.04em}.cuim-maintenance p{max-width:500px;margin:0 auto;color:#cbd5e1;font-size:17px;line-height:1.65}.cuim-maintenance-line{width:70px;height:3px;margin:30px auto 18px;border-radius:999px;background:linear-gradient(90deg,#38bdf8,#8b5cf6)}.cuim-maintenance small{color:#7890b4;letter-spacing:.08em;text-transform:uppercase;font-weight:800}.cuim-maintenance-glow{position:absolute;border-radius:50%;filter:blur(16px);opacity:.35}.glow-a{width:360px;height:360px;background:#2563eb;left:-160px;top:-130px}.glow-b{width:420px;height:420px;background:#7c3aed;right:-190px;bottom:-180px}@media(max-width:600px){.cuim-maintenance{padding:16px}.cuim-maintenance-card{padding:38px 22px 32px;border-radius:24px}.cuim-maintenance-logo{height:68px}.cuim-maintenance p{font-size:15px}}
      `;
      document.head.appendChild(st);
      root.style.visibility='visible';
    };
    if(document.body)render();else document.addEventListener('DOMContentLoaded',render,{once:true});
  };

  const timeout=new AbortController();
  const timer=setTimeout(()=>timeout.abort(),5000);
  fetch(`${SUPABASE_URL}/rest/v1/rpc/marketplace_public_site_state`,{
    method:'POST',
    headers:{apikey:API_KEY,Authorization:`Bearer ${API_KEY}`,'Content-Type':'application/json'},
    body:'{}',
    signal:timeout.signal,
    cache:'no-store'
  }).then(async r=>{
    clearTimeout(timer);
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const data=await r.json();
    const state=Array.isArray(data)?data[0]:data;
    if(state?.maintenance_mode)showMaintenance(state);else showSite();
  }).catch(()=>{clearTimeout(timer);showSite()});
})();
