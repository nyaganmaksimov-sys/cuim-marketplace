// Товары
const allProducts = [
  // Новинки
  { id: 1, name: "Молоко фермерское", price: 95, category: "food", deliveryOnly: true, section: "new" },
  { id: 2, name: "Букет 'Солнце'", price: 850, category: "flowers", deliveryOnly: true, section: "new" },
  { id: 3, name: "Свеча 'Лес'", price: 450, category: "candles", deliveryOnly: false, section: "new" },
  { id: 4, name: "Мыло ручной работы", price: 220, category: "craft", deliveryOnly: false, section: "new" },
  // Детская одежда
  { id: 5, name: "Комплект на выпускной", price: 3799, category: "kids", deliveryOnly: false, section: "kids" },
  { id: 6, name: "Куртка Crockid", price: 3359, category: "kids", deliveryOnly: false, section: "kids" },
  { id: 7, name: "Комбинезон демисезонный", price: 3679, category: "kids", deliveryOnly: false, section: "kids" },
];

let cart = [];
let isPickup = false;

function renderProducts() {
  const newGrid = document.getElementById('product-grid');
  const kidsGrid = document.getElementById('kids-grid');
  newGrid.innerHTML = '';
  kidsGrid.innerHTML = '';

  const filtered = allProducts.filter(p => {
    if (isPickup && p.deliveryOnly) return false;
    return true;
  });

  filtered.forEach(p => {
    const grid = p.section === 'kids' ? kidsGrid : newGrid;
    const card = document.createElement('div');
    card.className = 'product-card';
    const emoji = p.category === 'food' ? '🥛' : 
                  p.category === 'flowers' ? '💐' : 
                  p.category === 'candles' ? '🕯' : 
                  p.category === 'kids' ? '👶' : '🎨';
    card.innerHTML = `
      <div class="product-image">${emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="price">${p.price} ₽</div>
      <button class="add-to-cart" data-id="${p.id}">В КОРЗИНУ</button>
    `;
    grid.appendChild(card);
  });

  // Навешиваем обработчики
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const product = allProducts.find(p => p.id === id);
      if (product) {
        cart.push(product);
        updateCart();
      }
    });
  });
}

function updateCart() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.getElementById('cart-total').textContent = `${total} ₽`;

  // Проверка минимальной суммы
  const minWarning = document.getElementById('min-warning');
  const shortAmount = 1500 - total;
  if (total > 0 && total < 1500) {
    minWarning.style.display = 'block';
    document.getElementById('short-amount').textContent = shortAmount;
  } else {
    minWarning.style.display = 'none';
  }

  // Если в корзине есть deliveryOnly товары — блокируем ПВЗ
  const hasDeliveryOnly = cart.some(item => item.deliveryOnly);
  const toggle = document.getElementById('delivery-toggle');
  if (hasDeliveryOnly && isPickup) {
    isPickup = false;
    toggle.checked = false;
    updateMode();
  }
}

function updateMode() {
  const label = document.getElementById('delivery-label');
  const banner = document.getElementById('mode-banner');
  if (isPickup) {
    label.textContent = '📍 Пункт выдачи';
    banner.textContent = '📍 Можно забрать в ПВЗ. Минимальный заказ: 1500 ₽.';
    banner.style.background = '#e3f2fd';
  } else {
    label.textContent = '📦 Доставка';
    banner.textContent = '🚚 Продукты — только с доставкой. Минимальный заказ: 1500 ₽.';
    banner.style.background = '#fff8e1';
  }
  renderProducts();
}

// Поиск
document.getElementById('search-input').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('.product-card').forEach(card => {
    const name = card.querySelector('.product-name').textContent.toLowerCase();
    card.style.display = name.includes(term) ? 'block' : 'none';
  });
});

// Переключатель доставки/ПВЗ
document.getElementById('delivery-toggle').addEventListener('change', (e) => {
  isPickup = e.target.checked;
  updateMode();
});

// Инициализация
renderProducts();
updateCart();
