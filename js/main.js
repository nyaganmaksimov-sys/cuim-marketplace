// Данные товаров (в будущем — из API)
const products = [
  { id: 1, name: "Молоко фермерское, 1л", price: 95, category: "food", deliveryOnly: true },
  { id: 2, name: "Букет 'Солнечный день'", price: 850, category: "flowers", deliveryOnly: true },
  { id: 3, name: "Аромасвеча 'Сосна и дым'", price: 450, category: "candles", deliveryOnly: false },
  { id: 4, name: "Керамическая кружка ручной работы", price: 600, category: "craft", deliveryOnly: false },
  { id: 5, name: "Фермерский багет", price: 120, category: "bread", deliveryOnly: true },
  { id: 6, name: "Мыло 'Лаванда и мёд'", price: 220, category: "craft", deliveryOnly: false },
  { id: 7, name: "Сыр 'Алтайский', 200г", price: 320, category: "food", deliveryOnly: true },
  { id: 8, name: "Декоративная подушка", price: 750, category: "craft", deliveryOnly: false },
];

let currentMode = 'delivery'; // 'delivery' или 'pickup'
let currentCategory = 'all';

function renderProducts() {
  const container = document.getElementById('products-list');
  container.innerHTML = '';

  const filtered = products.filter(p => {
    if (currentMode === 'pickup' && p.deliveryOnly) return false;
    if (currentCategory !== 'all' && p.category !== currentCategory) return false;
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

// Активируем "Все" по умолчанию
document.querySelector('.category[data-category="all"]').classList.add('active');

// Инициализация
renderProducts();
