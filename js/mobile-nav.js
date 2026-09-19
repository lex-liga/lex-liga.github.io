/* Lex Liga – uniform navbar + mobile hamburger + sport watermarks */
(function () {
  var LINKS = [
    { href: 'index.html', label: 'Home', id: 'home' },
    { href: 'futsal.html', label: '⚽ Futsal', id: 'futsal', sport: true },
    { href: 'badminton.html', label: '🏸 Badminton', id: 'badminton', sport: true },
    { href: 'teams.html', label: 'Teams', id: 'teams' },
    { href: 'gallery.html', label: 'Photos', id: 'gallery' },
    { href: 'fixtures.html', label: 'Fixtures', id: 'fixtures' }
  ];

  function currentFile() {
    var p = (location.pathname || '').split('/').pop() || 'index.html';
    if (!p || p === '' || p === '/') return 'index.html';
    return p;
  }

  function buildUniformNav() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var cur = currentFile();

    var html =
      '<div class="max-w-6xl mx-auto px-4 sm:px-6 py-3">' +
      '<div class="flex items-center justify-between gap-3">' +
      '<a href="index.html" class="site-wordmark">LEX <span>LIGA</span></a>' +
      '<nav class="site-nav" aria-label="Main">' +
      '<a href="index.html" class="nav-link' + (cur === 'index.html' ? ' is-active' : '') + '">Home</a>' +
      '<div class="sport-tabs">' +
      '<a href="futsal.html" class="sport-tab' + (cur === 'futsal.html' ? ' is-active' : '') + '"' +
      (cur === 'futsal.html' ? ' aria-current="page"' : '') + '><span>⚽</span> Futsal</a>' +
      '<a href="badminton.html" class="sport-tab' + (cur === 'badminton.html' ? ' is-active' : '') + '"' +
      (cur === 'badminton.html' ? ' aria-current="page"' : '') + '><span>🏸</span> Badminton</a>' +
      '</div>' +
      '<a href="teams.html" class="nav-link' + (cur === 'teams.html' ? ' is-active' : '') + '">Teams</a>' +
      '<a href="gallery.html" class="nav-link' + (cur === 'gallery.html' ? ' is-active' : '') + '">Photos</a>' +
      '<a href="fixtures.html" class="nav-link' + (cur === 'fixtures.html' ? ' is-active' : '') + '">Fixtures</a>' +
      '<button type="button" id="navBurger" class="nav-burger" aria-label="Open menu">☰</button>' +
      '</nav></div></div>';

    header.innerHTML = html;
    header.classList.add('sticky', 'top-0', 'z-50');

    if (!document.getElementById('navDrawer')) {
      var drawer = document.createElement('div');
      drawer.id = 'navDrawer';
      drawer.className = 'nav-drawer';
      drawer.innerHTML =
        '<div class="nav-drawer-panel">' +
        '<button type="button" class="nav-drawer-close" id="navDrawerClose" aria-label="Close">✕</button>' +
        LINKS.map(function (l) {
          var active = cur === l.href ? ' is-active' : '';
          return '<a class="' + active + '" href="' + l.href + '">' + l.label + '</a>';
        }).join('') +
        '</div>';
      document.body.appendChild(drawer);
    }

    var drawer = document.getElementById('navDrawer');
    function open() {
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    }

    var burger = document.getElementById('navBurger');
    if (burger) burger.onclick = open;
    var closeBtn = document.getElementById('navDrawerClose');
    if (closeBtn) closeBtn.onclick = close;
    drawer.onclick = function (e) {
      if (e.target === drawer) close();
    };
  }

  function buildSportWatermark() {
    if (document.getElementById('sportWm')) return;
    var cur = currentFile();
    var word = null;
    if (cur === 'futsal.html') word = 'FUTSAL';
    else if (cur === 'badminton.html') word = 'BADMINTON';
    if (!word) return;

    var unit = word + '  ·  ' + word + '  ·  ' + word + '  ·  ' + word + '  ·  ';
    var rows = 10;
    var html = '';
    for (var i = 0; i < rows; i++) {
      var line = i % 2 === 0 ? unit + unit : '   ' + unit + unit;
      html += '<div class="sport-wm-row">' + line + '</div>';
    }

    var el = document.createElement('div');
    el.id = 'sportWm';
    el.className = 'sport-wm';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="sport-wm-inner">' + html + '</div>';
    document.body.insertBefore(el, document.body.firstChild);
    document.body.classList.add('has-sport-wm');
  }

  function boot() {
    buildUniformNav();
    buildSportWatermark();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
