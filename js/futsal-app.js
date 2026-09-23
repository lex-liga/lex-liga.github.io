// Lex Liga Futsal public – knockout stage + standings + scorers
const sb = window.supabaseClient || window.supabase || supabase;
let allTeams = [], allMatches = [], allGoals = [];

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function getTeamName(id) {
  const t = allTeams.find(x => x.id === id);
  return t ? t.name : 'TBD';
}

function statusBadge(status) {
  const map = {
    live: ['LIVE', 'bg-red-600 text-white'],
    half_time: ['HT', 'bg-orange-500 text-white'],
    extra_time: ['ET', 'bg-purple-600 text-white'],
    penalties: ['PENS', 'bg-amber-500 text-slate-900'],
    finished: ['FT', 'bg-slate-600 text-slate-200'],
    walkover: ['WO', 'bg-slate-600 text-slate-200'],
    not_started: ['Upcoming', 'bg-blue-600/40 text-blue-200']
  };
  const pair = map[status] || [status || '?', 'bg-slate-700 text-slate-300'];
  return '<span class="status-badge status-' + (status || 'not_started') + ' text-xs font-bold px-2.5 py-1 rounded-full ' + pair[1] + '">' + pair[0] + '</span>';
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
  const isHalf = match.status === 'half_time';
  const isExtraTime = match.status === 'extra_time';
  let result = '';
  if (match.status === 'finished' || match.status === 'walkover') {
    if (hs > as) result = '<div class="match-winner">Winner: ' + escapeHtml(home) + '</div>';
    else if (as > hs) result = '<div class="match-winner">Winner: ' + escapeHtml(away) + '</div>';
    else if (pensOn && ph > pa) result = '<div class="match-winner">Winner: ' + escapeHtml(home) + ' <span style="opacity:.85">(on pens' + (pensSudden ? ' · SD' : '') + ')</span></div>';
    else if (pensOn && pa > ph) result = '<div class="match-winner">Winner: ' + escapeHtml(away) + ' <span style="opacity:.85">(on pens' + (pensSudden ? ' · SD' : '') + ')</span></div>';
    else result = '<div class="match-draw">Draw</div>';
  }
  const homeG = teamGoals(match, match.home_team_id).map(g => escapeHtml(g.player_name) + (g.minute ? " " + g.minute + "'" : '')).join(', ');
  const awayG = teamGoals(match, match.away_team_id).map(g => escapeHtml(g.player_name) + (g.minute ? " " + g.minute + "'" : '')).join(', ');
  const pensLine = pensOn ? '<div class="text-center text-sm mt-1 ' + (pensSudden ? 'text-red-400' : 'text-amber-400') + ' font-semibold">Pens ' + ph + '–' + pa + (pensSudden ? ' · SD' : '') + '</div>' : '';
  return (
    '<div class="match-card rounded-2xl p-4 border border-slate-700">' +
      '<div class="flex items-center justify-between mb-2">' + statusBadge(match.status) +
        '<span class="text-xs text-slate-400">' + escapeHtml(match.group_name || '') + '</span></div>' +
      (isHalf ? '<div class="mb-2 text-center text-xs font-bold text-orange-400 tracking-wide">HALF-TIME</div>' : '') +
      (isExtraTime ? '<div class="mb-2 text-center text-xs font-bold text-purple-400 tracking-wide">EXTRA TIME</div>' : '') +
      '<div class="grid grid-cols-3 gap-2 items-center text-center">' +
        '<div class="text-sm font-semibold text-right truncate">' + escapeHtml(home) + '</div>' +
        '<div class="text-2xl font-extrabold">' + hs + ' – ' + as + '</div>' +
        '<div class="text-sm font-semibold text-left truncate">' + escapeHtml(away) + '</div>' +
      '</div>' +
      pensLine + result +
      ((homeG || awayG) ? '<div class="mt-2 text-xs text-slate-400 grid grid-cols-2 gap-2"><div class="text-right">' + (homeG || '') + '</div><div class="text-left">' + (awayG || '') + '</div></div>' : '') +
    '</div>'
  );
}

