import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://qgakliolffnwkymoqvzn.supabase.co',
  'sb_publishable_WbZxATu_lxqWF21jR_qFag_fcEeVIMu'
);

const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let slides = [];
let current = 0;
let timer = null;

function showSlide(index) {
  if (!slides.length) return;
  current = (index + slides.length) % slides.length;
  document.querySelectorAll('#heroSlides .slide').forEach((el,i)=>el.classList.toggle('active', i===current));
  document.querySelectorAll('#sliderDots .dot').forEach((el,i)=>el.classList.toggle('active', i===current));
}

function startAuto() {
  clearInterval(timer);
  if (slides.length > 1) timer = setInterval(()=>showSlide(current + 1), 6000);
}

function renderHero(items) {
  const root = document.getElementById('heroSlides');
  const dots = document.getElementById('sliderDots');
  const prev = document.getElementById('sliderPrev');
  const next = document.getElementById('sliderNext');
  if (!root) return;

  slides = (items || []).filter(x => x.image_url);
  if (!slides.length) {
    root.innerHTML = '<div class="slide active"><div class="slide-fallback"><span>Добавьте изображение баннера в админке Marketplace</span></div></div>';
    if (dots) dots.innerHTML = '';
    if (prev) prev.style.display = 'none';
    if (next) next.style.display = 'none';
    return;
  }

  root.innerHTML = slides.map((x,i) => {
    const img = `<img src="${esc(x.image_url)}" alt="${esc(x.title || 'Рекламный баннер')}" loading="${i===0?'eager':'lazy'}">`;
    return `<div class="slide ${i===0?'active':''}">${x.target_url ? `<a href="${esc(x.target_url)}">${img}</a>` : `<div class="slide-link">${img}</div>`}</div>`;
  }).join('');

  if (dots) dots.innerHTML = slides.length > 1 ? slides.map((_,i)=>`<button class="dot ${i===0?'active':''}" data-slide="${i}" aria-label="Баннер ${i+1}"></button>`).join('') : '';
  if (prev) prev.style.display = slides.length > 1 ? '' : 'none';
  if (next) next.style.display = slides.length > 1 ? '' : 'none';
  document.querySelectorAll('#sliderDots [data-slide]').forEach(b=>b.onclick=()=>{showSlide(Number(b.dataset.slide));startAuto();});
  if (prev) prev.onclick=()=>{showSlide(current-1);startAuto();};
  if (next) next.onclick=()=>{showSlide(current+1);startAuto();};
  current = 0;
  startAuto();
}

function renderAd(id, item) {
  if (!item || !item.image_url) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('has-image');
  el.style.backgroundImage = `url("${String(item.image_url).replace(/"/g,'%22')}")`;
  if (item.target_url) el.insertAdjacentHTML('beforeend', `<a href="${esc(item.target_url)}" aria-label="${esc(item.title || 'Реклама')}"></a>`);
}

async function loadMarketplaceBanners() {
  const { data, error } = await supabase.rpc('marketplace_active_banners', { p_placement: null });
  if (error) {
    console.error('Marketplace banners:', error);
    return;
  }
  const all = data || [];
  renderHero(all.filter(x => x.placement === 'HOME_TOP'));
  renderAd('adWide', all.find(x => x.placement === 'HOME_WIDE'));
  renderAd('adSide1', all.find(x => x.placement === 'HOME_SIDE_1'));
  renderAd('adSide2', all.find(x => x.placement === 'HOME_SIDE_2'));
}

loadMarketplaceBanners();
