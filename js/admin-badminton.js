// Lex Liga Badminton Admin - list then open one match
function getSb() {
  return window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}
var bmMatches = [];
var selectedBmId = null;

function bmStatusChip(status) {
  var map = {
    not_started: ['Upcoming', 'bg-blue-600/30 text-blue-300'],
    live: ['LIVE', 'bg-red-600 text-white'],
    finished: ['FT', 'bg-slate-600 text-slate-200']
  };
  var pair = map[status] || [status || '?', 'bg-slate-700 text-slate-300'];
  return '<span class="text-[11px] font-bold px-2 py-0.5 rounded-full ' + pair[1] + '">' + pair[0] + '</span>';
}

function setBmAddVisible(show) {
  var box = document.getElementById('bmAddBox');
  if (!box) {
    var panel = document.getElementById('adminPanelBadminton');
    if (panel) {
      panel.querySelectorAll('.bg-slate-800').forEach(function (c) {
        if (c.querySelector('#bmAddBtn') || c.querySelector('#bmP1')) box = c;
      });
    }
  }
  if (box) box.classList.toggle('hidden', !show);
  var title = document.getElementById('bmListTitle');
  if (title) title.textContent = selectedBmId ? 'Control match' : 'Matches';
}

window.showBmList = function () {
  selectedBmId = null;
  setBmAddVisible(true);
  renderBmUI();
};

window.openBmMatch = function (id) {
  selectedBmId = id;
  setBmAddVisible(false);
  renderBmUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function loadBadmintonAdmin() {
  var el = document.getElementById('adminBadmintonMatches');
  if (!el) return;
  if (!selectedBmId) el.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Loading...</p>';
  var sb = getSb();
  if (!sb || typeof sb.from !== 'function') {
    el.innerHTML = '<p class="text-red-400 text-sm text-center">Supabase not ready</p>';
    return;
  }
  try {
    var res = await sb.from('badminton_matches').select('*').order('created_at', { ascending: true });
    if (res.error) throw res.error;
    bmMatches = res.data || [];
    renderBmUI();
  } catch (e) {
    el.innerHTML = '<p class="text-red-400 text-sm text-center">' + (e.message || e) + '</p>';
  }
}
window.loadBadmintonAdmin = loadBadmintonAdmin;

function catLabel(cat) {
  var c = (cat || '').trim();
  if (!c) return 'Other';
  var u = c.toUpperCase();
  if (u.indexOf('MS') === 0 || u.indexOf('MEN') >= 0 && u.indexOf('SING') >= 0) return "Men's Singles";
  if (u.indexOf('MD') === 0 || u.indexOf('MEN') >= 0 && u.indexOf('DOUB') >= 0) return "Men's Doubles";
  if (u.indexOf('WS') === 0 || u.indexOf('WOMEN') >= 0 && u.indexOf('SING') >= 0) return "Women's Singles";
  if (u.indexOf('WD') === 0 || u.indexOf('WOMEN') >= 0 && u.indexOf('DOUB') >= 0) return "Women's Doubles";
  if (u.indexOf('XD') === 0 || u.indexOf('MIX') >= 0) return 'Mixed Doubles';
  return c;
}

function catOrder(label) {
  var order = ["Men's Singles", "Men's Doubles", "Women's Singles", "Women's Doubles", 'Mixed Doubles'];
  var i = order.indexOf(label);
  return i >= 0 ? i : 50;
}

function statusOrder(s) {
  if (s === 'live') return 0;
  if (s === 'not_started') return 1;
  return 2;
}

function renderBmUI() {
  var el = document.getElementById('adminBadmintonMatches');
  if (!el) return;
  if (selectedBmId) {
    var m = bmMatches.find(function (x) { return String(x.id) === String(selectedBmId); });
    if (!m) { selectedBmId = null; setBmAddVisible(true); return renderBmUI(); }
    setBmAddVisible(false);
    el.innerHTML = '<button type="button" onclick="showBmList()" class="flex items-center gap-2 text-sm text-green-400 font-semibold mb-4">' +
      '<span class="text-lg">&larr;</span> Back to matches</button>' +
      (typeof renderBmDetail === 'function' ? renderBmDetail(m) : '<p class="text-red-400">Loading controls...</p>');
    return;
  }
  setBmAddVisible(true);
  if (!bmMatches.length) {
    el.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet. Add one below.</p>';
    return;
  }

  // Group by category, then by status within category
  var byCat = {};
  bmMatches.forEach(function (m) {
    var lab = catLabel(m.category);
    if (!byCat[lab]) byCat[lab] = [];
    byCat[lab].push(m);
  });
  var cats = Object.keys(byCat).sort(function (a, b) { return catOrder(a) - catOrder(b); });

  var html = '';
  cats.forEach(function (lab) {
    var list = byCat[lab].slice().sort(function (a, b) {
      return statusOrder(a.status) - statusOrder(b.status);
    });
    var liveN = list.filter(function (m) { return m.status === 'live'; }).length;
    var upN = list.filter(function (m) { return m.status === 'not_started'; }).length;
    html += '<div class="mt-5 first:mt-0">' +
      '<div class="flex items-center justify-between mb-2">' +
      '<p class="text-sm font-extrabold text-green-400">' + lab + '</p>' +
      '<span class="text-[11px] text-slate-500">' + list.length + ' · ' +
      (liveN ? liveN + ' live · ' : '') + upN + ' up</span></div>' +
      '<div class="space-y-2">' + list.map(renderBmRow).join('') + '</div></div>';
  });
  html += '<p class="text-xs text-slate-500 text-center pt-3">Tap a match to control scores</p>';
  el.innerHTML = html;
}

function renderBmRow(m) {
  var p1 = Number(m.g1_p1) || 0, p2 = Number(m.g1_p2) || 0;
  var isBye = String(m.player2 || '').toUpperCase() === 'BYE';
  return '<button type="button" onclick="openBmMatch(\'' + m.id + '\')" class="w-full text-left bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">' +
    '<div class="flex justify-between mb-1">' + bmStatusChip(m.status) +
    '<span class="text-[11px] text-slate-500">' + (m.category || '') + (isBye ? ' · BYE' : '') + '</span></div>' +
    '<div class="flex items-center gap-2">' +
    '<span class="flex-1 text-sm font-semibold text-right truncate">' + (m.player1 || '') + '</span>' +
    '<span class="font-extrabold">' + p1 + '-' + p2 + '</span>' +
    '<span class="flex-1 text-sm font-semibold truncate">' + (m.player2 || '') + '</span></div>' +
    '<div class="text-[11px] text-green-400 text-center mt-1">Open controls</div></button>';
}

(function loadBmExtras() {
  function add(src) {
    if (document.querySelector('script[src*="' + src.split('/').pop() + '"]')) return;
    var s = document.createElement('script');
    s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=7';
    s.async = false;
    document.body.appendChild(s);
  }
  add('js/admin-bm-detail.js');
  add('js/admin-bm-actions.js');
})();
