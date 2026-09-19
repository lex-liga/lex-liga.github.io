// Lex Liga Futsal public – pens + sudden death + standings + scorers
const sb = window.supabaseClient || window.supabase || supabase;
let allTeams = [], allMatches = [], allGoals = [];

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTeamName(id) {
  const t = allTeams.find(x => x.id === id);
  return t ? t.name : 'TBD';
}

function statusBadge(status) {
  const map = {
    live: ['LIVE', 'bg-red-600 text-white'],
    half_time: ['HT', 'bg-orange-500 text-white'],
    penalties: ['PENS', 'bg-amber-500 text-slate-900'],
    finished: ['FT', 'bg-slate-600 text-slate-200'],
    walkover: ['WO', 'bg-slate-600 text-slate-200'],
    not_started: ['Upcoming', 'bg-blue-600/40 text-blue-200']
  };

  const pair = map[status] || [
    status || '?',
    'bg-slate-700 text-slate-300'
  ];

  return (
    '<span class="status-badge status-' +
    (status || 'not_started') +
    ' text-xs font-bold px-2.5 py-1 rounded-full ' +
    pair[1] +
    '">' +
    pair[0] +
    '</span>'
  );
}

function teamGoals(match, teamId) {
  return allGoals.filter(
    g =>
      g.match_id === match.id &&
      g.team_id === teamId
  );
}

function matchWinnerSide(match) {
  const hs = Number(match.home_score) || 0;
  const as = Number(match.away_score) || 0;
  const ph = Number(match.pen_home) || 0;
  const pa = Number(match.pen_away) || 0;

  const pensOn = !!(
    match.pens_on ||
    match.status === 'penalties' ||
    ph ||
    pa
  );

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

  const pensOn = !!(
    match.pens_on ||
    match.status === 'penalties' ||
    ph ||
    pa
  );

  const pensSudden = !!match.pens_sudden;
  const isHalf = match.status === 'half_time';

  let result = '';

  if (
    match.status === 'finished' ||
    match.status === 'walkover'
  ) {
    if (hs > as) {
      result =
        '<div class="match-winner">Winner: ' +
        escapeHtml(home) +
        '</div>';
    } else if (as > hs) {
      result =
        '<div class="match-winner">Winner: ' +
        escapeHtml(away) +
        '</div>';
    } else if (pensOn && ph > pa) {
      result =
        '<div class="match-winner">Winner: ' +
        escapeHtml(home) +
        ' <span style="opacity:.85">(on pens' +
        (pensSudden ? ' · SD' : '') +
        ')</span></div>';
    } else if (pensOn && pa > ph) {
      result =
        '<div class="match-winner">Winner: ' +
        escapeHtml(away) +
        ' <span style="opacity:.85">(on pens' +
        (pensSudden ? ' · SD' : '') +
        ')</span></div>';
    } else {
      result =
        '<div class="match-draw">Draw</div>';
    }
  }

  const homeG = teamGoals(
    match,
    match.home_team_id
  )
    .map(
      g =>
        escapeHtml(g.player_name) +
        (g.minute ? " " + g.minute + "'" : '')
    )
    .join(', ');

  const awayG = teamGoals(
    match,
    match.away_team_id
  )
    .map(
      g =>
        escapeHtml(g.player_name) +
        (g.minute ? " " + g.minute + "'" : '')
    )
    .join(', ');

  const pensLine = pensOn
    ? '<div class="text-center text-sm mt-1 ' +
      (pensSudden
        ? 'text-red-400'
        : 'text-amber-400') +
      ' font-semibold">Pens ' +
      ph +
      '–' +
      pa +
      (pensSudden ? ' · SD' : '') +
      '</div>'
    : '';

  return (
    '<div class="match-card rounded-2xl p-4 border border-slate-700">' +

      '<div class="flex items-center justify-between mb-2">' +
        statusBadge(match.status) +
        '<span class="text-xs text-slate-400">' +
          escapeHtml(match.group_name || '') +
        '</span>' +
      '</div>' +

      (
        isHalf
          ? '<div class="mb-2 text-center text-xs font-bold text-orange-400 tracking-wide">HALF-TIME</div>'
          : ''
      ) +

      '<div class="grid grid-cols-3 gap-2 items-center text-center">' +

        '<div class="text-sm font-semibold text-right truncate">' +
          escapeHtml(home) +
        '</div>' +

        '<div class="text-2xl font-extrabold">' +
          hs +
          ' – ' +
          as +
        '</div>' +

        '<div class="text-sm font-semibold text-left truncate">' +
          escapeHtml(away) +
        '</div>' +

      '</div>' +

      pensLine +
      result +

      (
        (homeG || awayG)
          ? '<div class="mt-2 text-xs text-slate-400 grid grid-cols-2 gap-2">' +
              '<div class="text-right">' +
                (homeG || '') +
              '</div>' +
              '<div class="text-left">' +
                (awayG || '') +
              '</div>' +
            '</div>'
          : ''
      ) +

    '</div>'
  );
}

