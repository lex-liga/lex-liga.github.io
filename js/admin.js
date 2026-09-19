// Lex Liga Futsal Admin – goals, cards, extra time, penalties, sudden death

const sb = window.supabaseClient || window.supabase || supabase;

const logoutBtn = document.getElementById('logoutBtn');

logoutBtn?.addEventListener('click', () => {
  sessionStorage.removeItem('lexAdmin');
  sessionStorage.removeItem('lexAdminSport');
  location.reload();
});

document
  .getElementById('refreshAdmin')
  ?.addEventListener('click', loadAdminData);

let allTeams = [];
let allGoals = [];
let allCards = [];

function getTeamName(id) {
  const t = allTeams.find(t => t.id === id);
  return t ? t.name : 'TBD';
}

function isKnockoutMatch(m) {
  const g =
    String(m?.group_name || '')
      .trim()
      .toLowerCase();

  return (
    g === 'quarter-finals' ||
    g === 'quarter-final' ||
    g === 'quarterfinals' ||
    g === 'quarterfinal' ||
    g === 'semi-finals' ||
    g === 'semi-final' ||
    g === 'semifinals' ||
    g === 'semifinal' ||
    g === 'final'
  );
}

function hasPenaltyData(m) {
  return !!(
    m.pens_on ||
    m.status === 'penalties' ||
    Number(m.pen_home) > 0 ||
    Number(m.pen_away) > 0
  );
}

async function loadAdminData() {
  const container =
    document.getElementById(
      'adminMatches'
    );

  if (!container) return;

  container.innerHTML =
    '<p class="text-slate-400 text-sm text-center py-8">Loading matches...</p>';

  if (
    !sb ||
    typeof sb.from !== 'function'
  ) {
    container.innerHTML =
      '<p class="text-red-400 text-sm text-center">' +
      'Supabase not ready. Please hard-refresh.' +
      '</p>';

    return;
  }

  try {
    const {
      data: teams,
      error: te
    } = await sb
      .from('teams')
      .select('*')
      .order('name');

    if (te) {
      throw te;
    }

    allTeams =
      teams || [];

    const homeSelect =
      document.getElementById(
        'newHome'
      );

    const awaySelect =
      document.getElementById(
        'newAway'
      );

    if (
      homeSelect &&
      awaySelect
    ) {
      const opts =
        allTeams
          .map(
            t =>
              `<option value="${t.id}">${t.name}</option>`
          )
          .join('');

      homeSelect.innerHTML =
        opts;

      awaySelect.innerHTML =
        opts;
    }

    const {
      data: matches,
      error
    } = await sb
      .from('matches')
      .select('*')
      .order(
        'kickoff_time',
        {
          ascending: true
        }
      );

    if (error) {
      throw error;
    }

    const {
      data: goals
    } = await sb
      .from('goals')
      .select('*');

    allGoals =
      goals || [];

    try {
      const {
        data: cards
      } = await sb
        .from('cards')
        .select('*');

      allCards =
        cards || [];
    } catch (e) {
      allCards = [];
    }

    if (
      !matches ||
      matches.length === 0
    ) {
      container.innerHTML =
        '<p class="text-slate-400 text-sm text-center py-6">' +
        'No matches yet.<br>Add one below.' +
        '</p>';

      return;
    }

    container.innerHTML =
      matches
        .map(
          m =>
            renderAdminCard(m)
        )
        .join('');

  } catch (err) {
    console.error(err);

    container.innerHTML =
      `<p class="text-red-400 text-sm text-center">Error: ${
        err.message || err
      }</p>`;
  }
}

window.loadAdminData =
  loadAdminData;

