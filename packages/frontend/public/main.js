
document.querySelector('rock-solid-app').addEventListener('theme-changed', (e) => {
  document.body.dataset.bsTheme = e.detail;
});