function teamGroupLabel(t) {
  if (
    t.group_name === 'Group A' ||
    t.group_name === 'Group B'
  ) {
    return t.group_name;
  }

  const n = (t.name || '').toLowerCase();

  if (
    /thassa|hazel|predator|one last/.test(n)
  ) {
    return 'Group A';
  }

  if (
    /butterfly|og|beer/.test(n)
  ) {
    return 'Group B';
  }

  return t.group_name || 'Other';
}

function computeStandings() {
  const table = {};

  allTeams.forEach(t => {
    table[t.id] = {
      id: t.id,
      name: t.name,
      group: teamGroupLabel(t),
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      pts: 0
    };
  });

  allMatches.forEach(m => {
    if (
      m.status !== 'finished' &&
      m.status !== 'walkover'
    ) {
      return;
    }

    const home = table[m.home_team_id];
    const away = table[m.away_team_id];

    if (!home || !away) {
      return;
    }

    /*
     * ONLY group-stage matches count toward group standings.
     *
     * A match is valid for standings only when:
     *   1. group_name exists
     *   2. group_name matches the home team's group
     *   3. group_name matches the away team's group
     *
     * This prevents knockout matches such as:
     *   Quarter-finals
     *   Semi-finals
     *   Final
     *
     * from affecting P, W, D, L, GF, GA, GD or Points.
     */
    if (
      !m.group_name ||
      m.group_name !== home.group ||
      m.group_name !== away.group
    ) {
      return;
    }

    const hs = Number(m.home_score) || 0;
    const as = Number(m.away_score) || 0;

    home.played++;
    away.played++;

    home.gf += hs;
    home.ga += as;

    away.gf += as;
    away.ga += hs;

    const side = matchWinnerSide(m);

    if (side === 'home') {
      home.won++;
      away.lost++;
      home.pts += 3;
    } else if (side === 'away') {
      away.won++;
      home.lost++;
      away.pts += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.pts += 1;
      away.pts += 1;
    }
  });

  return Object.values(table);
}

/*
 * Head-to-head tiebreak.
 *
 * Official order:
 *   Points → Goal Difference → Goals Scored
 *   → Goals Conceded → Head-to-Head.
 *
 * Group-stage matches are explicitly tagged as
 * "Group A" or "Group B" in the admin match form.
 *
 * Knockout matches use:
 *   "Quarter-finals"
 *   "Semi-finals"
 *   "Final"
 *
 * Therefore an exact group-name match is required here.
 *
 * For ties involving more than two teams, the rulebook does
 * not define a multi-team head-to-head calculation, so the
 * remaining order stays deterministic instead of inventing
 * an additional competition rule.
 */
function headToHeadWinner(teamA, teamB) {
  if (
    !teamA ||
    !teamB ||
    !teamA.group ||
    teamA.group !== teamB.group
  ) {
    return null;
  }

  /*
   * Only explicitly tagged group-stage matches
   * can be used for H2H.
   */
  const matches = allMatches.filter(m => {
    if (
      m.status !== 'finished' &&
      m.status !== 'walkover'
    ) {
      return false;
    }

    if (m.group_name !== teamA.group) {
      return false;
    }

    const aIsHome =
      m.home_team_id === teamA.id &&
      m.away_team_id === teamB.id;

    const aIsAway =
      m.home_team_id === teamB.id &&
      m.away_team_id === teamA.id;

    return aIsHome || aIsAway;
  });

  /*
   * Exactly one direct group-stage meeting is expected.
   */
  if (matches.length !== 1) {
    return null;
  }

  const m = matches[0];

  const hs = Number(m.home_score) || 0;
  const as = Number(m.away_score) || 0;

  /*
   * A drawn group-stage match does not produce
   * an H2H winner.
   */
  if (hs === as) {
    return null;
  }

  if (m.home_team_id === teamA.id) {
    return hs > as
      ? teamA.id
      : teamB.id;
  }

  return as > hs
    ? teamA.id
    : teamB.id;
}