function renderAdminCard(m) {
  const home =
    getTeamName(
      m.home_team_id
    );

  const away =
    getTeamName(
      m.away_team_id
    );

  const hs =
    Number(m.home_score) || 0;

  const as =
    Number(m.away_score) || 0;

  const pensOn =
    !!m.pens_on ||
    m.status === 'penalties';

  const ph =
    Number(m.pen_home) || 0;

  const pa =
    Number(m.pen_away) || 0;

  const suddenDeath =
    !!m.pens_sudden;

  const knockout =
    isKnockoutMatch(m);

  const tied =
    hs === as;

  const statusMap = {
    not_started: [
      'UPCOMING',
      'bg-blue-600/30 text-blue-300'
    ],

    live: [
      'LIVE',
      'bg-red-600 text-white'
    ],

    half_time: [
      'HT',
      'bg-orange-500 text-white'
    ],

    extra_time: [
      'ET',
      'bg-purple-600 text-white'
    ],

    penalties: [
      'PENS',
      'bg-amber-500 text-slate-900'
    ],

    finished: [
      'FT',
      'bg-slate-600 text-slate-200'
    ],

    walkover: [
      'WO',
      'bg-slate-600 text-slate-200'
    ]
  };

  const st =
    statusMap[m.status] || [
      m.status || '?',
      'bg-slate-700 text-slate-300'
    ];

  const matchGoals =
    allGoals.filter(
      g =>
        g.match_id === m.id
    );

  const goalsList =
    matchGoals.length
      ? `<div class="mt-4 space-y-1">
          <p class="text-[11px] font-bold text-slate-500 uppercase">
            Goals
          </p>

          ${matchGoals
            .map(
              g => `
            <div class="flex justify-between items-center bg-slate-900/80 rounded-lg px-3 py-2 text-sm">

              <span>
                ${g.player_name}
                ${
                  g.minute
                    ? " " +
                      g.minute +
                      "'"
                    : ''
                }

                <span class="text-slate-500 text-xs">
                  (${getTeamName(
                    g.team_id
                  )})
                </span>
              </span>

              <button
                type="button"
                onclick="deleteGoal(
                  '${g.id}',
                  '${m.id}',
                  '${
                    g.team_id ===
                    m.home_team_id
                      ? 'home'
                      : 'away'
                  }'
                )"
                class="text-red-400 font-bold text-xs px-2">
                ✕
              </button>

            </div>`
            )
            .join('')}
        </div>`
      : '';

  const matchCards =
    allCards.filter(
      c =>
        c.match_id === m.id
    );

  const cardsList =
    matchCards.length
      ? `<div class="mt-3 space-y-1">

          <p class="text-[11px] font-bold text-slate-500 uppercase">
            Cards
          </p>

          ${matchCards
            .map(
              c => `
            <div class="flex justify-between items-center bg-slate-900/80 rounded-lg px-3 py-2 text-sm">

              <span>
                ${
                  c.card_type === 'red'
                    ? '🟥'
                    : '🟨'
                }

                ${c.player_name}

                ${
                  c.minute
                    ? " " +
                      c.minute +
                      "'"
                    : ''
                }
              </span>

              <button
                type="button"
                onclick="deleteCard('${c.id}')"
                class="text-red-400 font-bold text-xs px-2">
                ✕
              </button>

            </div>`
            )
            .join('')}

        </div>`
      : '';

  let pensUI = '';

  if (pensOn) {
    const suddenDeathReady =
      ph === 5 &&
      pa === 5 &&
      !m.pens_sudden;

    pensUI = `
      <div class="mt-4 p-4 rounded-2xl ${
        suddenDeath
          ? 'bg-red-500/15 border border-red-500/40'
          : 'bg-amber-500/10 border border-amber-500/30'
      }">

        <div class="text-center text-xs font-bold ${
          suddenDeath
            ? 'text-red-400'
            : 'text-amber-400'
        } mb-2">

          ${
            suddenDeath
              ? '⚡ SUDDEN DEATH'
              : 'PENALTIES'
          }

          · ${ph} – ${pa}

        </div>

        <div class="grid grid-cols-2 gap-3 mb-2">

          <div class="text-center">

            <p class="text-[11px] text-slate-400 mb-1 truncate">
              ${home}
            </p>

            <div class="flex items-center justify-center gap-2">

              <button
                type="button"
                onclick="changePen('${m.id}', 'home', -1)"
                class="w-11 h-11 rounded-xl bg-slate-700 text-xl font-bold">
                −
              </button>

              <span class="text-2xl font-extrabold w-8">
                ${ph}
              </span>

              <button
                type="button"
                onclick="changePen('${m.id}', 'home', 1)"
                class="w-11 h-11 rounded-xl bg-amber-500 text-slate-900 text-xl font-bold">
                +
              </button>

            </div>

          </div>

          <div class="text-center">

            <p class="text-[11px] text-slate-400 mb-1 truncate">
              ${away}
            </p>

            <div class="flex items-center justify-center gap-2">

              <button
                type="button"
                onclick="changePen('${m.id}', 'away', -1)"
                class="w-11 h-11 rounded-xl bg-slate-700 text-xl font-bold">
                −
              </button>

              <span class="text-2xl font-extrabold w-8">
                ${pa}
              </span>

              <button
                type="button"
                onclick="changePen('${m.id}', 'away', 1)"
                class="w-11 h-11 rounded-xl bg-amber-500 text-slate-900 text-xl font-bold">
                +
              </button>

            </div>

          </div>

        </div>

        ${
          !m.pens_sudden
            ? `<button
                type="button"
                onclick="enterSuddenDeath('${m.id}')"
                ${
                  suddenDeathReady
                    ? ''
                    : 'disabled'
                }
                class="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm mb-2 ${
                  suddenDeathReady
                    ? ''
                    : 'opacity-50 cursor-not-allowed'
                }">
                Enter sudden death
              </button>`
            : ''
        }

        <button
          type="button"
          onclick="clearPens('${m.id}')"
          class="w-full text-xs text-slate-500 underline">
          Clear pens
        </button>

      </div>`;
  }

  /*
   * State-specific controls.
   *
   * Upcoming:
   *   Start
   *
   * Live:
   *   Half-time
   *   Finish, or Extra Time for a tied knockout
   *
   * Half-time:
   *   Resume LIVE
   *
   * Extra Time:
   *   Finish if one side leads
   *   Penalties if still tied
   *
   * Penalties / Finished / Walkover:
   *   No normal match-status controls.
   */
  let statusControls =
    '';

  if (
    m.status ===
    'not_started'
  ) {
    statusControls = `
      <button
        type="button"
        onclick="updateStatus('${m.id}', 'live')"
        class="col-span-2 py-4 rounded-xl bg-red-600 text-white font-bold text-base">
        ▶ Start match
      </button>`;
  }

  else if (
    m.status ===
    'live'
  ) {
    statusControls = `
      <button
        type="button"
        onclick="updateStatus('${m.id}', 'half_time')"
        class="py-4 rounded-xl bg-orange-500 text-white font-bold text-sm">
        Half-time
      </button>

      ${
        knockout && tied
          ? `<button
              type="button"
              onclick="startExtraTime('${m.id}')"
              class="py-4 rounded-xl bg-purple-600 text-white font-bold text-sm">
              Extra time
            </button>`
          : `<button
              type="button"
              onclick="updateStatus('${m.id}', 'finished')"
              class="py-4 rounded-xl bg-green-600 text-white font-bold text-sm">
              Finish
            </button>`
      }
    `;
  }

  else if (
    m.status ===
    'half_time'
  ) {
    statusControls = `
      <button
        type="button"
        onclick="updateStatus('${m.id}', 'live')"
        class="col-span-2 py-4 rounded-xl bg-red-600 text-white font-bold text-base">
        ▶ Resume LIVE
      </button>`;
  }

  else if (
    m.status ===
    'extra_time'
  ) {
    statusControls =
      tied
        ? `
          <button
            type="button"
            onclick="startPens('${m.id}')"
            class="col-span-2 py-4 rounded-xl bg-amber-500 text-slate-900 font-bold text-sm">
            End extra time → Penalties
          </button>
        `
        : `
          <button
            type="button"
            onclick="updateStatus('${m.id}', 'finished')"
            class="col-span-2 py-4 rounded-xl bg-green-600 text-white font-bold text-sm">
            Finish after extra time
          </button>
        `;
  }

  return `
    <div class="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-4">

      <div class="flex items-center gap-2">

        <div class="flex-1 min-w-0 text-right">
          <p class="font-bold text-base truncate leading-tight">
            ${home}
          </p>
        </div>

        <div class="shrink-0 text-center px-2">

          <div class="text-3xl font-black tracking-tight">

            <span id="home-${m.id}">
              ${hs}
            </span>

            <span class="text-slate-500 mx-0.5">
              –
            </span>

            <span id="away-${m.id}">
              ${as}
            </span>

          </div>

        </div>

        <div class="flex-1 min-w-0">

          <p class="font-bold text-base truncate leading-tight">
            ${away}
          </p>
        </div>

        <span class="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${st[1]}">
          ${st[0]}
        </span>

      </div>

      ${
        m.group_name
          ? `<p class="text-center text-[11px] text-slate-500 -mt-2">
              ${m.group_name}
            </p>`
          : ''
      }

      ${
        m.status ===
        'extra_time'
          ? `<p class="text-center text-[11px] text-purple-400 font-bold -mt-2">
              EXTRA TIME
            </p>`
          : ''
      }

      ${
        m.status ===
        'penalties'
          ? `<p class="text-center text-[11px] text-amber-400 font-bold -mt-2">
              PENALTY SHOOTOUT
            </p>`
          : ''
      }

      <div class="grid grid-cols-2 gap-4">

        <div class="flex items-center justify-center gap-3">

          <button
            type="button"
            onclick="changeScoreOnly('${m.id}', 'home', -1)"
            class="w-14 h-14 rounded-2xl bg-slate-700 text-2xl font-bold active:scale-95">
            −
          </button>

          <span class="text-xs text-slate-400 font-semibold w-10 text-center">
            Home
          </span>

          <button
            type="button"
            onclick="openGoalDialog('${m.id}', 'home')"
            class="w-14 h-14 rounded-2xl bg-green-500 text-slate-900 text-2xl font-bold active:scale-95">
            +
          </button>

        </div>

        <div class="flex items-center justify-center gap-3">

          <button
            type="button"
            onclick="changeScoreOnly('${m.id}', 'away', -1)"
            class="w-14 h-14 rounded-2xl bg-slate-700 text-2xl font-bold active:scale-95">
            −
          </button>

          <span class="text-xs text-slate-400 font-semibold w-10 text-center">
            Away
          </span>

          <button
            type="button"
            onclick="openGoalDialog('${m.id}', 'away')"
            class="w-14 h-14 rounded-2xl bg-green-500 text-slate-900 text-2xl font-bold active:scale-95">
            +
          </button>

        </div>

      </div>

      <div class="grid grid-cols-3 gap-2">

        <button
          type="button"
          onclick="openCardDialog('${m.id}', 'yellow')"
          class="py-3.5 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 font-bold text-sm">
          🟨 Card
        </button>

        <button
          type="button"
          onclick="openCardDialog('${m.id}', 'red')"
          class="py-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 font-bold text-sm">
          🟥 Card
        </button>

        <button
          type="button"
          onclick="${
            pensOn
              ? 'void(0)'
              : m.status === 'extra_time' &&
                tied
                ? `startPens('${m.id}')`
                : 'void(0)'
          }"
          class="py-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-sm ${
            pensOn ||
            !(
              m.status ===
                'extra_time' &&
              tied
            )
              ? 'opacity-50'
              : ''
          }">
          Pens
        </button>

      </div>

      ${pensUI}

      ${
        statusControls
          ? `<div class="grid grid-cols-2 gap-2">
              ${statusControls}
            </div>`
          : ''
      }

      ${goalsList}
      ${cardsList}

      <div class="flex justify-between text-xs pt-1 border-t border-slate-700">

        <button
          type="button"
          onclick="resetScore('${m.id}')"
          class="text-slate-400 py-2 font-semibold">
          Reset → Upcoming
        </button>

        <button
          type="button"
          onclick="deleteMatch('${m.id}')"
          class="text-red-400/80 py-2">
          Delete match
        </button>

      </div>

    </div>`;
}

