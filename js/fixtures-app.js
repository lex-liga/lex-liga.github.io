// Fixtures page – list all futsal + badminton matches
(function () {
  'use strict';

  var sb =
    window.supabaseClient ||
    window.supabase ||
    (typeof supabase !== 'undefined'
      ? supabase
      : null);

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusCls(s) {
    if (
      s === 'live' ||
      s === 'half_time' ||
      s === 'extra_time' ||
      s === 'penalties'
    ) {
      return 'live';
    }

    if (
      s === 'finished' ||
      s === 'walkover'
    ) {
      return 'done';
    }

    return 'up';
  }

  function statusLabel(s) {
    if (s === 'live') {
      return 'LIVE';
    }

    if (s === 'half_time') {
      return 'HT';
    }

    if (s === 'extra_time') {
      return 'ET';
    }

    if (s === 'penalties') {
      return 'PENS';
    }

    if (
      s === 'finished' ||
      s === 'walkover'
    ) {
      return s === 'walkover'
        ? 'W/O'
        : 'FT';
    }

    return 'UP';
  }

  function statusStyle(status) {
    var cls =
      statusCls(status);

    if (cls === 'live') {
      return 'background:#dc2626;color:#fff';
    }

    if (cls === 'done') {
      return 'background:rgba(100,116,139,0.4);color:#cbd5e1';
    }

    return 'background:rgba(37,99,235,0.25);color:#93c5fd';
  }

  function rowHtml(
    num,
    left,
    right,
    scoreHtml,
    status,
    meta
  ) {
    return (
      '<div class="fx-row" ' +
        'style="display:flex;align-items:center;gap:0.75rem;' +
        'background:rgba(15,23,42,0.9);' +
        'border:1px solid rgba(148,163,184,0.15);' +
        'border-radius:0.85rem;padding:0.85rem 1rem;margin-bottom:0.55rem">' +

        '<span style="flex-shrink:0;width:1.75rem;height:1.75rem;' +
          'border-radius:999px;display:flex;align-items:center;' +
          'justify-content:center;font-size:0.75rem;font-weight:800;' +
          'background:rgba(34,197,94,0.15);color:#4ade80">' +
          num +
        '</span>' +

        '<div style="flex:1;min-width:0">' +

          '<div>' +

            '<strong style="font-size:0.9rem;color:#f1f5f9">' +
              escapeHtml(left) +
            '</strong>' +

            '<span style="color:#64748b;font-size:0.7rem;font-weight:700;margin:0 0.35rem">' +
              'VS' +
            '</span>' +

            '<strong style="font-size:0.9rem;color:#f1f5f9">' +
              escapeHtml(right) +
            '</strong>' +

          '</div>' +

          (
            meta
              ? '<div style="font-size:11px;color:#64748b;margin-top:2px">' +
                  escapeHtml(meta) +
                '</div>'
              : ''
          ) +

        '</div>' +

        (scoreHtml || '') +

        '<span style="font-size:0.65rem;font-weight:800;' +
          'text-transform:uppercase;padding:0.2rem 0.5rem;' +
          'border-radius:999px;' +
          statusStyle(status) +
        '">' +

          statusLabel(status) +

        '</span>' +

      '</div>'
    );
  }

  function loadBadmintonRules() {
    if (window.BadmintonRules) {
      return Promise.resolve(
        window.BadmintonRules
      );
    }

    return new Promise(function (
      resolve,
      reject
    ) {
      var existing =
        document.querySelector(
          'script[src*="badminton-rules.js"]'
        );

      if (existing) {
        var tries = 0;

        var timer =
          setInterval(
            function () {
              tries++;

              if (
                window.BadmintonRules
              ) {
                clearInterval(timer);

                resolve(
                  window.BadmintonRules
                );

                return;
              }

              if (tries >= 50) {
                clearInterval(timer);

                reject(
                  new Error(
                    'Badminton scoring rules could not be loaded.'
                  )
                );
              }
            },
            100
          );

        return;
      }

      var script =
        document.createElement(
          'script'
        );

      script.src =
        'js/badminton-rules.js?v=20260919-1';

      script.async = false;

      script.onload =
        function () {
          if (
            window.BadmintonRules
          ) {
            resolve(
              window.BadmintonRules
            );
          } else {
            reject(
              new Error(
                'Badminton scoring rules loaded without an API.'
              )
            );
          }
        };

      script.onerror =
        function () {
          reject(
            new Error(
              'Could not load badminton-rules.js.'
            )
          );
        };

      document.head.appendChild(
        script
      );
    });
  }

  function renderBadmintonFixture(
    m,
    num,
    rules
  ) {
    var d =
      rules.getDisplay(m);

    var scoreHtml = '';

    if (
      m.status !== 'not_started'
    ) {
      if (d.bestOfThree) {
        scoreHtml =
          '<div style="text-align:right;white-space:nowrap">' +

            '<div style="font-weight:800;font-size:1rem;color:#e2e8f0">' +
              d.currentScoreP1 +
              '–' +
              d.currentScoreP2 +
            '</div>' +

            '<div style="font-size:10px;color:#64748b;margin-top:2px">' +
              'G' +
              d.currentGame +
              ' · ' +
              d.gamesP1 +
              '–' +
              d.gamesP2 +
            '</div>' +

          '</div>';
      } else {
        scoreHtml =
          '<span style="font-weight:800;font-size:1rem;' +
            'color:#e2e8f0;white-space:nowrap">' +
            d.currentScoreP1 +
            '–' +
            d.currentScoreP2 +
          '</span>';
      }
    }

    var meta = [
      m.category || 'Badminton',
      d.stageLabel,
      d.format
    ].join(' · ');

    if (
      (
        m.status === 'finished' ||
        m.status === 'walkover'
      ) &&
      d.winnerName
    ) {
      meta +=
        ' · Winner: ' +
        d.winnerName;
    }

    if (
      m.status === 'live' &&
      !d.bestOfThree &&
      d.currentScoreP1 === 14 &&
      d.currentScoreP2 === 14
    ) {
      meta +=
        ' · Golden Point';
    }

    return rowHtml(
      num,
      m.player1 || 'TBD',
      m.player2 || 'TBD',
      scoreHtml,
      m.status,
      meta
    );
  }

  function renderFutsalFixture(
    m,
    num,
    teams
  ) {
    var h =
      teams[m.home_team_id] ||
      'TBD';

    var a =
      teams[m.away_team_id] ||
      'TBD';

    var show =
      m.status !== 'not_started';

    var score =
      show
        ? '<span style="font-weight:800;font-size:1rem;color:#e2e8f0;white-space:nowrap">' +
          (m.home_score || 0) +
          '–' +
          (m.away_score || 0) +
          '</span>'
        : '';

    var meta =
      m.group_name || '';

    var ph =
      Number(m.pen_home) || 0;

    var pa =
      Number(m.pen_away) || 0;

    var pensOn =
      !!m.pens_on ||
      m.status === 'penalties';

    if (pensOn) {
      meta +=
        (meta ? ' · ' : '') +
        'Pens ' +
        ph +
        '–' +
        pa +
        (
          m.pens_sudden
            ? ' · SD'
            : ''
        );
    }

    return rowHtml(
      num,
      h,
      a,
      score,
      m.status,
      meta
    );
  }

  async function loadFixtures() {
    var el =
      document.getElementById(
        'allFixtures'
      );

    if (!el) {
      return;
    }

    if (
      !sb ||
      typeof sb.from !== 'function'
    ) {
      el.innerHTML =
        '<p class="empty-state" style="color:#f87171">' +
        'Supabase not ready. Hard-refresh the page.' +
        '</p>';

      return;
    }

    try {
      var rules =
        window.BadmintonRules;

      if (!rules) {
        rules =
          await loadBadmintonRules();
      }

      var teamsRes =
        await sb
          .from('teams')
          .select('*');

      var teams = {};

      (
        teamsRes.data || []
      ).forEach(
        function (t) {
          teams[t.id] =
            t.name;
        }
      );

      var fr =
        await sb
          .from('matches')
          .select('*')
          .order(
            'kickoff_time',
            {
              ascending: true
            }
          );

      if (fr.error) {
        throw fr.error;
      }

      var futsal =
        fr.data || [];

      var br =
        await sb
          .from('badminton_matches')
          .select('*')
          .order(
            'created_at',
            {
              ascending: true
            }
          );

      if (br.error) {
        throw br.error;
      }

      var bm =
        br.data || [];

      if (
        !futsal.length &&
        !bm.length
      ) {
        el.innerHTML =
          '<p class="empty-state">No fixtures yet.</p>';

        return;
      }

      var html = '';
      var n = 0;

      /*
       * FUTSAL
       */
      if (futsal.length) {
        html +=
          '<p class="text-xs font-bold text-green-400 uppercase mb-2 mt-1">' +
          '⚽ Futsal' +
          '</p>';

        var byG = {};

        futsal.forEach(
          function (m) {
            var g =
              m.group_name ||
              'Fixtures';

            if (!byG[g]) {
              byG[g] = [];
            }

            byG[g].push(m);
          }
        );

        var order = [
          'Group A',
          'Group B',
          'Group C',
          'Group D',
          'Group E',
          'Quarter-finals',
          'Semi-finals',
          'Final'
        ];

        Object.keys(byG)
          .filter(
            function (g) {
              return (
                order.indexOf(g) <
                0
              );
            }
          )
          .sort()
          .forEach(
            function (g) {
              order.push(g);
            }
          );

        order.forEach(
          function (g) {
            if (
              !byG[g] ||
              !byG[g].length
            ) {
              return;
            }

            html +=
              '<p class="text-[11px] font-semibold text-slate-500 mb-1.5 mt-3">' +
              escapeHtml(g) +
              '</p>';

            byG[g].forEach(
              function (m) {
                n++;

                html +=
                  renderFutsalFixture(
                    m,
                    n,
                    teams
                  );
              }
            );
          }
        );
      }

      /*
       * BADMINTON
       */
      if (bm.length) {
        html +=
          '<p class="text-xs font-bold text-sky-400 uppercase mb-2 mt-6">' +
          '🏸 Badminton' +
          '</p>';

        bm.forEach(
          function (m) {
            n++;

            html +=
              renderBadmintonFixture(
                m,
                n,
                rules
              );
          }
        );
      }

      el.innerHTML =
        html;

    } catch (err) {
      console.error(err);

      el.innerHTML =
        '<p class="empty-state" style="color:#f87171">' +
        escapeHtml(
          err.message ||
          'Error loading fixtures'
        ) +
        '</p>';
    }
  }

  loadBadmintonRules()
    .then(
      function () {
        loadFixtures();
      }
    )
    .catch(
      function (err) {
        console.error(err);
        loadFixtures();
      }
    );

  setInterval(
    loadFixtures,
    20000
  );
})();
