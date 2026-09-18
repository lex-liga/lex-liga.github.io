// Badminton admin score actions (loaded after admin-badminton.js)
window.bmScore = async function (id, side, delta) {
  var sb = getSb();
  try {
    var res = await sb.from('badminton_matches').select('*').eq('id', id).single();
    if (res.error || !res.data) { alert(res.error ? res.error.message : 'Not found'); return; }
    var m = res.data;
    var p1 = Number(m.g1_p1) || 0, p2 = Number(m.g1_p2) || 0;
    if (side === 'p1') p1 = Math.max(0, p1 + delta); else p2 = Math.max(0, p2 + delta);
    var update = { g1_p1: p1, g1_p2: p2, games_p1: 0, games_p2: 0, current_game: 1, updated_at: new Date().toISOString() };
    if (m.status === 'not_started') update.status = 'live';
    var up = await sb.from('badminton_matches').update(update).eq('id', id);
    if (up.error) alert(up.error.message);
    loadBadmintonAdmin();
  } catch (e) { alert(e.message || e); }
};
window.bmReset = async function (id) {
  if (!confirm('Reset score to 0-0?')) return;
  var up = await getSb().from('badminton_matches').update({
    g1_p1: 0, g1_p2: 0, g2_p1: 0, g2_p2: 0, g3_p1: 0, g3_p2: 0,
    games_p1: 0, games_p2: 0, current_game: 1, updated_at: new Date().toISOString()
  }).eq('id', id);
  if (up.error) alert(up.error.message);
  loadBadmintonAdmin();
};
window.bmStatus = async function (id, status) {
  var up = await getSb().from('badminton_matches').update({ status: status, updated_at: new Date().toISOString() }).eq('id', id);
  if (up.error) alert(up.error.message);
  loadBadmintonAdmin();
};
window.bmDelete = async function (id) {
  if (!confirm('Delete this match?')) return;
  var up = await getSb().from('badminton_matches').delete().eq('id', id);
  if (up.error) alert(up.error.message);
  else { selectedBmId = null; loadBadmintonAdmin(); }
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
  selectedBmId = null;
  loadBadmintonAdmin();
};