window.openGoalDialog =
  function(
    matchId,
    side
  ) {
    const player =
      prompt(
        'Player name who scored?'
      );

    if (
      !player ||
      !player.trim()
    ) {
      return;
    }

    const minuteStr =
      prompt(
        'Minute of the goal? (optional)',
        ''
      );

    const minute =
      minuteStr
        ? parseInt(
            minuteStr,
            10
          )
        : null;

    addGoalAndScore(
      matchId,
      side,
      player.trim(),
      minute
    );
  };

async function addGoalAndScore(
  matchId,
  side,
  playerName,
  minute
) {
  const {
    data: m,
    error: matchError
  } = await sb
    .from('matches')
    .select(
      'status, home_score, away_score, home_team_id, away_team_id'
    )
    .eq(
      'id',
      matchId
    )
    .single();

  if (
    matchError ||
    !m
  ) {
    alert(
      matchError
        ? matchError.message
        : 'Match not found.'
    );
    return;
  }

  if (
    m.status !== 'live' &&
    m.status !== 'extra_time'
  ) {
    alert(
      'Goals can only be added to a live or extra-time match.'
    );
    return;
  }

  const el =
    document.getElementById(
      `${side}-${matchId}`
    );

  let current =
    (
      parseInt(
        el &&
        el.textContent,
        10
      ) ||
      Number(
        side === 'home'
          ? m.home_score
          : m.away_score
      ) ||
      0
    ) + 1;

  if (el) {
    el.textContent =
      current;
  }

  const scoreUpdate =
    side === 'home'
      ? {
          home_score:
            current
        }
      : {
          away_score:
            current
        };

  scoreUpdate.status =
    m.status ===
      'extra_time'
      ? 'extra_time'
      : 'live';

  scoreUpdate.updated_at =
    new Date().toISOString();

  const {
    error: scoreError
  } = await sb
    .from('matches')
    .update(
      scoreUpdate
    )
    .eq(
      'id',
      matchId
    );

  if (scoreError) {
    alert(
      'Could not update score: ' +
      scoreError.message
    );

    loadAdminData();
    return;
  }

  const teamId =
    side === 'home'
      ? m.home_team_id
      : m.away_team_id;

  const {
    error: goalError
  } = await sb
    .from('goals')
    .insert({
      match_id:
        matchId,
      team_id:
        teamId,
      player_name:
        playerName,
      minute:
        minute
    });

  if (goalError) {
    alert(
      'Score updated but goal record failed: ' +
      goalError.message
    );
  }

  loadAdminData();
}

