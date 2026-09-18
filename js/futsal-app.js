// Lex Liga Futsal public – pens + sudden death winners
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
    const upcoming = allMatches.filter(m => m.status === 'not_started');
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
    set('recentMatches', finished.length ? finished.slice().reverse().slice(0, 12).map(renderMatchCard).join('') : '<p class="empty-state">No results yet</p>');
    set('upcomingMatches', upcoming.length ? upcoming.map(renderMatchCard).join('') : '<p class="empty-state">No upcoming matches</p>');
    set('allMatches', allMatches.length ? allMatches.map(renderMatchCard).join('') : '<p class="empty-state">No fixtures</p>');
    const up = document.getElementById('lastUpdated');
    if (up) up.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error(err);
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
