// Данные товаров (в будущем — из API или CMS)
const products = [
  { id: 1, name: "Молоко фермерское, 1л", price: 95, category: "food", deliveryOnly: true },
  { id: 2, name: "Букет 'Солнечный день'", price: 850, category: "flowers", deliveryOnly: true },
  { id: 3, name: "Аромасвеча 'Сосна и дым'", price: 450, category: "candles", deliveryOnly: false },
  { id: 4, name: "Керамическая кружка ручной работы", price: 600, category: "craft", deliveryOnly: false },
  { id: 5, name: "Фермерский багет", price: 120, category: "bread", deliveryOnly: true },
  { id: 6, name: "Мыло 'Лаванда и мёд'", price: 220, category: "craft", deliveryOnly: false },
  { id: 7, name: "Сыр 'Алтайский', 200г", price: 320, category: "food", deliveryOnly: true },
  { id: 8, name: "Декоративная подушка", price: 750, category: "craft", deliveryOnly: false },
  { id: 9, name: "Огурцы свежие, 1кг", price: 140, category: "food", deliveryOnly: true },
  { id: 10, name: "Розы красные, 5 шт", price: 450, category: "flowers", deliveryOnly: true },
  { id: 11, name: "Свеча 'Ваниль и корица'", price: 380, category: "candles", deliveryOnly: false },
  { id: 12, name: "Хлеб 'Ржаной с тмином'", price: 90, category: "bread", deliveryOnly: true }
];

let currentMode = 'delivery'; // 'delivery' или 'pickup'
let currentCategory = 'all';
let searchTerm = '';

function renderProducts() {
  const container = document.getElementById('products-list');
  container.innerHTML = '';

  const filtered = products.filter(p => {
    if (currentMode === 'pickup' && p.deliveryOnly) return false;
    if (currentCategory !== 'all' && p.category !== currentCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#888;">Нет товаров по выбранным условиям</p>';
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const emoji = p.category === 'food' ? '🥛' : 
                  p.category === 'flowers' ? '💐' : 
                  p.category === 'candles' ? '🕯' : 
                  p.category === 'bread' ? '🍞' : '🎨';
    card.innerHTML = `
      <div class="product-image">${emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">${p.price} ₽</div>
      ${p.deliveryOnly 
        ? '<span class="badge delivery">Только доставка</span>' 
        : '<span class="badge pickup">Можно в ПВЗ</span>'}
    `;
    container.appendChild(card);
  });
}

// Поиск
document.getElementById('search-input').addEventListener('input', (e) => {
  searchTerm = e.target.value.trim();
  renderProducts();
});

// Переключение режима доставки/ПВЗ
document.querySelectorAll('.delivery-type').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.delivery-type').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.type;
    
    const banner = document.querySelector('.info-banner');
    banner.className = 'info-banner ' + (currentMode === 'pickup' ? 'pickup-mode' : 'delivery-mode');
    
    renderProducts();
  });
});

// Переключение категории
document.querySelectorAll('.category').forEach(cat => {
  cat.addEventListener('click', () => {
    document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
    cat.classList.add('active');
    currentCategory = cat.dataset.category;
    renderProducts();
  });
});

// Инициализация
render
