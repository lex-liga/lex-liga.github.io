// Lex Liga Badminton Admin
// Single match score (like futsal) — not best of 3
// Category = stage: Round 1, QF, SF, Final, etc.

function getSb() {
  return window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}

function scoreOf(m, side) {
  if (side === 1) {
    if (m.score_p1 != null) return Number(m.score_p1) || 0;
    return Number(m.g1_p1) || 0;
  }
  if (m.score_p2 != null) return Number(m.score_p2) || 0;
  return Number(m.g1_p2) || 0;
}

async function loadBadmintonAdmin() {
  var container = document.getElementById('adminBadmintonMatches');
  if (!container) return;
  container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">Loading matches...</p>';
  var sb = getSb();
  if (!sb || typeof sb.from !== 'function') {
    container.innerHTML = '<p class="text-red-400 text-sm text-center px-3">Supabase client not ready.<br>Hard-refresh this page (Ctrl+Shift+R).</p>';
    return;
  }
  try {
    var res = await sb.from('badminton_matches').select('*').order('created_at', { ascending: false });
    if (res.error) {
      container.innerHTML = '<p class="text-red-400 text-sm text-center px-3">Error: ' + res.error.message + '</p>';
      return;
    }
    var data = res.data || [];
    if (!data.length) {
      container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet.<br>Add one below.</p>';
      return;
    }
    container.innerHTML = data.map(renderBadmintonCard).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-red-400 text-sm text-center px-3">Error: ' + (err.message || err) + '</p>';
  }
}
window.loadBadmintonAdmin = loadBadmintonAdmin;

function renderBadmintonCard(m) {
  var p1 = scoreOf(m, 1);
  var p2 = scoreOf(m, 2);
  var isFinished = m.status === 'finished';
  var isLive = m.status === 'live';
  var isUpcoming = m.status === 'not_started';
  var p1short = String(m.player1 || 'P1').split(' ')[0];
  var p2short = String(m.player2 || 'P2').split(' ')[0];
  var winner = '';
  if (isFinished) {
    if (p1 > p2) winner = m.player1;
    else if (p2 > p1) winner = m.player2;
  }
  return (
    '<div class="bg-slate-800 rounded-2xl p-5 border border-slate-700" data-id="' + m.id + '">' +
      '<div class="text-center mb-4">' +
        '<div class="text-xs text-slate-400 mb-1">' + (m.category || 'Match') + '</div>' +
        '<div class="font-bold text-lg">' + (m.player1 || '') + '</div>' +
        '<div class="text-4xl font-extrabold my-2">' + p1 + ' – ' + p2 + '</div>' +
        '<div class="font-bold text-lg">' + (m.player2 || '') + '</div>' +
        (winner ? '<div class="text-green-400 text-sm font-bold mt-2">Winner: ' + winner + '</div>' : '') +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3 mb-3">' +
        '<button type="button" onclick="bmPoint(\'' + m.id + '\', 1)" class="w-full big-btn bg-green-500 text-slate-900 rounded-xl py-4 font-bold">+1 ' + p1short + '</button>' +
        '<button type="button" onclick="bmPoint(\'' + m.id + '\', 2)" class="w-full big-btn bg-green-500 text-slate-900 rounded-xl py-4 font-bold">+1 ' + p2short + '</button>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3 mb-4">' +
        '<button type="button" onclick="bmPoint(\'' + m.id + '\', 1, -1)" class="py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1</button>' +
        '<button type="button" onclick="bmPoint(\'' + m.id + '\', 2, -1)" class="py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1</button>' +
      '</div>' +
      '<div class="grid grid-cols-3 gap-2 mb-3">' +
        '<button type="button" onclick="bmStatus(\'' + m.id + '\', \'not_started\')" class="status-btn rounded-xl py-2 text-xs font-semibold ' + (isUpcoming ? 'bg-blue-600 text-white' : 'bg-slate-700') + '">Upcoming</button>' +
        '<button type="button" onclick="bmStatus(\'' + m.id + '\', \'live\')" class="status-btn rounded-xl py-2 text-xs font-semibold ' + (isLive ? 'bg-red-600 text-white' : 'bg-slate-700') + '">LIVE</button>' +
        '<button type="button" onclick="bmStatus(\'' + m.id + '\', \'finished\')" class="status-btn rounded-xl py-2 text-xs font-semibold ' + (isFinished ? 'bg-slate-500 text-white' : 'bg-slate-700') + '">Finished</button>' +
      '</div>' +
      '<button type="button" onclick="bmReset(\'' + m.id + '\')" class="w-full py-2 mb-2 bg-slate-700 rounded-xl text-sm text-slate-300">Reset score</button>' +
      '<button type="button" onclick="bmDelete(\'' + m.id + '\')" class="text-xs text-red-400 underline w-full text-center">Delete match</button>' +
    '</div>'
  );
}