window.deleteGoal =
  async function(
    goalId,
    matchId,
    side
  ) {
    if (
      !confirm(
        'Remove this goal and reduce the score by 1?'
      )
    ) {
      return;
    }

    const {
      error: delError
    } = await sb
      .from('goals')
      .delete()
      .eq(
        'id',
        goalId
      );

    if (delError) {
      alert(
        delError.message
      );
      return;
    }

    const el =
      document.getElementById(
        `${side}-${matchId}`
      );

    let current =
      Math.max(
        0,
        (
          parseInt(
            el?.textContent,
            10
          ) || 0
        ) - 1
      );

    const scoreUpdate =
      side === 'home'
        ? {
            home_score:
              current
          }
        : {
            away_score:
              current
          };

    scoreUpdate.updated_at =
      new Date().toISOString();

    await sb
      .from('matches')
      .update(
        scoreUpdate
      )
      .eq(
        'id',
        matchId
      );

    loadAdminData();
  };

window.changeScoreOnly =
  async function(
    matchId,
    side,
    delta
  ) {
    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      alert(
        'Invalid side.'
      );
      return;
    }

    if (
      delta !== 1 &&
      delta !== -1
    ) {
      alert(
        'Invalid score change.'
      );
      return;
    }

    const {
      data: m,
      error: matchError
    } = await sb
      .from('matches')
      .select(
        'status, group_name, pens_on, home_score, away_score'
      )
      .eq(
        'id',
        matchId
      )
      .single();

    if (
      matchError ||
      !m
    ) {
      alert(
        matchError
          ? matchError.message
          : 'Match not found.'
      );
      return;
    }

    if (
      hasPenaltyData(m)
    ) {
      alert(
        'Match is in the penalty phase. Change penalty scores there.'
      );
      return;
    }

    if (
      m.status !== 'live' &&
      m.status !== 'extra_time'
    ) {
      alert(
        'Score can only be changed while the match is live or in extra time.'
      );
      return;
    }

    const el =
      document.getElementById(
        `${side}-${matchId}`
      );

    let current =
      Math.max(
        0,
        (
          parseInt(
            el &&
            el.textContent,
            10
          ) ||
          Number(
            side === 'home'
              ? m.home_score
              : m.away_score
          ) ||
          0
        ) + delta
      );

    if (el) {
      el.textContent =
        current;
    }

    const update =
      side === 'home'
        ? {
            home_score:
              current
          }
        : {
            away_score:
              current
          };

    /*
     * Preserve the current phase.
     */
    update.status =
      m.status;

    update.updated_at =
      new Date().toISOString();

    const {
      error
    } = await sb
      .from('matches')
      .update(update)
      .eq(
        'id',
        matchId
      );

    if (error) {
      alert(
        error.message
      );
    }

    loadAdminData();
  };

