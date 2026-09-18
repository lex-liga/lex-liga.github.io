// Badminton admin actions + detail helpers
function getSb() {
  return window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}

window.updateBmField = async function (id, field, value) {
  var sb = getSb();
  if (!sb) return;
  var update = { updated_at: new Date().toISOString() };
  update[field] = value;
  var up = await sb.from('badminton_matches').update(update).eq('id', id);
  if (up.error) alert(up.error.message);
  else if (typeof loadBadmintonAdmin === 'function') loadBadmintonAdmin();
};

window.setBmScore = async function (id, side, delta) {
  var m = (typeof bmMatches !== 'undefined' ? bmMatches : []).find(function (x) { return String(x.id) === String(id); });
  if (!m) return;
  var key = side === 1 ? 'g1_p1' : 'g1_p2';
  var next = Math.max(0, (Number(m[key]) || 0) + delta);
  var update = { updated_at: new Date().toISOString() };
  update[key] = next;
  var up = await getSb().from('badminton_matches').update(update).eq('id', id);
  if (up.error) alert(up.error.message);
  else if (typeof loadBadmintonAdmin === 'function') loadBadmintonAdmin();
};

window.setBmStatus = async function (id, status) {
  var up = await getSb().from('badminton_matches').update({ status: status, updated_at: new Date().toISOString() }).eq('id', id);
  if (up.error) alert(up.error.message);
  else if (typeof loadBadmintonAdmin === 'function') loadBadmintonAdmin();
};

window.deleteBmMatch = async function (id) {
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
    player1: p1, player2: p2, category: cat || 'MS · R1',
    status: 'not_started', current_game: 1, games_p1: 0, games_p2: 0,
    g1_p1: 0, g1_p2: 0, g2_p1: 0, g2_p2: 0, g3_p1: 0, g3_p2: 0
  });
  if (ins.error) { alert('Could not add:\n' + ins.error.message); return; }
  document.getElementById('bmP1').value = '';
  document.getElementById('bmP2').value = '';
  if (document.getElementById('bmCategory')) document.getElementById('bmCategory').selectedIndex = 0;
  selectedBmId = null;
  loadBadmintonAdmin();
};