function renderStandings(rows) {
  if (!rows.length) {
    return '<p class="empty-state">No standings yet</p>';
  }

  const byGroup = {};

  rows.forEach(r => {
    const g = r.group || 'Other';

    if (!byGroup[g]) {
      byGroup[g] = [];
    }

    byGroup[g].push(r);
  });

  const order = ['Group A', 'Group B'].concat(
    Object.keys(byGroup)
      .filter(
        g =>
          g !== 'Group A' &&
          g !== 'Group B'
      )
      .sort()
  );

  const sortRows = list => {
    const rows = list.slice();

    /*
     * Documented aggregate tiebreaks:
     * Points → GD → GF → GA.
     */
    rows.sort((a, b) => {
      if (b.pts !== a.pts) {
        return b.pts - a.pts;
      }

      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;

      if (gdB !== gdA) {
        return gdB - gdA;
      }

      if (b.gf !== a.gf) {
        return b.gf - a.gf;
      }

      if (a.ga !== b.ga) {
        return a.ga - b.ga;
      }

      return a.name.localeCompare(b.name);
    });

    /*
     * Identify teams tied on every previous criterion.
     */
    const tieGroups = {};

    rows.forEach(row => {
      const gd = row.gf - row.ga;

      const key = [
        row.pts,
        gd,
        row.gf,
        row.ga
      ].join('|');

      if (!tieGroups[key]) {
        tieGroups[key] = [];
      }

      tieGroups[key].push(row);
    });

    /*
     * Apply H2H only for an exact two-team tie.
     */
    Object.keys(tieGroups).forEach(key => {
      const tied = tieGroups[key];

      if (tied.length !== 2) {
        return;
      }

      const winnerId =
        headToHeadWinner(
          tied[0],
          tied[1]
        );

      if (
        !winnerId ||
        tied[0].id === winnerId
      ) {
        return;
      }

      const firstIndex =
        rows.findIndex(
          row => row.id === tied[0].id
        );

      const secondIndex =
        rows.findIndex(
          row => row.id === tied[1].id
        );

      if (
        firstIndex < 0 ||
        secondIndex < 0
      ) {
        return;
      }

      const temp = rows[firstIndex];

      rows[firstIndex] =
        rows[secondIndex];

      rows[secondIndex] =
        temp;
    });

    return rows;
  };

  return order
    .filter(
      g =>
        byGroup[g] &&
        byGroup[g].length
    )
    .map(g => {
      const list = sortRows(byGroup[g]);

      return (
        '<div class="rounded-2xl border border-slate-700 overflow-hidden mb-4">' +

          '<div class="px-4 py-2.5 bg-slate-800/80 text-sm font-extrabold text-green-400">' +
            escapeHtml(g) +
          '</div>' +

          '<div class="overflow-x-auto">' +

            '<table class="w-full text-sm">' +

              '<thead>' +
                '<tr class="text-slate-500 text-xs">' +

                  '<th class="text-left p-2">#</th>' +
                  '<th class="text-left p-2">Team</th>' +
                  '<th class="p-2">P</th>' +
                  '<th class="p-2">W</th>' +
                  '<th class="p-2">D</th>' +
                  '<th class="p-2">L</th>' +
                  '<th class="p-2">GF</th>' +
                  '<th class="p-2">GA</th>' +
                  '<th class="p-2">GD</th>' +
                  '<th class="p-2">Pts</th>' +

                '</tr>' +
              '</thead>' +

              '<tbody>' +

                list.map((r, i) =>
                  '<tr class="border-t border-slate-800">' +

                    '<td class="p-2 text-slate-500">' +
                      (i + 1) +
                    '</td>' +

                    '<td class="p-2 font-semibold">' +
                      escapeHtml(r.name) +
                    '</td>' +

                    '<td class="p-2 text-center">' +
                      r.played +
                    '</td>' +

                    '<td class="p-2 text-center">' +
                      r.won +
                    '</td>' +

                    '<td class="p-2 text-center">' +
                      r.drawn +
                    '</td>' +

                    '<td class="p-2 text-center">' +
                      r.lost +
                    '</td>' +

                    '<td class="p-2 text-center">' +
                      r.gf +
                    '</td>' +

                    '<td class="p-2 text-center">' +
                      r.ga +
                    '</td>' +

                    '<td class="p-2 text-center">' +
                      (r.gf - r.ga) +
                    '</td>' +

                    '<td class="p-2 text-center font-bold text-green-400">' +
                      r.pts +
                    '</td>' +

                  '</tr>'
                ).join('') +

              '</tbody>' +

            '</table>' +

          '</div>' +

        '</div>'
      );
    })
    .join('');
}