function renderKnockoutCard(match, label) {
  var home = getTeamName(match.home_team_id);
  var away = getTeamName(match.away_team_id);
  var hs = Number(match.home_score) || 0;
  var as_ = Number(match.away_score) || 0;
  var ph = Number(match.pen_home) || 0;
  var pa = Number(match.pen_away) || 0;
  var pensOn = !!(match.pens_on || match.status === 'penalties' || ph || pa);
  var status = match.status || 'not_started';
  var isFinal = /final/i.test(String(match.group_name || '')) && !/semi/i.test(String(match.group_name || ''));
  var isTbd = /TBD/i.test(home) || /TBD/i.test(away);
  var statusLabel = status === 'live' ? 'LIVE' : status === 'half_time' ? 'HT' : status === 'finished' ? 'FT' : status === 'penalties' ? 'PENS' : 'UPCOMING';
  var statusColor = status === 'live' ? '#22c55e' : status === 'finished' ? '#94a3b8' : isFinal ? '#fbbf24' : '#60a5fa';
  var winner = '';
  if (status === 'finished' || status === 'walkover') {
    if (hs > as_) winner = home;
    else if (as_ > hs) winner = away;
    else if (pensOn && ph > pa) winner = home;
    else if (pensOn && pa > ph) winner = away;
  }
  var pensLine = '';
  if (pensOn && (status === 'finished' || status === 'penalties')) {
    pensLine = '<div class="ko-tba" style="color:#fbbf24">Pens ' + ph + '–' + pa + '</div>';
  }
  return (
    '<div class="ko-card' + (isFinal ? ' ko-final' : '') + (status === 'live' || status === 'penalties' ? ' ko-live' : '') + '">' +
      '<div class="ko-card-top">' +
        '<span class="ko-label">' + escapeHtml(label || match.group_name || 'Knockout') + '</span>' +
        '<span class="ko-status" style="color:' + statusColor + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="ko-teams">' +
        '<div class="ko-team' + (winner === home ? ' ko-winner' : '') + '">' +
          '<span class="ko-team-name">' + escapeHtml(isTbd && status === 'not_started' ? 'TBD' : home) + '</span>' +
          '<span class="ko-score">' + (status === 'not_started' && isTbd ? '–' : hs) + '</span>' +
        '</div>' +
        '<div class="ko-vs">VS</div>' +
        '<div class="ko-team' + (winner === away ? ' ko-winner' : '') + '">' +
          '<span class="ko-team-name">' + escapeHtml(isTbd && status === 'not_started' ? 'TBD' : away) + '</span>' +
          '<span class="ko-score">' + (status === 'not_started' && isTbd ? '–' : as_) + '</span>' +
        '</div>' +
      '</div>' +
      pensLine +
      (winner ? '<div class="ko-winner-line">Winner · ' + escapeHtml(winner) + (pensOn && hs === as_ ? ' (on pens)' : '') + '</div>' : '') +
      (isFinal && isTbd && status === 'not_started' ? '<div class="ko-tba">Finalists TBA after semis</div>' : '') +
    '</div>'
  );
}

function renderKnockoutSection(matches) {
  var semis = matches.filter(function (m) {
    return /semi/i.test(String(m.group_name || ''));
  });
  var finals = matches.filter(function (m) {
    var g = String(m.group_name || '').toLowerCase();
    return g.indexOf('final') >= 0 && g.indexOf('semi') < 0;
  });
  var html = '';
  if (semis.length) {
    html += '<div class="ko-row">';
    semis.forEach(function (m, i) {
      html += renderKnockoutCard(m, 'Semi-final ' + (i + 1));
    });
    html += '</div>';
  }
  if (finals.length) {
    html += '<div class="ko-row ko-row-final">';
    finals.forEach(function (m) {
      var notes = String(m.notes || '');
      var lab = '🏆 Final';
      if (/women/i.test(notes)) lab = '🏆 Women Final';
      else if (/men/i.test(notes)) lab = '🏆 Men Final';
      else if (/women/i.test(getTeamName(m.home_team_id) + getTeamName(m.away_team_id))) lab = '🏆 Women Final';
      html += renderKnockoutCard(m, lab);
    });
    html += '</div>';
  }
  if (!html) html = '<p class="empty-state">Knockout matches will appear here</p>';
  return html;
}

function teamGroupLabel(t) {
  const group = String(t.group_name || '').trim();
  if (group === 'Group A' || group === 'Group B' || group === 'Group C' || group === 'Group D' || group === 'Group E') return group;
  return group || 'Other';
}

