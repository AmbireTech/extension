// Runs as a render-blocking <head> script (loaded before the stylesheets) so the
// document element gets its theme class before the first paint. Avoids the dark
// popup flashing white->dark on cold open. Has zero imports and lives outside the
// webpack bundle so its filename is stable ("rootTheme.js") and CSP 'self' works.
;(function () {
  try {
    var stored = localStorage.getItem('fallbackSelectedThemeType')
    var isDark =
      stored === 'dark'
        ? true
        : stored === 'light'
          ? false
          : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    var el = document.documentElement
    el.classList.add(isDark ? 'theme-dark' : 'theme-light')
    el.classList.add(isDark ? 'dark-scrollbar' : 'light-scrollbar')
  } catch (e) {
    /* silent: style.css prefers-color-scheme fallback covers this */
  }
})()