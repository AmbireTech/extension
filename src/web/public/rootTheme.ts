// run before React mounts and before paint, so the page doesn’t flash white → dark
;(function () {
  try {
    const stored = localStorage.getItem('fallbackSelectedThemeType')

    const isDark =
      stored === 'dark'
        ? true
        : stored === 'light'
        ? false
        : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    document.documentElement.classList.add(isDark ? 'dark-scrollbar' : 'light-scrollbar')
    const root = document.getElementById('root')
    if (root) root.style.backgroundColor = isDark ? '#0D0D0F' : '#ffffff'
  } catch (e) {
    /* silent */
  }
})()