window.openCardDialog =
  async function(
    matchId,
    type
  ) {
    const player =
      prompt(
        `Player name for ${
          type === 'yellow'
            ? 'Yellow'
            : 'Red'
        } Card?`
      );

    if (
      !player ||
      !player.trim()
    ) {
      return;
    }

    const minuteStr =
      prompt(
        'Minute? (optional)',
        ''
      );

    const minute =
      minuteStr
        ? parseInt(
            minuteStr,
            10
          )
        : null;

    const {
      error
    } = await sb
      .from('cards')
      .insert({
        match_id:
          matchId,
        player_name:
          player.trim(),
        card_type:
          type,
        minute:
          minute
      });

    if (error) {
      alert(
        error.message
      );
    } else {
      loadAdminData();
    }
  };

window.deleteCard =
  async function(
    cardId
  ) {
    if (
      !confirm(
        'Remove this card?'
      )
    ) {
      return;
    }

    const {
      error
    } = await sb
      .from('cards')
      .delete()
      .eq(
        'id',
        cardId
      );

    if (error) {
      alert(
        error.message
      );
    } else {
      loadAdminData();
    }
  };

window.startExtraTime =
  async function(
    matchId
  ) {
    const {
      data: m,
      error: loadError
    } = await sb
      .from('matches')
      .select('*')
      .eq(
        'id',
        matchId
      )
      .single();

    if (
      loadError ||
      !m
    ) {
      alert(
        loadError
          ? loadError.message
          : 'Match not found.'
      );
      return;
    }

    const hs =
      Number(m.home_score) || 0;

    const as =
      Number(m.away_score) || 0;

    if (
      !isKnockoutMatch(m)
    ) {
      alert(
        'Extra time is only available for knockout matches.'
      );
      return;
    }

    if (
      hs !== as
    ) {
      alert(
        'Extra time can only start when the match is level after normal time.'
      );
      return;
    }

    if (
      m.status !== 'live'
    ) {
      alert(
        'Extra time can only be started from LIVE after normal time.'
      );
      return;
    }

    if (
      hasPenaltyData(m)
    ) {
      alert(
        'Penalty data already exists. Clear penalties first.'
      );
      return;
    }

    const {
      error
    } = await sb
      .from('matches')
      .update({
        status:
          'extra_time',
        updated_at:
          new Date().toISOString()
      })
      .eq(
        'id',
        matchId
      );

    if (error) {
      alert(
        'Could not start extra time: ' +
        error.message
      );
      return;
    }

    loadAdminData();
  };

