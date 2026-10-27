/**
 * SmartCampus Theme Controller
 * Defaults to dark theme with smooth transitions and perfect light mode support
 */
(function () {
  const KEY = 'smartcampus-theme';
  
  function getPreferredTheme() {
    const saved = localStorage.getItem(KEY);
    return saved ? saved : 'dark';
  }

  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark-theme', isDark);
    if (document.body) document.body.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.textContent = isDark ? '☀' : '☾';
      icon.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  const isDark = getPreferredTheme() === 'dark';
  applyTheme(isDark);

  window.addEventListener('storage', (e) => {
    if (e.key === KEY) applyTheme(e.newValue === 'dark');
  });

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme() === 'dark');
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.onclick = () => {
        const nextDark = getPreferredTheme() !== 'dark';
        localStorage.setItem(KEY, nextDark ? 'dark' : 'light');
        applyTheme(nextDark);
      };
    }
  });
})();
