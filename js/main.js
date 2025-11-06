// Простой скрипт для переключения активного пункта меню
document.addEventListener('DOMContentLoaded', function() {
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      menuItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Поиск
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        alert('Поиск: ' + this.value);
        // Здесь можно добавить реальную логику поиска
      }
    });
  }
});