function renderTopScorers() {
  const counts = {};

  allGoals.forEach(g => {
    const key =
      g.player_name +
      '|' +
      g.team_id;

    if (!counts[key]) {
      counts[key] = {
        name: g.player_name,
        team: getTeamName(g.team_id),
        n: 0
      };
    }

    counts[key].n++;
  });

  const rows =
    Object.values(counts)
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);

  if (!rows.length) {
    return (
      '<p class="empty-state p-4">' +
      'No goals yet' +
      '</p>'
    );
  }

  return (
    '<div class="divide-y divide-slate-800">' +

      rows.map((r, i) =>
        '<div class="flex justify-between px-4 py-3 text-sm">' +

          '<span>' +

            '<span class="text-slate-500 mr-2">' +
              (i + 1) +
            '</span>' +

            escapeHtml(r.name) +

            ' <span class="text-slate-500">(' +
              escapeHtml(r.team) +
            ')</span>' +

          '</span>' +

          '<span class="font-bold text-green-400">' +
            r.n +
          '</span>' +

        '</div>'
      ).join('') +

    '</div>'
  );
}

async function loadFutsal() {
  const updated =
    document.getElementById('lastUpdated');

  if (updated) {
    updated.textContent = 'Updating…';
  }

  try {
    if (
      !sb ||
      typeof sb.from !== 'function'
    ) {
      throw new Error(
        'Supabase not ready'
      );
    }

    const [tr, mr, gr] =
      await Promise.all([
        sb
          .from('teams')
          .select('*')
          .order('name'),

        sb
          .from('matches')
          .select('*')
          .order(
            'kickoff_time',
            {
              ascending: true
            }
          ),

        sb
          .from('goals')
          .select('*')
      ]);

    if (tr.error) {
      throw tr.error;
    }

    if (mr.error) {
      throw mr.error;
    }

    allTeams =
      tr.data || [];

    allMatches =
      mr.data || [];

    allGoals =
      gr.data || [];

    const live =
      allMatches.filter(
        m =>
          m.status === 'live' ||
          m.status === 'half_time' ||
          m.status === 'penalties'
      );

    const finished =
      allMatches.filter(
        m =>
          m.status === 'finished' ||
          m.status === 'walkover'
      );

    if (
      typeof window.lexWatchScores ===
      'function'
    ) {
      window.lexWatchScores(
        live.map(m => ({
          id: m.id,

          label:
            getTeamName(
              m.home_team_id
            ) +
            ' vs ' +
            getTeamName(
              m.away_team_id
            ),

          score:
            (m.home_score || 0) +
            '-' +
            (m.away_score || 0),

          status:
            m.status
        }))
      );
    }

    const set = (id, html) => {
      const el =
        document.getElementById(id);

      if (el) {
        el.innerHTML = html;
      }
    };

    set(
      'liveMatches',
      live.length
        ? live
            .map(renderMatchCard)
            .join('')
        : '<p class="empty-state">No live matches</p>'
    );

    set(
      'recentResults',
      finished.length
        ? finished
            .slice()
            .reverse()
            .slice(0, 12)
            .map(renderMatchCard)
            .join('')
        : '<p class="empty-state">No results yet</p>'
    );

    set(
      'quickStandings',
      renderStandings(
        computeStandings()
      )
    );

    set(
      'topScorers',
      renderTopScorers()
    );

    set(
      'snapshotMatches',
      String(
        allMatches.length
      )
    );

    set(
      'snapshotLive',
      String(
        live.length
      )
    );

    set(
      'snapshotGoals',
      String(
        allGoals.length
      )
    );

    set(
      'snapshotTeams',
      String(
        allTeams.length
      )
    );

    if (updated) {
      updated.textContent =
        'Updated ' +
        new Date().toLocaleTimeString();
    }

  } catch (err) {
    console.error(err);

    [
      'liveMatches',
      'recentResults',
      'quickStandings',
      'topScorers'
    ].forEach(id => {
      const el =
        document.getElementById(id);

      if (el) {
        el.innerHTML =
          '<p class="text-red-400 text-sm p-3">' +
          (err.message || 'Error') +
          '</p>';
      }
    });
  }
}

document
  .getElementById('refreshBtn')
  ?.addEventListener(
    'click',
    loadFutsal
  );

loadFutsal();

setInterval(
  loadFutsal,
  12000
);
