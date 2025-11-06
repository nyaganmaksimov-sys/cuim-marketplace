document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('termsModal');
  const closeBtn = document.getElementById('close-modal');
  const links = document.querySelectorAll('#terms-link, #terms-link-footer');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'block';
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});
