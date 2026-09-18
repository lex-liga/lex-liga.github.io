// Lex Liga home – live across sports
const sb = window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function teamName(teams, id) {
  const t = (teams || []).find(x => x.id === id);
  return t ? t.name : 'TBD';
}

async function loadHome() {
  const liveEl = document.getElementById('homeLive');
  const updated = document.getElementById('lastUpdated');
  if (updated) updated.textContent = 'Updating…';
  if (!sb || typeof sb.from !== 'function') {
    if (liveEl) liveEl.innerHTML = '<p class="empty-state">Supabase not ready</p>';
    return;
  }
  try {
    const [teamsRes, futsalRes, bmRes] = await Promise.all([
      sb.from('teams').select('*'),
      sb.from('matches').select('*').order('kickoff_time', { ascending: true }),
      sb.from('badminton_matches').select('*').order('created_at', { ascending: true })
    ]);
    const teams = teamsRes.data || [];
    const futsalAll = futsalRes.data || [];
    const bmAll = bmRes.data || [];

    const futsalLive = futsalAll.filter(m => m.status === 'live' || m.status === 'half_time' || m.status === 'penalties');
    const bmLive = bmAll.filter(m => m.status === 'live');

    // Snapshot stats
    const futsalFinished = futsalAll.filter(m => m.status === 'finished' || m.status === 'walkover').length;
    const bmFinished = bmAll.filter(m => m.status === 'finished').length;
    setText('statLive', String(futsalLive.length + bmLive.length));
    setText('statFutsal', String(futsalAll.length));
    setText('statBadminton', String(bmAll.length));
    setText('statDone', String(futsalFinished + bmFinished));
    setText('badgeFutsalLive', futsalLive.length ? futsalLive.length + ' LIVE' : 'View');
    setText('badgeBmLive', bmLive.length ? bmLive.length + ' LIVE' : 'View');

    const cards = [];
    futsalLive.forEach(m => cards.push(renderFutsalLive(m, teams)));
    bmLive.forEach(m => cards.push(renderBmLive(m)));

    if (liveEl) {
      liveEl.innerHTML = cards.length
        ? cards.join('')
        : '<p class="empty-state">No live matches right now</p>';
    }
    if (updated) updated.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (e) {
    console.error(e);
    if (liveEl) liveEl.innerHTML = '<p class="text-red-400 text-sm">' + (e.message || e) + '</p>';
  }
}

function renderFutsalLive(m, teams) {
  const home = teamName(teams, m.home_team_id);
  const away = teamName(teams, m.away_team_id);
  const pens = (m.pens_on || m.status === 'penalties' || m.pen_home || m.pen_away)
    ? ` · Pens ${(m.pen_home ?? 0)}–${(m.pen_away ?? 0)}`
    : '';
  const label = m.status === 'penalties' ? '⚽ Futsal · PENS' : (m.status === 'half_time' ? '⚽ Futsal · HT' : '⚽ Futsal · LIVE');
  return `
    <a href="futsal.html" class="home-live-card home-live-futsal">
      <div class="home-live-sport">${label}</div>
      <div class="home-live-scoreline">
        <span class="home-live-team">${home}</span>
        <span class="home-live-score">${m.home_score ?? 0} – ${m.away_score ?? 0}</span>
        <span class="home-live-team">${away}</span>
      </div>
      <div class="home-live-meta">${m.group_name || 'Match'}${pens} · Open Futsal →</div>
    </a>`;
}

function renderBmLive(m) {
  const p1 = Number(m.g1_p1) || 0;
  const p2 = Number(m.g1_p2) || 0;
  return `
    <a href="badminton.html" class="home-live-card home-live-badminton">
      <div class="home-live-sport">🏸 Badminton · LIVE</div>
      <div class="home-live-scoreline">
        <span class="home-live-team">${m.player1}</span>
        <span class="home-live-score">${p1} – ${p2}</span>
        <span class="home-live-team">${m.player2}</span>
      </div>
      <div class="home-live-meta">${m.category || 'Match'} · Open Badminton →</div>
    </a>`;
}

document.getElementById('refreshBtn')?.addEventListener('click', loadHome);
loadHome();
setInterval(loadHome, 15000);
