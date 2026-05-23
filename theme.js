// === THEME TOGGLE ===
const root = document.documentElement;
const btn = document.getElementById('themeToggle');
const saved = localStorage.getItem('orizeen-theme') || 'dark';

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('orizeen-theme', theme);
}

applyTheme(saved);
if (btn) btn.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});
