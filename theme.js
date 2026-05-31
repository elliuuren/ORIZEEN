// ==============================
// ORIZEEN TIMES — AUTO THEME
// ==============================

function applyTheme() {
  const hour = new Date().getHours();
  const isLight = hour >= 6 && hour < 18;
  document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
}

// Apply on load
applyTheme();

// Re-check every minute
setInterval(applyTheme, 60 * 1000);