window.startPens =
  async function(
    matchId
  ) {
    const {
      data: m,
      error: loadError
    } = await sb
      .from('matches')
      .select('*')
      .eq(
        'id',
        matchId
      )
      .single();

    if (
      loadError ||
      !m
    ) {
      alert(
        loadError
          ? loadError.message
          : 'Match not found.'
      );
      return;
    }

    const hs =
      Number(m.home_score) || 0;

    const as =
      Number(m.away_score) || 0;

    if (
      !isKnockoutMatch(m)
    ) {
      alert(
        'Penalties are only available for knockout matches.'
      );
      return;
    }

    if (
      hs !== as
    ) {
      alert(
        'Penalties can only start when the match is level.'
      );
      return;
    }

    if (
      m.status !==
      'extra_time'
    ) {
      alert(
        'Complete extra time before starting penalties.'
      );
      return;
    }

    const {
      error
    } = await sb
      .from('matches')
      .update({
        pens_on:
          true,
        pen_home:
          0,
        pen_away:
          0,
        pens_sudden:
          false,
        status:
          'penalties',
        updated_at:
          new Date().toISOString()
      })
      .eq(
        'id',
        matchId
      );

    if (error) {
      alert(
        error.message
      );
    } else {
      loadAdminData();
    }
  };

window.enterSuddenDeath =
  async function(
    matchId
  ) {
    const {
      data: m,
      error: loadError
    } = await sb
      .from('matches')
      .select(
        'status, pen_home, pen_away, pens_sudden, pens_on'
      )
      .eq(
        'id',
        matchId
      )
      .single();

    if (
      loadError ||
      !m
    ) {
      alert(
        loadError
          ? loadError.message
          : 'Match not found'
      );
      return;
    }

    const ph =
      Number(m.pen_home) || 0;

    const pa =
      Number(m.pen_away) || 0;

    if (
      m.status !==
        'penalties' ||
      !m.pens_on ||
      m.pens_sudden ||
      ph !== 5 ||
      pa !== 5
    ) {
      alert(
        'Sudden death can only begin after five penalties each and a 5–5 score.'
      );
      return;
    }

    const {
      error
    } = await sb
      .from('matches')
      .update({
        pens_on:
          true,
        pens_sudden:
          true,
        status:
          'penalties',
        updated_at:
          new Date().toISOString()
      })
      .eq(
        'id',
        matchId
      );

    if (error) {
      alert(
        'Could not enter sudden death: ' +
        error.message
      );
      return;
    }

    loadAdminData();
  };

