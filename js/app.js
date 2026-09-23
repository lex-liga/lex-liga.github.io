/* Lex Liga Futsal – loads local futsal-app */
(function () {
  document.documentElement.classList.add('dark');
  if (document.body) document.body.classList.remove('light');
  try { localStorage.setItem('theme', 'dark'); } catch (e) {}

  var s = document.createElement('script');
  s.src = 'js/futsal-app.js?v=knockout1';
  s.async = false;

  s.onload = function () {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.remove('light');
    var btn = document.getElementById('themeToggle');
    if (btn) btn.style.display = 'none';

    function kick() {
      try {
        if (typeof initTheme === 'function') initTheme();
        if (typeof loadData === 'function') loadData();
        if (typeof startAutoRefresh === 'function') startAutoRefresh();
        if (typeof loadFutsal === 'function') loadFutsal();
        var rb = document.getElementById('refreshBtn');
        if (rb) {
          rb.onclick = function () {
            if (typeof loadFutsal === 'function') loadFutsal();
            else if (typeof loadData === 'function') loadData();
          };
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', kick);
    } else {
      setTimeout(kick, 50);
    }
  };

  s.onerror = function () {
    var el = document.getElementById('liveMatches');
    if (el) {
      el.innerHTML =
        '<p class="empty-state" style="color:#f87171">Could not load scoring script.</p>';
    }
  };

  document.head.appendChild(s);
})();
