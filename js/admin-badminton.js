// Lex Liga Badminton Admin — match list / navigation / stage-aware display

function getSb() {
  return window.supabaseClient ||
    window.supabase ||
    (typeof supabase !== 'undefined' ? supabase : null);
}

var bmMatches = [];
var selectedBmId = null;

function getBmRules() {
  return window.BadmintonRules || null;
}

function bmEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function bmStatusChip(status) {
  var map = {
    not_started: ['Upcoming', 'bg-blue-600/30 text-blue-300'],
    live: ['LIVE', 'bg-red-600 text-white'],
    finished: ['FT', 'bg-slate-600 text-slate-200'],
    walkover: ['W/O', 'bg-amber-600 text-white']
  };

  var pair = map[status] || [
    status || '?',
    'bg-slate-700 text-slate-300'
  ];

  return (
    '<span class="text-[11px] font-bold px-2 py-0.5 rounded-full ' +
    pair[1] +
    '">' +
    bmEscape(pair[0]) +
    '</span>'
  );
}

function setBmAddVisible(show) {
  var box = document.getElementById('bmAddBox');

  /*
   * Backward-compatible fallback because the current HTML does not
   * yet have an explicit bmAddBox id. We will add that in a later step.
   */
  if (!box) {
    var panel = document.getElementById('adminPanelBadminton');

    if (panel) {
      panel.querySelectorAll('.bg-slate-800').forEach(function (c) {
        if (
          c.querySelector('#bmAddBtn') ||
          c.querySelector('#bmP1')
        ) {
          box = c;
        }
      });
    }
  }

  if (box) {
    box.classList.toggle('hidden', !show);
  }

  var title = document.getElementById('bmListTitle');

  if (title) {
    title.textContent = selectedBmId
      ? 'Control match'
      : 'Matches';
  }
}

window.showBmList = function () {
  selectedBmId = null;
  setBmAddVisible(true);
  renderBmUI();
};