window.changePen =
  async function(
    matchId,
    side,
    delta
  ) {
    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      alert(
        'Invalid penalty side.'
      );
      return;
    }

    if (
      delta !== 1 &&
      delta !== -1
    ) {
      alert(
        'Invalid penalty change.'
      );
      return;
    }

    const {
      data: m,
      error
    } = await sb
      .from('matches')
      .select('*')
      .eq(
        'id',
        matchId
      )
      .single();

    if (
      error ||
      !m
    ) {
      alert(
        error
          ? error.message
          : 'Not found'
      );
      return;
    }

    if (
      m.status !==
        'penalties' ||
      !m.pens_on
    ) {
      alert(
        'This match is not in the penalty phase.'
      );
      return;
    }

    let ph =
      Number(m.pen_home) || 0;

    let pa =
      Number(m.pen_away) || 0;

    const current =
      side === 'home'
        ? ph
        : pa;

    if (
      delta > 0 &&
      !m.pens_sudden &&
      current >= 5
    ) {
      alert(
        'Maximum 5 penalties in the normal penalty phase.\n\n' +
        'At 5–5, enter sudden death before continuing.'
      );
      return;
    }

    if (
      m.pens_sudden &&
      delta > 0 &&
      ph !== pa
    ) {
      alert(
        'Sudden death is already decided. Use Reset or Clear pens to correct the result.'
      );
      return;
    }

    if (side === 'home') {
      ph =
        Math.max(
          0,
          ph + delta
        );
    } else {
      pa =
        Math.max(
          0,
          pa + delta
        );
    }

    let nextStatus =
      m.status;

    if (
      m.pens_sudden
    ) {
      nextStatus =
        ph !== pa
          ? 'finished'
          : 'penalties';
    } else {
      nextStatus =
        'penalties';
    }

    const up =
      await sb
        .from('matches')
        .update({
          pens_on:
            true,
          pen_home:
            ph,
          pen_away:
            pa,
          pens_sudden:
            !!m.pens_sudden,
          status:
            nextStatus,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          'id',
          matchId
        );

    if (up.error) {
      alert(
        up.error.message
      );
      return;
    }

    loadAdminData();
  };

window.clearPens =
  async function(
    matchId
  ) {
    if (
      !confirm(
        'Clear penalty scores and return this match to the end of extra time?'
      )
    ) {
      return;
    }

    const {
      data: m,
      error: loadError
    } = await sb
      .from('matches')
      .select(
        'status, group_name, home_score, away_score, pens_on'
      )
      .eq(
        'id',
        matchId
      )
      .single();

    if (
      loadError ||
      !m
    ) {
      alert(
        loadError
          ? loadError.message
          : 'Match not found.'
      );
      return;
    }

    if (
      !m.pens_on &&
      m.status !==
        'penalties'
    ) {
      alert(
        'No penalty phase is active.'
      );
      return;
    }

    const {
      error
    } = await sb
      .from('matches')
      .update({
        pens_on:
          false,
        pen_home:
          0,
        pen_away:
          0,
        pens_sudden:
          false,
        status:
          isKnockoutMatch(m)
            ? 'extra_time'
            : 'finished',
        updated_at:
          new Date().toISOString()
      })
      .eq(
        'id',
        matchId
      );

    if (error) {
      alert(
        error.message
      );
    } else {
      loadAdminData();
    }
  };

