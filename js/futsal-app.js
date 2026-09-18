// Lex Liga Futsal public – pens + sudden death + standings + scorers
const sb = window.supabaseClient || window.supabase || supabase;
let allTeams = [], allMatches = [], allGoals = [];

function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function getTeamName(id) {
  const t = allTeams.find(x => x.id === id);
  return t ? t.name : 'TBD';
}
function statusBadge(status) {
  const map = { live: 'LIVE', half_time: 'HT', penalties: 'PENS', finished: 'FT', walkover: 'WO', not_started: 'Upcoming' };
  return '<span class="status-' + (status || 'not_started') + ' text-xs font-bold px-2 py-0.5 rounded text-white">' + (map[status] || status) + '</span>';
}
function teamGoals(match, teamId) {
  return allGoals.filter(g => g.match_id === match.id && g.team_id === teamId);
}

function matchWinnerSide(match) {
  const hs = Number(match.home_score) || 0;
  const as = Number(match.away_score) || 0;
  const ph = Number(match.pen_home) || 0;
  const pa = Number(match.pen_away) || 0;
  const pensOn = !!(match.pens_on || match.status === 'penalties' || ph || pa);
  if (hs > as) return 'home';
  if (as > hs) return 'away';
  if (pensOn && ph > pa) return 'home';
  if (pensOn && pa > ph) return 'away';
  return null;
}

function renderMatchCard(match) {
  const home = getTeamName(match.home_team_id);
  const away = getTeamName(match.away_team_id);
  const hs = Number(match.home_score) || 0;
  const as = Number(match.away_score) || 0;
  const ph = Number(match.pen_home) || 0;
  const pa = Number(match.pen_away) || 0;
  const pensOn = !!(match.pens_on || match.status === 'penalties' || ph || pa);
  const pensSudden = !!match.pens_sudden;
  let result = '';
  if (match.status === 'finished' || match.status === 'walkover') {
    if (hs > as) result = '<div class="match-winner">Winner: ' + escapeHtml(home) + '</div>';
    else if (as > hs) result = '<div class="match-winner">Winner: ' + escapeHtml(away) + '</div>';
    else if (pensOn && ph > pa) result = '<div class="match-winner">Winner: ' + escapeHtml(home) + ' <span style="opacity:.85">(on pens' + (pensSudden ? ' · SD' : '') + ')</span></div>';
    else if (pensOn && pa > ph) result = '<div class="match-winner">Winner: ' + escapeHtml(away) + ' <span style="opacity:.85">(on pens' + (pensSudden ? ' · SD' : '') + ')</span></div>';
    else result = '<div class="match-draw">Draw</div>';
  }
  const homeG = teamGoals(match, match.home_team_id).map(g => escapeHtml(g.player_name) + (g.minute != null ? ' ' + g.minute + "'" : '')).join(', ');
  const awayG = teamGoals(match, match.away_team_id).map(g => escapeHtml(g.player_name) + (g.minute != null ? ' ' + g.minute + "'" : '')).join(', ');
  return (
    '<div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700">' +
      '<div class="flex items-center justify-between mb-2">' + statusBadge(match.status) +
        '<span class="text-xs text-slate-400">' + escapeHtml(match.group_name || '') + '</span></div>' +
      '<div class="flex items-center gap-2">' +
        '<div class="flex-1 text-right font-semibold text-sm">' + escapeHtml(home) + '</div>' +
        '<div class="text-2xl font-extrabold px-2">' + hs + ' – ' + as + '</div>' +
        '<div class="flex-1 text-left font-semibold text-sm">' + escapeHtml(away) + '</div></div>' +
      (pensOn ? '<div class="text-center text-sm font-semibold mt-1" style="color:#fbbf24">Pens ' + ph + '–' + pa + (pensSudden ? ' · Sudden death' : '') + '</div>' : '') +
      result +
      ((homeG || awayG) ? '<div class="text-xs text-slate-400 mt-2 text-center">' + (homeG ? '⚽ ' + homeG : '') + (homeG && awayG ? ' · ' : '') + (awayG ? '⚽ ' + awayG : '') + '</div>' : '') +
    '</div>'
  );
}