window.openBmMatch = function (id) {
  selectedBmId = id;
  setBmAddVisible(false);
  renderBmUI();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

async function loadBadmintonAdmin() {
  var el = document.getElementById('adminBadmintonMatches');

  if (!el) return;

  if (!selectedBmId) {
    el.innerHTML =
      '<p class="text-slate-400 text-sm text-center py-8">' +
      'Loading...' +
      '</p>';
  }

  var sb = getSb();

  if (!sb || typeof sb.from !== 'function') {
    el.innerHTML =
      '<p class="text-red-400 text-sm text-center">' +
      'Supabase not ready' +
      '</p>';

    return;
  }

  try {
    var res = await sb
      .from('badminton_matches')
      .select('*')
      .order('created_at', { ascending: true });

    if (res.error) {
      throw res.error;
    }

    bmMatches = res.data || [];

    renderBmUI();
  } catch (e) {
    el.innerHTML =
      '<p class="text-red-400 text-sm text-center">' +
      bmEscape(e.message || e) +
      '</p>';
  }
}

window.loadBadmintonAdmin = loadBadmintonAdmin;

function catLabel(cat) {
  var c = String(cat || '').trim();

  if (!c) return 'Other';

  var u = c.toUpperCase();

  if (
    u.indexOf('MS') === 0 ||
    (u.indexOf('MEN') >= 0 && u.indexOf('SING') >= 0)
  ) {
    return "Men's Singles";
  }

  if (
    u.indexOf('MD') === 0 ||
    (u.indexOf('MEN') >= 0 && u.indexOf('DOUB') >= 0)
  ) {
    return "Men's Doubles";
  }

  if (
    u.indexOf('WS') === 0 ||
    (u.indexOf('WOMEN') >= 0 && u.indexOf('SING') >= 0)
  ) {
    return "Women's Singles";
  }

  if (
    u.indexOf('WD') === 0 ||
    (u.indexOf('WOMEN') >= 0 && u.indexOf('DOUB') >= 0)
  ) {
    return "Women's Doubles";
  }

  if (
    u.indexOf('XD') === 0 ||
    u.indexOf('MIX') >= 0
  ) {
    return 'Mixed Doubles';
  }

  return c;
}

function catOrder(label) {
  var order = [
    "Men's Singles",
    "Men's Doubles",
    "Women's Singles",
    "Women's Doubles",
    'Mixed Doubles'
  ];

  var i = order.indexOf(label);

  return i >= 0 ? i : 50;
}

function statusOrder(status) {
  if (status === 'live') return 0;
  if (status === 'not_started') return 1;
  if (status === 'finished') return 2;
  if (status === 'walkover') return 3;

  return 4;
}

function stageOrder(stage) {
  var order = [
    'round1',
    'round2',
    'round3',
    'quarter_final',
    'semi_final',
    'final'
  ];

  var i = order.indexOf(stage);

  return i >= 0 ? i : 99;
}

function bmStageInfo(match) {
  var r = getBmRules();

  if (r) {
    return r.getStageInfo(match.stage);
  }

  /*
   * Fallback while the rules file is loading.
   * Existing matches have stage=round1 from the Supabase migration.
   */
  var stage = String(match.stage || 'round1').toLowerCase();

  var fallback = {
    round1: {
      key: 'round1',
      label: 'Round 1',
      shortLabel: 'R1',
      format: '15 points · 1 set'
    },
    round2: {
      key: 'round2',
      label: 'Round 2',
      shortLabel: 'R2',
      format: '15 points · 1 set'
    },
    round3: {
      key: 'round3',
      label: 'Round 3',
      shortLabel: 'R3',
      format: '15 points · 1 set'
    },
    quarter_final: {
      key: 'quarter_final',
      label: 'Quarter-final',
      shortLabel: 'QF',
      format: '15 points · 1 set'
    },
    semi_final: {
      key: 'semi_final',
      label: 'Semi-final',
      shortLabel: 'SF',
      format: '21 points · Best of 3'
    },
    final: {
      key: 'final',
      label: 'Final',
      shortLabel: 'F',
      format: '21 points · Best of 3'
    }
  };

  return fallback[stage] || fallback.round1;
}

function renderBmUI() {
  var el = document.getElementById('adminBadmintonMatches');

  if (!el) return;

  /*
   * Detail view.
   */
  if (selectedBmId) {
    var m = bmMatches.find(function (x) {
      return String(x.id) === String(selectedBmId);
    });

    if (!m) {
      selectedBmId = null;
      setBmAddVisible(true);
      return renderBmUI();
    }

    setBmAddVisible(false);

    el.innerHTML =
      '<button type="button" onclick="showBmList()" ' +
      'class="flex items-center gap-2 text-sm text-green-400 ' +
      'font-semibold mb-4">' +
      '<span class="text-lg">&larr;</span>' +
      'Back to matches' +
      '</button>' +

      (
        typeof renderBmDetail === 'function'
          ? renderBmDetail(m)
          : '<p class="text-red-400">Loading controls...</p>'
      );

    return;
  }

  /*
   * Match-list view.
   */
  setBmAddVisible(true);

  if (!bmMatches.length) {
    el.innerHTML =
      '<p class="text-slate-400 text-sm text-center py-6">' +
      'No matches yet. Add one below.' +
      '</p>';

    return;
  }

  /*
   * Group by category.
   */
  var byCat = {};

  bmMatches.forEach(function (m) {
    var lab = catLabel(m.category);

    if (!byCat[lab]) {
      byCat[lab] = [];
    }

    byCat[lab].push(m);
  });

  var cats = Object.keys(byCat).sort(function (a, b) {
    return catOrder(a) - catOrder(b);
  });

  var html = '';

  cats.forEach(function (lab) {
    var list = byCat[lab].slice().sort(function (a, b) {
      var statusDiff =
        statusOrder(a.status) - statusOrder(b.status);

      if (statusDiff !== 0) {
        return statusDiff;
      }

      var aStage = stageOrder(
        String(a.stage || 'round1').toLowerCase()
      );

      var bStage = stageOrder(
        String(b.stage || 'round1').toLowerCase()
      );

      if (aStage !== bStage) {
        return aStage - bStage;
      }

      return (
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime()
      );
    });

    var liveN = list.filter(function (m) {
      return m.status === 'live';
    }).length;

    var upN = list.filter(function (m) {
      return m.status === 'not_started';
    }).length;

    var doneN = list.filter(function (m) {
      return m.status === 'finished' ||
        m.status === 'walkover';
    }).length;

    var summary = [
      list.length + ' match' +
        (list.length === 1 ? '' : 'es')
    ];

    if (liveN) {
      summary.push(liveN + ' live');
    }

    if (upN) {
      summary.push(upN + ' upcoming');
    }

    if (doneN) {
      summary.push(doneN + ' done');
    }

    html +=
      '<div class="mt-5 first:mt-0">' +

      '<div class="flex items-center justify-between mb-2 gap-3">' +

      '<p class="text-sm font-extrabold text-green-400">' +
      bmEscape(lab) +
      '</p>' +

      '<span class="text-[11px] text-slate-500 text-right">' +
      bmEscape(summary.join(' · ')) +
      '</span>' +

      '</div>' +

      '<div class="space-y-2">' +
      list.map(renderBmRow).join('') +
      '</div>' +

      '</div>';
  });

  html +=
    '<p class="text-xs text-slate-500 text-center pt-3">' +
    'Tap a match to control scores' +
    '</p>';

  el.innerHTML = html;
}

function renderBmRow(m) {
  var r = getBmRules();
  var info = bmStageInfo(m);

  var p1 = 0;
  var p2 = 0;

  var scoreText = '';
  var subText = '';

  if (r) {
    var d = r.getDisplay(m);

    p1 = d.currentScoreP1;
    p2 = d.currentScoreP2;

    if (d.bestOfThree) {
      scoreText = p1 + '–' + p2;
      subText =
        'Game ' + d.currentGame +
        ' · Games ' + d.gamesP1 + '–' + d.gamesP2;

      if (d.winnerName) {
        subText = 'Winner · ' + d.winnerName;
      }
    } else {
      scoreText = p1 + '–' + p2;

      subText =
        d.winnerName
          ? 'Winner · ' + d.winnerName
          : info.description ||
            '15-point single set';
    }
  } else {
    p1 = Number(m.g1_p1) || 0;
    p2 = Number(m.g1_p2) || 0;

    scoreText = p1 + '–' + p2;

    subText = info.format;
  }

  var isBye =
    String(m.player2 || '').trim().toUpperCase() === 'BYE';

  var stageBadge =
    '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ' +
    'bg-slate-700 text-slate-300">' +
    bmEscape(info.shortLabel) +
    '</span>';

  var player1 = bmEscape(m.player1 || 'Player / Pair 1');
  var player2 = bmEscape(m.player2 || 'Player / Pair 2');

  return (
    '<button type="button" ' +
    'onclick="openBmMatch(\'' + bmEscape(String(m.id)) + '\')" ' +
    'class="w-full text-left bg-slate-800 border border-slate-700 ' +
    'rounded-xl px-4 py-3 active:scale-[0.99]">' +

    '<div class="flex items-center justify-between gap-2 mb-2">' +

    '<div class="flex items-center gap-2">' +
    bmStatusChip(m.status) +
    stageBadge +
    '</div>' +

    '<span class="text-[10px] text-slate-500 truncate">' +
    bmEscape(m.category || '') +
    (isBye ? ' · BYE' : '') +
    '</span>' +

    '</div>' +

    '<div class="flex items-center gap-2">' +

    '<span class="flex-1 text-sm font-semibold text-right truncate">' +
    player1 +
    '</span>' +

    '<span class="font-extrabold text-base tabular-nums px-1">' +
    bmEscape(scoreText) +
    '</span>' +

    '<span class="flex-1 text-sm font-semibold truncate">' +
    player2 +
    '</span>' +

    '</div>' +

    '<div class="text-[10px] text-slate-500 text-center mt-2">' +
    bmEscape(info.label) +
    ' · ' +
    bmEscape(info.format) +
    '</div>' +

    '<div class="text-[11px] text-green-400 text-center mt-1">' +
    bmEscape(subText) +
    '</div>' +

    '</button>'
  );
}

/*
 * Load supporting Badminton modules in the correct order.
 *
 * Order:
 *   1. badminton-rules.js
 *   2. admin-bm-detail.js
 *   3. admin-bm-actions.js
 *
 * The HTML will explicitly load the rules file in a later step as well,
 * but this loader remains defensive so the admin does not depend on
 * script-tag order alone.
 */
(function loadBmExtras() {
  var base = 'js/';
  var version = '20260919-2';

  function alreadyLoaded(fileName) {
    return !!document.querySelector(
      'script[src*="' + fileName + '"]'
    );
  }

  function loadScript(fileName, done) {
    if (alreadyLoaded(fileName)) {
      done();
      return;
    }

    var s = document.createElement('script');

    s.src =
      base +
      fileName +
      '?v=' +
      version;

    s.async = false;

    s.onload = function () {
      done();
    };

    s.onerror = function () {
      console.error(
        'Lex Liga: could not load ' + fileName
      );
    };

    document.body.appendChild(s);
  }

  loadScript('badminton-rules.js', function () {
    loadScript('admin-bm-detail.js', function () {
      loadScript('admin-bm-actions.js', function () {
        /*
         * Everything required for the Badminton admin is now available.
         * Re-render so an already-open match immediately gets its
         * stage-aware controls.
         */
        renderBmUI();
      });
    });
  });
})();
