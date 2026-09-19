// Lex Liga Badminton — public live scores / results / sharing
// Uses the official tournament scoring engine from badminton-rules.js.

(function () {
  'use strict';

  var sb =
    window.supabaseClient ||
    window.supabase ||
    (typeof supabase !== 'undefined' ? supabase : null);

  var RULES_VERSION = '20260919-1';

  function forceDark() {
    document.documentElement.classList.add('dark');
    document.body.classList.remove('light');
    localStorage.setItem('theme', 'dark');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusBadge(status) {
    var map = {
      live: {
        label: 'LIVE',
        cls: 'status-live'
      },

      finished: {
        label: 'FT',
        cls: 'status-finished'
      },

      not_started: {
        label: 'Upcoming',
        cls: 'status-not-started'
      },

      walkover: {
        label: 'W/O',
        cls: 'status-walkover'
      }
    };

    var item = map[status] || {
      label: status || 'Upcoming',
      cls: 'status-not_started'
    };

    return (
      '<span class="' +
      item.cls +
      ' text-xs font-bold px-2 py-0.5 rounded text-white">' +
      escapeHtml(item.label) +
      '</span>'
    );
  }

  function loadRules() {
    if (window.BadmintonRules) {
      return Promise.resolve(window.BadmintonRules);
    }

    return new Promise(function (resolve, reject) {
      var existing = document.querySelector(
        'script[src*="badminton-rules.js"]'
      );

      if (existing) {
        var tries = 0;

        var timer = setInterval(function () {
          tries++;

          if (window.BadmintonRules) {
            clearInterval(timer);
            resolve(window.BadmintonRules);
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
        }, 100);

        return;
      }

      var script = document.createElement('script');

      script.src =
        'js/badminton-rules.js?v=' +
        RULES_VERSION;

      script.async = false;

      script.onload = function () {
        if (window.BadmintonRules) {
          resolve(window.BadmintonRules);
        } else {
          reject(
            new Error(
              'Badminton scoring rules loaded without an API.'
            )
          );
        }
      };

      script.onerror = function () {
        reject(
          new Error(
            'Could not load badminton-rules.js.'
          )
        );
      };

      document.head.appendChild(script);
    });
  }

  function getRules() {
    return window.BadmintonRules || null;
  }

  function getDisplay(match) {
    var r = getRules();

    if (!r) return null;

    return r.getDisplay(match);
  }

  function gameScoreText(p1, p2) {
    return (
      String(Number(p1) || 0) +
      ' – ' +
      String(Number(p2) || 0)
    );
  }

  function buildGamesSummary(m, d) {
    if (!d.bestOfThree) {
      return '';
    }

    var parts = [];

    parts.push(
      'Games: ' +
      d.gamesP1 +
      ' – ' +
      d.gamesP2
    );

    parts.push(
      'G1: ' +
      gameScoreText(d.g1P1, d.g1P2)
    );

    if (
      Number(d.g2P1) > 0 ||
      Number(d.g2P2) > 0
    ) {
      parts.push(
        'G2: ' +
        gameScoreText(d.g2P1, d.g2P2)
      );
    }

    if (
      Number(d.g3P1) > 0 ||
      Number(d.g3P2) > 0
    ) {
      parts.push(
        'G3: ' +
        gameScoreText(d.g3P1, d.g3P2)
      );
    }

    return parts.join(' · ');
  }

  function buildBmShareText(m) {
    var r = getRules();

    if (!r) {
      return (
        '🏸 Lex Liga Badminton\n\n' +
        (m.player1 || 'Player 1') +
        ' vs ' +
        (m.player2 || 'Player 2')
      );
    }

    var d = r.getDisplay(m);
    var lines = [];

    lines.push('🏸 Lex Liga Badminton');

    lines.push(
      (m.category || 'Badminton') +
      ' · ' +
      d.stageLabel
    );

    lines.push(d.format);

    if (m.status === 'live') {
      lines.push('🔴 LIVE');
    } else if (m.status === 'finished') {
      lines.push('✅ FULL TIME');
    } else if (m.status === 'walkover') {
      lines.push('⚠️ WALKOVER');
    } else {
      lines.push('Upcoming');
    }

    lines.push('');

    lines.push(
      (m.player1 || 'Player 1') +
      '  ' +
      d.currentScoreP1 +
      ' – ' +
      d.currentScoreP2 +
      '  ' +
      (m.player2 || 'Player 2')
    );

    if (d.bestOfThree) {
      lines.push(
        'Current: Game ' +
        d.currentGame
      );

      lines.push(
        'Games: ' +
        d.gamesP1 +
        ' – ' +
        d.gamesP2
      );

      lines.push(
        'Game 1: ' +
        d.g1P1 +
        ' – ' +
        d.g1P2
      );

      lines.push(
        'Game 2: ' +
        d.g2P1 +
        ' – ' +
        d.g2P2
      );

      lines.push(
        'Game 3: ' +
        d.g3P1 +
        ' – ' +
        d.g3P2
      );
    } else {
      lines.push(
        'Single set score: ' +
        d.currentScoreP1 +
        ' – ' +
        d.currentScoreP2
      );

      if (
        d.currentScoreP1 === 14 &&
        d.currentScoreP2 === 14
      ) {
        lines.push(
          'Golden Point: next rally wins'
        );
      }
    }

    if (
      (m.status === 'finished' ||
        m.status === 'walkover') &&
      d.winnerName
    ) {
      lines.push('');
      lines.push(
        m.status === 'walkover'
          ? 'Winner (W/O): ' + d.winnerName
          : 'Winner: ' + d.winnerName
      );
    }

    lines.push('');
    lines.push(
      'Follow live: https://lex-liga.github.io/badminton.html'
    );

    return lines.join('\n');
  }

  window.shareBmMatch = async function (id) {
    var matches = window.__bmMatches || [];

    var m = matches.find(function (x) {
      return String(x.id) === String(id);
    });

    if (!m) return;

    var text = buildBmShareText(m);

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Lex Liga Badminton',
          text: text
        });

        return;
      }

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(text);

        alert(
          'Detailed score copied — paste anywhere to share.'
        );

        return;
      }

      window.prompt(
        'Copy this score:',
        text
      );
    } catch (e) {
      /*
       * Closing the native share sheet throws in some browsers.
       * That should not be treated as an application error.
       */
    }
  };

  function renderGameBreakdown(d) {
    if (!d.bestOfThree) {
      return '';
    }

    var rows = [];

    rows.push(
      '<div class="grid grid-cols-3 gap-2 mt-3">'
    );

    rows.push(
      '<div class="bg-slate-900/70 rounded-lg p-2 text-center border border-slate-700">' +
        '<div class="text-[10px] text-slate-500 font-bold">G1</div>' +
        '<div class="text-sm font-extrabold tabular-nums mt-1">' +
          d.g1P1 +
          ' – ' +
          d.g1P2 +
        '</div>' +
      '</div>'
    );

    rows.push(
      '<div class="bg-slate-900/70 rounded-lg p-2 text-center border border-slate-700">' +
        '<div class="text-[10px] text-slate-500 font-bold">G2</div>' +
        '<div class="text-sm font-extrabold tabular-nums mt-1">' +
          d.g2P1 +
          ' – ' +
          d.g2P2 +
        '</div>' +
      '</div>'
    );

    rows.push(
      '<div class="bg-slate-900/70 rounded-lg p-2 text-center border border-slate-700">' +
        '<div class="text-[10px] text-slate-500 font-bold">G3</div>' +
        '<div class="text-sm font-extrabold tabular-nums mt-1">' +
          d.g3P1 +
          ' – ' +
          d.g3P2 +
        '</div>' +
      '</div>'
    );

    rows.push('</div>');

    return rows.join('');
  }

  function renderGoldenPointNotice(d) {
    if (
      d.bestOfThree ||
      d.status === 'finished' ||
      d.status === 'walkover'
    ) {
      return '';
    }

    if (
      d.currentScoreP1 === 14 &&
      d.currentScoreP2 === 14
    ) {
      return (
        '<div class="text-center text-amber-400 text-xs font-bold mt-3">' +
        'GOLDEN POINT · NEXT RALLY WINS' +
        '</div>'
      );
    }

    return '';
  }

  function renderBmCard(m) {
    var r = getRules();

    if (!r) {
      return (
        '<div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700">' +
        '<p class="text-slate-400 text-sm">Loading match…</p>' +
        '</div>'
      );
    }

    var d = r.getDisplay(m);

    var status = m.status || 'not_started';

    var winnerHtml = '';

    if (
      (status === 'finished' ||
        status === 'walkover') &&
      d.winnerName
    ) {
      winnerHtml =
        '<div class="' +
        (
          status === 'walkover'
            ? 'text-amber-400'
            : 'text-green-400'
        ) +
        ' text-xs font-bold text-center mt-3">' +

        escapeHtml(
          status === 'walkover'
            ? 'Winner (W/O): '
            : 'Winner: '
        ) +

        escapeHtml(d.winnerName) +

        '</div>';
    }

    var currentLabel = '';

    if (d.bestOfThree) {
      currentLabel =
        '<div class="text-[11px] text-slate-400 text-center mt-2">' +
        'Game ' +
        d.currentGame +
        ' · Games won ' +
        d.gamesP1 +
        ' – ' +
        d.gamesP2 +
        '</div>';
    }

    var formatBadge =
      '<span class="text-[10px] font-semibold text-slate-400">' +
      escapeHtml(d.stageShortLabel) +
      ' · ' +
      escapeHtml(d.format) +
      '</span>';

    var scoreMain =
      '<div class="flex items-center gap-2">' +

      '<div class="flex-1 text-right font-semibold text-sm">' +
        escapeHtml(m.player1 || 'Player 1') +
      '</div>' +

      '<div class="text-2xl font-extrabold tabular-nums px-3 min-w-[80px] text-center">' +
        d.currentScoreP1 +
        ' – ' +
        d.currentScoreP2 +
      '</div>' +

      '<div class="flex-1 text-left font-semibold text-sm">' +
        escapeHtml(m.player2 || 'Player 2') +
      '</div>' +

      '</div>';

    return (
      '<div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700 ' +
      (status === 'live' ? 'match-live' : '') +
      '">' +

        '<div class="flex items-center justify-between gap-3 mb-3">' +

          statusBadge(status) +

          '<div class="text-right">' +
            '<div class="text-xs text-slate-400">' +
              escapeHtml(m.category || 'Badminton') +
            '</div>' +

            '<div class="mt-0.5">' +
              formatBadge +
            '</div>' +
          '</div>' +

        '</div>' +

        scoreMain +

        currentLabel +

        renderGoldenPointNotice(d) +

        renderGameBreakdown(d) +

        winnerHtml +

        '<div class="text-[10px] text-slate-500 text-center mt-3">' +
          escapeHtml(d.formatDescription) +
        '</div>' +

        '<button ' +
          'type="button" ' +
          'class="share-button mt-3" ' +
          'onclick="shareBmMatch(\'' +
            escapeHtml(String(m.id)) +
          '\')">' +
          '↗ Share detailed score' +
        '</button>' +

      '</div>'
    );
  }

  function renderError(id, message) {
    var el = document.getElementById(id);

    if (!el) return;

    el.innerHTML =
      '<p class="text-red-400 text-sm">' +
      escapeHtml(message) +
      '</p>';
  }

  async function loadBadminton() {
    if (!sb || typeof sb.from !== 'function') {
      renderError(
        'bmLive',
        'Supabase not ready'
      );

      return;
    }

    var r = getRules();

    if (!r) {
      renderError(
        'bmLive',
        'Badminton scoring rules are still loading.'
      );

      return;
    }

    try {
      var result = await sb
        .from('badminton_matches')
        .select('*')
        .order('updated_at', {
          ascending: false
        });

      if (result.error) {
        throw result.error;
      }

      var matches = result.data || [];

      window.__bmMatches = matches;

      var live = matches.filter(function (m) {
        return m.status === 'live';
      });

      var finished = matches.filter(function (m) {
        return (
          m.status === 'finished' ||
          m.status === 'walkover'
        );
      });

      if (
        typeof window.lexWatchScores === 'function'
      ) {
        window.lexWatchScores(
          live.map(function (m) {
            var d = r.getDisplay(m);

            return {
              id: 'b-' + m.id,

              label:
                'Badminton: ' +
                (m.player1 || '') +
                ' vs ' +
                (m.player2 || '') +
                ' · ' +
                d.stageLabel +
                ' · ' +
                d.currentScoreP1 +
                '-' +
                d.currentScoreP2,

              /*
               * Include current game score, games won, and winner/status
               * so notifications fire for meaningful match changes,
               * including a game ending.
               */
              scoreKey: [
                d.stage,
                d.currentGame,
                d.g1P1,
                d.g1P2,
                d.g2P1,
                d.g2P2,
                d.g3P1,
                d.g3P2,
                d.gamesP1,
                d.gamesP2,
                d.winnerSide || '',
                m.status || ''
              ].join('|'),

              isLive: true
            };
          })
        );
      }

      var liveEl =
        document.getElementById('bmLive');

      if (liveEl) {
        liveEl.innerHTML = live.length
          ? live
              .map(renderBmCard)
              .join('')
          : '<p class="text-slate-400 text-sm">No live matches</p>';
      }

      var recentEl =
        document.getElementById('bmRecent');

      if (recentEl) {
        recentEl.innerHTML = finished.length
          ? finished
              .slice(0, 8)
              .map(renderBmCard)
              .join('')
          : '<p class="text-slate-400 text-sm">No results yet</p>';
      }

      var allEl =
        document.getElementById('bmAll');

      if (allEl) {
        allEl.innerHTML = matches.length
          ? matches
              .map(renderBmCard)
              .join('')
          : '<p class="text-slate-400 text-sm">No fixtures yet</p>';
      }

      var up =
        document.getElementById('lastUpdated');

      if (up) {
        up.textContent =
          'Updated ' +
          new Date().toLocaleTimeString();
      }

    } catch (err) {
      console.error(err);

      var message =
        err && err.message
          ? err.message
          : String(err);

      [
        'bmLive',
        'bmRecent',
        'bmAll'
      ].forEach(function (id) {
        renderError(id, message);
      });
    }
  }

  function start() {
    forceDark();

    loadRules()
      .then(function () {
        loadBadminton();

        setInterval(
          loadBadminton,
          20000
        );

        var refreshBtn =
          document.getElementById('refreshBtn');

        if (refreshBtn) {
          refreshBtn.addEventListener(
            'click',
            loadBadminton
          );
        }
      })
      .catch(function (err) {
        console.error(err);

        var message =
          err && err.message
            ? err.message
            : 'Could not load badminton scoring rules.';

        [
          'bmLive',
          'bmRecent',
          'bmAll'
        ].forEach(function (id) {
          renderError(id, message);
        });
      });
  }

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      start
    );
  } else {
    start();
  }

})();
