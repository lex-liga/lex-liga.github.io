// Lex Liga Badminton Admin - list then detail controls
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
  var container = document.getElementById('adminBadmintonMatches');
  if (!container) return;
  if (!selectedBmId) container.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Loading...</p>';
  var sb = getSb();
  if (!sb || typeof sb.from !== 'function') {
    container.innerHTML = '<p class="text-red-400 text-sm text-center">Supabase not ready</p>';
    return;
  }
  try {
    var res = await sb.from('badminton_matches').select('*').order('created_at', { ascending: true });
    if (res.error) throw res.error;
    bmMatches = res.data || [];
    renderBmUI();
  } catch (e) {
    console.error(e);
    container.innerHTML = '<p class="text-red-400 text-sm text-center">' + (e.message || e) + '</p>';
  }
};
function renderBmUI() {
  var container = document.getElementById('adminBadmintonMatches');
  if (!container) return;
  if (selectedBmId) {
    var m = bmMatches.find(function (x) { return String(x.id) === String(selectedBmId); });
    if (!m) { selectedBmId = null; setBmAddVisible(true); return renderBmUI(); }
    setBmAddVisible(false);
    container.innerHTML =
      '<button type="button" onclick="showBmList()" class="flex items-center gap-2 text-sm text-green-400 font-semibold mb-4">' +
      '<span class="text-lg leading-none">&larr;</span> Back to matches</button>' + renderBmDetail(m);
    return;
  }
  setBmAddVisible(true);
  if (!bmMatches.length) {
    container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet.<br>Add one below.</p>';
    return;
  }
  var live = bmMatches.filter(function (m) { return m.status === 'live'; });
  var up = bmMatches.filter(function (m) { return m.status === 'not_started'; });
  var done = bmMatches.filter(function (m) { return m.status === 'finished'; });
  function section(title, list) {
    if (!list.length) return '';
    return '<p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 mt-4">' + title + '</p>' +
      '<div class="space-y-2 mb-2">' + list.map(renderBmRow).join('') + '</div>';
  }
  container.innerHTML = section('Live', live) + section('Upcoming', up) + section('Finished', done) +
    '<p class="text-xs text-slate-500 text-center pt-2">Tap a match to control scores</p>';
}
function renderBmRow(m) {
  var p1 = Number(m.g1_p1) || 0, p2 = Number(m.g1_p2) || 0;
  return '<button type="button" onclick="openBmMatch(\'' + m.id + '\')" class="w-full text-left bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">' +
    '<div class="flex items-center justify-between gap-2 mb-1">' + bmStatusChip(m.status) +
    '<span class="text-[11px] text-slate-500 truncate">' + (m.category || '') + '</span></div>' +
    '<div class="flex items-center gap-2">' +
    '<span class="flex-1 text-sm font-semibold truncate text-right">' + (m.player1 || '') + '</span>' +
    '<span class="text-lg font-extrabold tabular-nums px-1">' + p1 + '&ndash;' + p2 + '</span>' +
    '<span class="flex-1 text-sm font-semibold truncate">' + (m.player2 || '') + '</span></div>' +
    '<div class="text-[11px] text-green-400/80 mt-1 text-center">Open controls &rarr;</div></button>';
}
function renderBmDetail(m) {
  var p1 = Number(m.g1_p1) || 0, p2 = Number(m.g1_p2) || 0;
  var isLive = m.status === 'live', isFin = m.status === 'finished';
  var n1 = (m.player1 || 'P1').split(' ')[0], n2 = (m.player2 || 'P2').split(' ')[0];
  return '<div class="bg-slate-800 rounded-2xl p-5 border border-slate-700">' +
    '<div class="text-center mb-5"><div class="flex justify-center mb-2">' + bmStatusChip(m.status) + '</div>' +
    '<div class="text-xs text-slate-400 mb-2">' + (m.category || '') + '</div>' +
    '<div class="font-bold text-lg mb-1">' + (m.player1 || '') + '</div>' +
    '<div class="text-4xl font-extrabold my-2">' + p1 + ' <span class="text-slate-500">&ndash;</span> ' + p2 + '</div>' +
    '<div class="font-bold text-lg">' + (m.player2 || '') + '</div></div>' +
    '<div class="grid grid-cols-2 gap-3 mb-4">' +
    '<button type="button" onclick="bmScore(\'' + m.id + '\',\'p1\',1)" class="w-full py-4 bg-green-500 text-slate-900 rounded-xl font-bold">+1 ' + n1 + '</button>' +
    '<button type="button" onclick="bmScore(\'' + m.id + '\',\'p2\',1)" class="w-full py-4 bg-green-500 text-slate-900 rounded-xl font-bold">+1 ' + n2 + '</button></div>' +
    '<div class="grid grid-cols-2 gap-3 mb-5">' +
    '<button type="button" onclick="bmScore(\'' + m.id + '\',\'p1\',-1)" class="w-full py-3 bg-slate-700 rounded-xl text-sm font-semibold">-1 ' + n1 + '</button>' +
    '<button type="button" onclick="bmScore(\'' + m.id + '\',\'p2\',-1)" class="w-full py-3 bg-slate-700 rounded-xl text-sm font-semibold">-1 ' + n2 + '</button></div>' +
    '<div class="grid grid-cols-3 gap-2 mb-5">' +
    '<button type="button" onclick="bmStatus(\'' + m.id + '\',\'not_started\')