window.bmPoint = async function (id, side, delta) {
  if (delta === undefined) delta = 1;
  var sb = getSb();
  try {
    var res = await sb.from('badminton_matches').select('*').eq('id', id).single();
    if (res.error || !res.data) { alert(res.error ? res.error.message : 'Not found'); return; }
    var m = res.data;
    var p1 = scoreOf(m, 1);
    var p2 = scoreOf(m, 2);
    if (side === 1) p1 = Math.max(0, p1 + delta);
    else p2 = Math.max(0, p2 + delta);
    var update = {
      g1_p1: p1,
      g1_p2: p2,
      games_p1: 0,
      games_p2: 0,
      current_game: 1,
      updated_at: new Date().toISOString()
    };
    if (m.status === 'not_started') update.status = 'live';
    var up = await sb.from('badminton_matches').update(update).eq('id', id);
    if (up.error) alert(up.error.message);
    loadBadmintonAdmin();
  } catch (e) { alert(e.message || e); }
};

window.bmReset = async function (id) {
  if (!confirm('Reset score to 0–0?')) return;
  var sb = getSb();
  var up = await sb.from('badminton_matches').update({
    g1_p1: 0, g1_p2: 0, g2_p1: 0, g2_p2: 0, g3_p1: 0, g3_p2: 0,
    games_p1: 0, games_p2: 0, current_game: 1,
    updated_at: new Date().toISOString()
  }).eq('id', id);
  if (up.error) alert(up.error.message);
  loadBadmintonAdmin();
};

window.bmStatus = async function (id, status) {
  var sb = getSb();
  var up = await sb.from('badminton_matches').update({ status: status, updated_at: new Date().toISOString() }).eq('id', id);
  if (up.error) alert(up.error.message);
  loadBadmintonAdmin();
};

window.bmDelete = async function (id) {
  if (!confirm('Delete this match?')) return;
  var sb = getSb();
  var up = await sb.from('badminton_matches').delete().eq('id', id);
  if (up.error) alert(up.error.message);
  loadBadmintonAdmin();
};

window.addBadmintonMatch = async function () {
  var p1 = ((document.getElementById('bmP1') && document.getElementById('bmP1').value) || '').trim();
  var p2 = ((document.getElementById('bmP2') && document.getElementById('bmP2').value) || '').trim();
  var cat = ((document.getElementById('bmCategory') && document.getElementById('bmCategory').value) || '').trim();
  if (!p1 || !p2) { alert('Enter both names'); return; }
  var sb = getSb();
  if (!sb || typeof sb.from !== 'function') { alert('Supabase not ready'); return; }
  var ins = await sb.from('badminton_matches').insert({
    player1: p1, player2: p2, category: cat || 'Round 1',
    status: 'not_started', current_game: 1, games_p1: 0, games_p2: 0,
    g1_p1: 0, g1_p2: 0, g2_p1: 0, g2_p2: 0, g3_p1: 0, g3_p2: 0
  });
  if (ins.error) { alert('Could not add:\n' + ins.error.message); return; }
  document.getElementById('bmP1').value = '';
  document.getElementById('bmP2').value = '';
  document.getElementById('bmCategory').value = '';
  loadBadmintonAdmin();
};

document.getElementById('refreshBadminton') && document.getElementById('refreshBadminton').addEventListener('click', loadBadmintonAdmin);
