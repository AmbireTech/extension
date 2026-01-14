// run before React mounts and before paint, so the page doesn’t flash white → dark
;(function () {
  try {
    const theme = localStorage.getItem('fallbackSelectedThemeType')
    const root = document.getElementById('root')
    if (root) root.style.backgroundColor = theme === 'dark' ? '#0D0D0F' : '#ffffff'
    document.documentElement.classList.add(theme === 'dark' ? 'dark-scrollbar' : 'light-scrollbar')
  } catch (e) {
    // silent fail
  }
})()
