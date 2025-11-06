// Данные товаров (в реальном проекте — из API)
const products = [
  { id: 1, name: "Молоко 1л", price: 95, category: "food", deliveryOnly: true },
  { id: 2, name: "Букет 'Солнце'", price: 850, category: "flowers", deliveryOnly: true },
  { id: 3, name: "Аромасвеча 'Лес'", price: 450, category: "candles", deliveryOnly: false },
  { id: 4, name: "Керамическая кружка", price: 600, category: "craft", deliveryOnly: false },
  { id: 5, name: "Багет фермерский", price: 120, category: "bread", deliveryOnly: true },
  { id: 6, name: "Мыло ручной работы", price: 220, category: "craft", deliveryOnly: false },
];

let currentMode = 'delivery'; // или 'pickup'

function renderProducts(categoryFilter = null) {
  const container = document.getElementById('products-list');
  container.innerHTML = '';

  const filtered = products.filter(p => {
    // Если ПВЗ — исключаем товары только для доставки
    if (currentMode === 'pickup' && p.deliveryOnly) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p>В этом режиме товаров нет.</p>';
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image">🥛</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">${p.price} ₽</div>
      ${p.deliveryOnly ? '<span class="badge delivery">Только доставка</span>' : '<span class="badge pickup">Можно в ПВЗ</span>'}
    `;
    container.appendChild(card);
  });
}

// Переключение режима
document.querySelectorAll('.delivery-type').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.delivery-type').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.type;
    
    // Меняем баннер
    const banner = document.querySelector('.info-banner');
    banner.className = 'info-banner ' + (currentMode === 'pickup' ? 'pickup-mode' : 'delivery-mode');
    
    renderProducts();
  });
});

// Категории
document.querySelectorAll('.category').forEach(cat => {
  cat.addEventListener('click', () => {
    renderProducts(cat.dataset.category);
  });
});

// Инициализация
renderProducts();