function computeStandings() {
  const table = {};
  allTeams.forEach(t => {
    table[t.id] = { id: t.id, name: t.name, group: t.group_name || '', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
  });
  allMatches.forEach(m => {
    if (m.status !== 'finished' && m.status !== 'walkover') return;
    const home = table[m.home_team_id];
    const away = table[m.away_team_id];
    if (!home || !away) return;
    const hs = Number(m.home_score) || 0;
    const as = Number(m.away_score) || 0;
    home.played++; away.played++;
    home.gf += hs; home.ga += as;
    away.gf += as; away.ga += hs;
    const side = matchWinnerSide(m);
    if (side === 'home') { home.won++; away.lost++; home.pts += 3; }
    else if (side === 'away') { away.won++; home.lost++; away.pts += 3; }
    else { home.drawn++; away.drawn++; home.pts += 1; away.pts += 1; }
  });
  return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

function renderStandings(rows) {
  if (!rows.length) return '<p class="empty-state">No standings yet</p>';
  const byGroup = {};
  rows.forEach(r => {
    const g = r.group || 'League';
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(r);
  });
  return Object.keys(byGroup).map(g => {
    const list = byGroup[g];
    const body = list.map((r, i) =>
      '<tr class="border-t border-slate-700/60">' +
        '<td class="py-2 px-2 text-slate-400">' + (i + 1) + '</td>' +
        '<td class="py-2 px-2 font-medium">' + escapeHtml(r.name) + '</td>' +
        '<td class="py-2 px-2 text-center">' + r.played + '</td>' +
        '<td class="py-2 px-2 text-center font-bold text-green-400">' + r.pts + '</td>' +
      '</tr>'
    ).join('');
    return '<div class="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden">' +
      '<div class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wide">' + escapeHtml(g) + '</div>' +
      '<table class="w-full text-sm"><thead><tr class="text-xs text-slate-500">' +
      '<th class="py-1 px-2 text-left">#</th><th class="py-1 px-2 text-left">Team</th>' +
      '<th class="py-1 px-2">P</th><th class="py-1 px-2">Pts</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }).join('');
}

function renderTopScorers() {
  const map = {};
  allGoals.forEach(g => {
    const key = (g.player_name || 'Unknown') + '|' + (g.team_id || '');
    if (!map[key]) map[key] = { name: g.player_name || 'Unknown', team: getTeamName(g.team_id), goals: 0 };
    map[key].goals++;
  });
  const list = Object.values(map).sort((a, b) => b.goals - a.goals).slice(0, 10);
  if (!list.length) return '<p class="p-5 text-slate-400 text-sm">No goals yet</p>';
  return '<div class="divide-y divide-slate-700/60">' + list.map((s, i) =>
    '<div class="flex items-center justify-between px-4 py-3">' +
      '<div class="flex items-center gap-3"><span class="text-slate-500 text-sm w-5">' + (i + 1) + '</span>' +
      '<div><div class="font-semibold text-sm">' + escapeHtml(s.name) + '</div>' +
      '<div class="text-xs text-slate-400">' + escapeHtml(s.team) + '</div></div></div>' +
      '<div class="text-lg font-extrabold text-green-400">' + s.goals + '</div></div>'
  ).join('') + '</div>';
}

async function loadData() {
  if (!sb || typeof sb.from !== 'function') return;
  try {
    const [tRes, mRes, gRes] = await Promise.all([
      sb.from('teams').select('*'),
      sb.from('matches').select('*').order('kickoff_time', { ascending: true }),
      sb.from('goals').select('*')
    ]);
    allTeams = tRes.data || [];
    allMatches = mRes.data || [];
    allGoals = gRes.data || [];

    const live = allMatches.filter(m => m.status === 'live' || m.status === 'half_time' || m.status === 'penalties');
    const finished = allMatches.filter(m => m.status === 'finished' || m.status === 'walkover');

    if (typeof window.lexWatchScores === 'function') {
      window.lexWatchScores(live.map(m => ({
        id: 'f-' + m.id,
        label: 'Futsal: ' + getTeamName(m.home_team_id) + ' vs ' + getTeamName(m.away_team_id),
        scoreKey: (m.home_score||0)+'-'+(m.away_score||0)+'-p'+(m.pen_home||0)+'-'+(m.pen_away||0),
        isLive: true
      })));
    }

    const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    set('liveMatches', live.length ? live.map(renderMatchCard).join('') : '<p class="empty-state">No live matches</p>');
    set('recentResults', finished.length ? finished.slice().reverse().slice(0, 12).map(renderMatchCard).join('') : '<p class="empty-state">No results yet</p>');
    set('quickStandings', renderStandings(computeStandings()));
    set('topScorers', renderTopScorers());

    set('snapshotMatches', String(allMatches.length));
    set('snapshotLive', String(live.length));
    set('snapshotGoals', String(allGoals.length));
    const done = finished.length;
    set('snapshotDone', String(done));

    const up = document.getElementById('lastUpdated');
    if (up) up.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error(err);
    ['liveMatches', 'recentResults', 'quickStandings', 'topScorers'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="text-red-400 text-sm p-3">' + (err.message || 'Error') + '</p>';
    });
  }
}

function startAutoRefresh() { setInterval(loadData, 15000); }
function initTheme() {
  document.documentElement.classList.add('dark');
  if (document.body) document.body.classList.remove('light');
}
window.loadData = loadData;
window.startAutoRefresh = startAutoRefresh;
window.initTheme = initTheme;