function computeStandings() {
  const table = {};
  allTeams.forEach(t => {
    if (/TBD/i.test(String(t.name || ''))) return;
    table[t.id] = { id: t.id, name: t.name, group: teamGroupLabel(t), played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
  });
  allMatches.forEach(m => {
    if (m.status !== 'finished' && m.status !== 'walkover') return;
    const home = table[m.home_team_id];
    const away = table[m.away_team_id];
    if (!home || !away) return;
    if (home.group !== away.group || (home.group !== 'Group A' && home.group !== 'Group B')) return;
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
  return Object.values(table);
}

function renderStandings(rows) {
  if (!rows.length) return '<p class="empty-state">No standings yet</p>';
  const byGroup = {};
  rows.forEach(r => {
    const g = r.group || 'Other';
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(r);
  });
  const order = ['Group A', 'Group B'].concat(
    Object.keys(byGroup).filter(g => !['Group A','Group B'].includes(g)).sort()
  );
  const sortRows = list => list.slice().sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });
  return order.filter(g => byGroup[g] && byGroup[g].length).map(g => {
    const list = sortRows(byGroup[g]);
    return '<div class="rounded-2xl border border-slate-700 overflow-hidden mb-4">' +
      '<div class="px-4 py-2.5 bg-slate-800/80 text-sm font-extrabold text-green-400">' + escapeHtml(g) + '</div>' +
      '<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-slate-500 text-xs">' +
      '<th class="text-left p-2">#</th><th class="text-left p-2">Team</th><th class="p-2">P</th><th class="p-2">W</th><th class="p-2">D</th><th class="p-2">L</th><th class="p-2">GF</th><th class="p-2">GA</th><th class="p-2">GD</th><th class="p-2">Pts</th></tr></thead><tbody>' +
      list.map((r, i) => '<tr class="border-t border-slate-800">' +
        '<td class="p-2 text-slate-500">' + (i + 1) + '</td>' +
        '<td class="p-2 font-semibold">' + escapeHtml(r.name) + '</td>' +
        '<td class="p-2 text-center">' + r.played + '</td>' +
        '<td class="p-2 text-center">' + r.won + '</td>' +
        '<td class="p-2 text-center">' + r.drawn + '</td>' +
        '<td class="p-2 text-center">' + r.lost + '</td>' +
        '<td class="p-2 text-center">' + r.gf + '</td>' +
        '<td class="p-2 text-center">' + r.ga + '</td>' +
        '<td class="p-2 text-center">' + (r.gf - r.ga) + '</td>' +
        '<td class="p-2 text-center font-bold text-green-400">' + r.pts + '</td></tr>').join('') +
      '</tbody></table></div></div>';
  }).join('');
}

function renderTopScorers() {
  const counts = {};
  allGoals.forEach(g => {
    const pname = String(g.player_name || '');
    if (/\bOG\b|own\s*goal/i.test(pname)) return;
    const key = g.player_name + '|' + g.team_id;
    if (!counts[key]) counts[key] = { name: g.player_name, team: getTeamName(g.team_id), n: 0 };
    counts[key].n++;
  });
  const rows = Object.values(counts).sort((a, b) => b.n - a.n).slice(0, 10);
  if (!rows.length) return '<p class="empty-state p-4">No goals yet</p>';
  return '<div class="divide-y divide-slate-800">' +
    rows.map((r, i) =>
      '<div class="flex justify-between px-4 py-3 text-sm">' +
        '<span><span class="text-slate-500 mr-2">' + (i + 1) + '</span>' +
        escapeHtml(r.name) + ' <span class="text-slate-500">(' + escapeHtml(r.team) + ')</span></span>' +
        '<span class="font-bold text-green-400">' + r.n + '</span></div>'
    ).join('') + '</div>';
}

async function loadFutsal() {
  const updated = document.getElementById('lastUpdated');
  if (updated) updated.textContent = 'Updating…';
  try {
    if (!sb || typeof sb.from !== 'function') throw new Error('Supabase not ready');
    const [tr, mr, gr] = await Promise.all([
      sb.from('teams').select('*').order('name'),
      sb.from('matches').select('*').order('kickoff_time', { ascending: true }),
      sb.from('goals').select('*')
    ]);
    if (tr.error) throw tr.error;
    if (mr.error) throw mr.error;
    allTeams = tr.data || [];
    allMatches = mr.data || [];
    allGoals = gr.data || [];

    const live = allMatches.filter(m =>
      m.status === 'live' || m.status === 'half_time' || m.status === 'extra_time' || m.status === 'penalties'
    );
    const finished = allMatches.filter(m => m.status === 'finished' || m.status === 'walkover');

    if (typeof window.lexWatchScores === 'function') {
      window.lexWatchScores(allMatches.map(m => ({
        id: 'futsal-' + m.id,
        label: getTeamName(m.home_team_id) + ' vs ' + getTeamName(m.away_team_id),
        scoreKey: String(m.home_score || 0) + '-' + String(m.away_score || 0) +
          '|pens:' + String(m.pen_home || 0) + '-' + String(m.pen_away || 0) +
          '|status:' + String(m.status || ''),
        isLive: m.status === 'live' || m.status === 'half_time' || m.status === 'extra_time' || m.status === 'penalties'
      })));
    }

    const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    set('knockoutMatches', renderKnockoutSection(allMatches));
    set('liveMatches', live.length ? live.map(renderMatchCard).join('') : '<p class="empty-state">No live matches</p>');
    set('recentResults', finished.length ? finished.slice().reverse().slice(0, 12).map(renderMatchCard).join('') : '<p class="empty-state">No results yet</p>');
    set('quickStandings', renderStandings(computeStandings()));
    set('topScorers', renderTopScorers());
    set('snapshotMatches', String(allMatches.length));
    set('snapshotLive', String(live.length));
    set('snapshotGoals', String(allGoals.length));
    set('snapshotTeams', String(allTeams.filter(t => !/TBD/i.test(t.name || '')).length));
    if (updated) updated.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error(err);
    ['knockoutMatches', 'liveMatches', 'recentResults', 'quickStandings', 'topScorers'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="text-red-400 text-sm p-3">' + (err.message || 'Error') + '</p>';
    });
  }
}

window.loadFutsal = loadFutsal;
document.getElementById('refreshBtn')?.addEventListener('click', loadFutsal);
loadFutsal();
setInterval(loadFutsal, 12000);
