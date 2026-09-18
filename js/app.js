/* Lex Liga Futsal – local app with penalty / sudden death display */
(function () {
  document.documentElement.classList.add('dark');
  if (document.body) document.body.classList.remove('light');
  try { localStorage.setItem('theme', 'dark'); } catch (e) {}
  var s = document.createElement('script');
  s.src = 'js/futsal-app.js?v=pens2';
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
        var rb = document.getElementById('refreshBtn');
        if (rb && typeof loadData === 'function') rb.onclick = function () { loadData(); };
      } catch (err) { console.error(err); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kick);
    else setTimeout(kick, 50);
  };
  s.onerror = function () {
    var el = document.getElementById('liveMatches');
    if (el) el.innerHTML = '<p class="empty-state" style="color:#f87171">Could not load scoring script.</p>';
  };
  document.head.appendChild(s);
})();
