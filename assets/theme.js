// Runs in the head to avoid a flash of the wrong theme. Storage may be disabled.
(() => {
  let preference = 'auto';
  try { preference = localStorage.getItem('ThemeColorScheme') || 'auto'; } catch {}
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    const theme = preference === 'dark' || (preference !== 'light' && media.matches) ? 'dark' : 'light';
    document.documentElement.dataset.userColorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#202123' : '#faf9f6');
    const button = document.getElementById('dark-mode-button');
    if (button) {
      button.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
      button.title = button.getAttribute('aria-label');
    }
    window.dispatchEvent(new CustomEvent('onColorSchemeChange', { detail: theme }));
  };
  apply();
  media.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.getElementById('dark-mode-button')?.addEventListener('click', () => {
      preference = document.documentElement.dataset.userColorScheme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('ThemeColorScheme', preference); } catch {}
      apply();
    });
  });
})();
