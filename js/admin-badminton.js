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
window.loadBadmintonAdmin = async function () {
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
};
function renderBmUI() {
  var el = document.getElementById('adminBadmintonMatches');
  if (!el) return;
  if (selectedBmId) {
    var m = bmMatches.find(function (x) { return String(x.id) === String(selectedBmId); });
    if (!m) { selectedBmId = null; setBmAddVisible(true); return renderBmUI(); }
    setBmAddVisible(false);
    el.innerHTML = '<button type="button" onclick="showBmList()" class="flex items-center gap-2 text-sm text-green-400 font-semibold mb-4">' +
      '<span class="text-lg">&larr;</span> Back to matches</button>' + renderBmDetail(m);
    return;
  }
  setBmAddVisible(true);
  if (!bmMatches.length) {
    el.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet. Add one below.</p>';
    return;
  }
  var live = bmMatches.filter(function (m) { return m.status === 'live'; });
  var up = bmMatches.filter(function (m) { return m.status === 'not_started'; });
  var done = bmMatches.filter(function (m) { return m.status === 'finished'; });
  function section(title, list) {
    if (!list.length) return '';
    return '<p class="text-xs font-bold text-slate-500 uppercase mb-2 mt-4">' + title + '</p>' +
      '<div class="space-y-2">' + list.map(renderBmRow).join('') + '</div>';
  }
  el.innerHTML = section('Live', live) + section('Upcoming', up) + section('Finished', done) +
    '<p class="text-xs text-slate-500 text-center pt-2">Tap a match to control scores</p>';
}
function renderBmRow(m) {
  var p1 = Number(m.g1_p1) || 0, p2 = Number(m.g1_p2) || 0;
  return '<button type="button" onclick="openBmMatch(\'' + m.id + '\')" class="w-full text-left bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">' +
    '<div class="flex justify-between mb-1">' + bmStatusChip(m.status) +
    '<span class="text-[11px] text-slate-500">' + (m.category || '') + '</span></div>' +
    '<div class="flex items-center gap-2">' +
    '<span class="flex-1 text-sm font-semibold text-right truncate">' + (m.player1 || '') + '</span>' +
    '<span class="font-extrabold">' + p1 + '-' + p2 + '</span>' +
    '<span class="flex-1 text-sm font-semibold truncate">' + (m.player2 || '') + '</span></div>' +
    '<div class="text-[11px] text-green-400 text-center mt-1">Open controls</div></button>';
}
function renderBmDetail(m) {
  var p1 = Number(m.g1_p1) || 0, p2 = Number(m.g1_p2) || 0;
  var id = m.id;
  var n1 = (m.player1 || 'P1').split(' ')[0];
  var n2 = (m.player2 || 'P2').split(' ')[0];
  var liveCls = m.status === 'live' ? 'bg-red-600 text-white' : 'bg-slate-700';
  var finCls = m.status === 'finished' ? 'bg-slate-500 text-white' : 'bg-slate-700';
  var upCls = m.status === 'not_started' ? 'bg-blue-600 text-white' : 'bg-slate-700';
  return '<div class="bg-slate-800 rounded-2xl p-5 border border-slate-700">' +
    '<div class="text-center mb-4">' + bmStatusChip(m.status) +
    '<div class="text-xs text-slate-400 mt-2">' + (m.category || '') + '</div>' +
    '<div class="font-bold text-lg mt-2">' + (m.player1 || '') + '</div>' +
    '<div class="text-4xl font-extrabold my-2">' + p1 + ' - ' + p2 + '</div>' +
    '<div class="font-bold text-lg">' + (m.player2 || '') + '</div></div>' +
    '<div class="grid grid-cols-2 gap-3 mb-3">' +
    '<button type="button" onclick="bmScore(\'' + id + '\',\'p1\',1)" class="py-4 bg-green-500 text-slate-900 rounded-xl font-bold">+1 ' + n1 + '</button>' +
    '<button type="button" onclick="bmScore(\'' + id + '\',\'p2\',1)" class="py-4 bg-green-500 text-slate-900 rounded-xl font-bold">+1 ' + n2 + '</button></div>' +
    '<div class="grid grid-cols-2 gap-3 mb-4">' +
    '<button type="button" onclick="bmScore(\'' + id + '\',\'p1\',-1)" class="py-3 bg-slate-700 rounded-xl text-sm">-1 ' + n1 + '</button>' +
    '<button type="button" onclick="bmScore(\'' + id + '\',\'p2\',-1)" class="py-3 bg-slate-700 rounded-xl text-sm">-1 ' + n2 + '</button></div>' +
    '<div class="grid grid-cols-3 gap-2 mb-4">' +
    '<button type="button" onclick="bmStatus(\'' + id + '\',\'not_started\')