/**
 * Theme toggle — binds click handler and syncs icon visibility.
 * The initial theme is set by an inline script in <head> to prevent FOUC.
 */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
});