window.updateStatus =
  async function(
    matchId,
    status
  ) {
    const {
      data: m,
      error: loadError
    } = await sb
      .from('matches')
      .select('*')
      .eq(
        'id',
        matchId
      )
      .single();

    if (
      loadError ||
      !m
    ) {
      alert(
        loadError
          ? loadError.message
          : 'Match not found.'
      );
      return;
    }

    const hs =
      Number(m.home_score) || 0;

    const as =
      Number(m.away_score) || 0;

    const tied =
      hs === as;

    const knockout =
      isKnockoutMatch(m);

    /*
     * Explicitly enforce the state machine.
     */

    if (
      status === 'live'
    ) {
      if (
        m.status !==
          'not_started' &&
        m.status !==
          'half_time'
      ) {
        alert(
          'A match can return to LIVE only from Upcoming or Half-time.'
        );
        return;
      }
    }

    if (
      status ===
      'half_time'
    ) {
      if (
        m.status !==
        'live'
      ) {
        alert(
          'Half-time can only be set from LIVE.'
        );
        return;
      }
    }

    if (
      status ===
        'finished'
    ) {
      if (
        m.status ===
        'penalties'
      ) {
        alert(
          'Complete the penalty shootout first.'
        );
        return;
      }

      if (
        m.status !==
          'live' &&
        m.status !==
          'extra_time'
      ) {
        alert(
          'A match can only be finished from LIVE or EXTRA TIME.'
        );
        return;
      }

      if (
        knockout &&
        tied &&
        m.status !==
          'extra_time'
      ) {
        alert(
          'This knockout match is tied. Start extra time before finishing the match.'
        );
        return;
      }

      if (
        knockout &&
        tied &&
        m.status ===
          'extra_time'
      ) {
        alert(
          'The match is still tied after extra time. Start penalties.'
        );
        return;
      }
    }

    /*
     * Extra Time must use startExtraTime().
     * Penalties must use startPens().
     * This prevents arbitrary status injection from
     * the normal status control.
     */
    if (
      status ===
        'extra_time' ||
      status ===
        'penalties'
    ) {
      alert(
        'Use the dedicated Extra Time or Penalties control.'
      );
      return;
    }

    const {
      error
    } = await sb
      .from('matches')
      .update({
        status,
        updated_at:
          new Date().toISOString()
      })
      .eq(
        'id',
        matchId
      );

    if (error) {
      alert(
        error.message
      );
    } else {
      loadAdminData();
    }
  };

window.resetScore =
  async function(
    matchId
  ) {
    if (
      !confirm(
        'Reset this match?\n\n' +
        '• Score → 0-0\n' +
        '• Clear goals, cards & pens\n' +
        '• Status → Upcoming'
      )
    ) {
      return;
    }

    await sb
      .from('matches')
      .update({
        home_score:
          0,
        away_score:
          0,

        pens_on:
          false,
        pen_home:
          0,
        pen_away:
          0,
        pens_sudden:
          false,

        status:
          'not_started',

        updated_at:
          new Date().toISOString()
      })
      .eq(
        'id',
        matchId
      );

    await sb
      .from('goals')
      .delete()
      .eq(
        'match_id',
        matchId
      );

    try {
      await sb
        .from('cards')
        .delete()
        .eq(
          'match_id',
          matchId
        );
    } catch (e) {}

    loadAdminData();
  };

window.deleteMatch =
  async function(
    matchId
  ) {
    if (
      !confirm(
        'Delete this match and all its goals/cards?'
      )
    ) {
      return;
    }

    await sb
      .from('goals')
      .delete()
      .eq(
        'match_id',
        matchId
      );

    try {
      await sb
        .from('cards')
        .delete()
        .eq(
          'match_id',
          matchId
        );
    } catch (e) {}

    const {
      error
    } = await sb
      .from('matches')
      .delete()
      .eq(
        'id',
        matchId
      );

    if (error) {
      alert(
        error.message
      );
    } else {
      loadAdminData();
    }
  };

document
  .getElementById(
    'addMatchBtn'
  )
  ?.addEventListener(
    'click',
    async () => {
      const home =
        document.getElementById(
          'newHome'
        ).value;

      const away =
        document.getElementById(
          'newAway'
        ).value;

      const group =
        document.getElementById(
          'newGroup'
        ).value.trim();

      if (
        home === away
      ) {
        alert(
          'Please choose two different teams'
        );
        return;
      }

      const {
        error
      } = await sb
        .from('matches')
        .insert({
          home_team_id:
            home,

          away_team_id:
            away,

          group_name:
            group || null,

          status:
            'not_started',

          home_score:
            0,

          away_score:
            0,

          kickoff_time:
            new Date().toISOString()
        });

      if (error) {
        alert(
          error.message
        );
      } else {
        var g =
          document.getElementById(
            'newGroup'
          );

        if (g) {
          if (
            g.tagName ===
            'SELECT'
          ) {
            g.selectedIndex =
              0;
          } else {
            g.value =
              '';
          }
        }

        alert(
          'Match added!'
        );

        loadAdminData();
      }
    }
  );
