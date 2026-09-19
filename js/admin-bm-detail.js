// Lex Liga Badminton Admin — match detail / scoring controls
// Requires:
//   js/badminton-rules.js
//   js/admin-badminton.js
//   js/admin-bm-actions.js

function renderBmDetail(m) {
  var r = window.BadmintonRules;

  if (!r) {
    return '<div class="bg-slate-800 rounded-2xl p-5 border border-slate-700">' +
      '<p class="text-red-400 text-sm">Badminton scoring engine is not loaded.</p>' +
      '</div>';
  }

  var d = r.getDisplay(m);
  var id = String(m.id);

  var p1 = m.player1 || 'Player / Pair 1';
  var p2 = m.player2 || 'Player / Pair 2';

  var n1 = p1.split(' ')[0] || 'P1';
  var n2 = p2.split(' ')[0] || 'P2';

  var status = d.status || 'not_started';

  var statusClass = 'bg-slate-700 text-slate-200';
  var statusText = d.statusLabel || 'Upcoming';

  if (status === 'live') {
    statusClass = 'bg-red-600 text-white';
    statusText = 'LIVE';
  } else if (status === 'finished') {
    statusClass = 'bg-slate-500 text-white';
    statusText = 'FT';
  } else if (status === 'walkover') {
    statusClass = 'bg-amber-600 text-white';
    statusText = 'W/O';
  } else {
    statusClass = 'bg-blue-600/30 text-blue-300';
    statusText = 'Upcoming';
  }

  var scoreButtons = [
    '<div class="grid grid-cols-2 gap-3 mb-3">',
    '<button type="button" ' +
      'class="py-5 bg-green-500 text-slate-900 rounded-xl font-extrabold text-base active:scale-[0.98]" ' +
      'data-bm="score" data-id="' + id + '" data-side="p1" data-d="1">',
      '+1 ' + escapeBmHtml(n1),
    '</button>',

    '<button type="button" ' +
      'class="py-5 bg-green-500 text-slate-900 rounded-xl font-extrabold text-base active:scale-[0.98]" ' +
      'data-bm="score" data-id="' + id + '" data-side="p2" data-d="1">',
      '+1 ' + escapeBmHtml(n2),
    '</button>',
    '</div>',

    '<div class="grid grid-cols-2 gap-3 mb-4">',
    '<button type="button" ' +
      'class="py-3 bg-slate-700 rounded-xl text-sm font-semibold active:scale-[0.98]" ' +
      'data-bm="score" data-id="' + id + '" data-side="p1" data-d="-1">',
      '−1 ' + escapeBmHtml(n1),
    '</button>',

    '<button type="button" ' +
      'class="py-3 bg-slate-700 rounded-xl text-sm font-semibold active:scale-[0.98]" ' +
      'data-bm="score" data-id="' + id + '" data-side="p2" data-d="-1">',
      '−1 ' + escapeBmHtml(n2),
    '</button>',
    '</div>'
  ].join('');

  var scoreSection = '';

  if (d.bestOfThree) {
    scoreSection = [
      '<div class="bg-slate-900 rounded-xl border border-slate-700 p-4 mb-4">',

      '<div class="flex items-center justify-between mb-3">',
      '<div>',
      '<div class="text-xs text-slate-500 uppercase tracking-wide">Current game</div>',
      '<div class="text-sm font-bold text-slate-200 mt-1">Game ', d.currentGame, ' of 3</div>',
      '</div>',
      '<div class="text-right">',
      '<div class="text-xs text-slate-500 uppercase tracking-wide">Games won</div>',
      '<div class="text-xl font-extrabold text-green-400 mt-1">',
      d.gamesP1, ' − ', d.gamesP2,
      '</div>',
      '</div>',
      '</div>',

      '<div class="grid grid-cols-2 gap-3 text-center">',
      '<div class="bg-slate-800 rounded-xl py-4">',
      '<div class="text-xs text-slate-400 truncate px-2">',
      escapeBmHtml(p1),
      '</div>',
      '<div class="text-4xl font-black tabular-nums mt-1">',
      d.currentScoreP1,
      '</div>',
      '</div>',

      '<div class="bg-slate-800 rounded-xl py-4">',
      '<div class="text-xs text-slate-400 truncate px-2">',
      escapeBmHtml(p2),
      '</div>',
      '<div class="text-4xl font-black tabular-nums mt-1">',
      d.currentScoreP2,
      '</div>',
      '</div>',
      '</div>',

      '<div class="grid grid-cols-3 gap-2 mt-3">',

      gameBox('G1', d.g1P1, d.g1P2, d.gamesP1 >= 1 || d.gamesP2 >= 1),

      gameBox('G2', d.g2P1, d.g2P2, d.gamesP1 + d.gamesP2 >= 2),

      gameBox('G3', d.g3P1, d.g3P2, d.gamesP1 + d.gamesP2 >= 2),

      '</div>',

      '</div>'
    ].join('');
  } else {
    scoreSection = [
      '<div class="bg-slate-900 rounded-xl border border-slate-700 p-4 mb-4">',
      '<div class="text-center text-xs text-slate-500 uppercase tracking-wide mb-2">',
      'Single set',
      '</div>',

      '<div class="grid grid-cols-2 gap-3 text-center">',
      '<div class="bg-slate-800 rounded-xl py-4">',
      '<div class="text-xs text-slate-400 truncate px-2">',
      escapeBmHtml(p1),
      '</div>',
      '<div class="text-5xl font-black tabular-nums mt-1">',
      d.currentScoreP1,
      '</div>',
      '</div>',

      '<div class="bg-slate-800 rounded-xl py-4">',
      '<div class="text-xs text-slate-400 truncate px-2">',
      escapeBmHtml(p2),
      '</div>',
      '<div class="text-5xl font-black tabular-nums mt-1">',
      d.currentScoreP2,
      '</div>',
      '</div>',
      '</div>',

      d.currentScoreP1 === 14 && d.currentScoreP2 === 14
        ? '<div class="text-center text-amber-400 text-xs font-bold mt-3">' +
          'GOLDEN POINT — next rally wins' +
          '</div>'
        : '',

      '</div>'
    ].join('');
  }

  var winnerHtml = '';

  if (status === 'finished' && d.winnerName) {
    winnerHtml =
      '<div class="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 text-center">' +
        '<div class="text-xs text-green-400 uppercase tracking-wide font-bold">Winner</div>' +
        '<div class="text-base font-extrabold text-green-300 mt-1">' +
          escapeBmHtml(d.winnerName) +
        '</div>' +
      '</div>';
  }

  if (status === 'walkover' && d.winnerName) {
    winnerHtml =
      '<div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 text-center">' +
        '<div class="text-xs text-amber-400 uppercase tracking-wide font-bold">Walkover Winner</div>' +
        '<div class="text-base font-extrabold text-amber-300 mt-1">' +
          escapeBmHtml(d.winnerName) +
        '</div>' +
      '</div>';
  }

  var normalControls = '';

  if (status !== 'walkover') {
    normalControls = [
      scoreButtons,

      '<div class="grid grid-cols-2 gap-2 mb-4">',

      '<button type="button" ' +
        'class="py-3 rounded-xl text-sm font-semibold ' +
          (status === 'not_started'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-200') + '" ' +
        'data-bm="status" data-id="' + id + '" data-status="not_started">',
        'Upcoming',
      '</button>',

      '<button type="button" ' +
        'class="py-3 rounded-xl text-sm font-semibold ' +
          (status === 'live'
            ? 'bg-red-600 text-white'
            : 'bg-slate-700 text-slate-200') + '" ' +
        'data-bm="status" data-id="' + id + '" data-status="live">',
        'LIVE',
      '</button>',

      '</div>'
    ].join('');
  }

  var walkoverControls = '';

  if (status === 'walkover') {
    walkoverControls = [
      '<button type="button" ' +
        'class="w-full py-3 rounded-xl bg-slate-700 text-slate-200 text-sm font-semibold mb-3" ' +
        'data-bm="clear-walkover" data-id="' + id + '">',
        'Clear walkover',
      '</button>'
    ].join('');
  } else {
    walkoverControls = [
      '<div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">',
      '<div class="text-xs text-slate-500 uppercase tracking-wide mb-2 text-center">',
      'Walkover',
      '</div>',
      '<div class="text-xs text-slate-500 text-center mb-3">',
      'Use only when officials award a walkover.',
      '</div>',
      '<div class="grid grid-cols-2 gap-2">',
      '<button type="button" ' +
        'class="py-3 rounded-xl bg-amber-600/80 text-white text-xs font-bold" ' +
        'data-bm="walkover" data-id="' + id + '" data-side="p1">',
        escapeBmHtml(n1) + ' wins W/O',
      '</button>',
      '<button type="button" ' +
        'class="py-3 rounded-xl bg-amber-600/80 text-white text-xs font-bold" ' +
        'data-bm="walkover" data-id="' + id + '" data-side="p2">',
        escapeBmHtml(n2) + ' wins W/O',
      '</button>',
      '</div>',
      '</div>'
    ].join('');
  }

  var finishedNote = '';

  if (status === 'finished') {
    finishedNote =
      '<div class="text-center text-xs text-slate-500 mb-4">' +
      'Match finished automatically under the official scoring rules.' +
      '</div>';
  }

  return [
    '<div class="bg-slate-800 rounded-2xl p-5 border border-slate-700">',

    '<div class="text-center mb-4">',

    '<div class="flex items-center justify-center gap-2">',
    '<span class="text-[11px] font-bold px-2 py-1 rounded-full ', statusClass, '">',
    statusText,
    '</span>',
    '</div>',

    '<div class="text-xs text-slate-400 mt-3">',
    escapeBmHtml(m.category || 'Badminton'),
    '</div>',

    '<div class="text-xs text-green-400 font-semibold mt-1">',
    escapeBmHtml(d.stageLabel),
    ' · ',
    escapeBmHtml(d.format),
    '</div>',

    '<div class="text-xs text-slate-500 mt-1">',
    escapeBmHtml(d.formatDescription),
    '</div>',

    '</div>',

    scoreSection,

    '<div class="text-center mb-4">',
    '<div class="text-base font-extrabold">',
    escapeBmHtml(p1),
    '</div>',
    '<div class="text-xs text-slate-500 my-1">vs</div>',
    '<div class="text-base font-extrabold">',
    escapeBmHtml(p2),
    '</div>',
    '</div>',

    winnerHtml,

    normalControls,

    finishedNote,

    walkoverControls,

    '<div class="border-t border-slate-700 pt-4 flex items-center justify-between">',
    '<button type="button" class="text-slate-400 underline text-sm" data-bm="reset" data-id="', id, '">',
    'Reset match',
    '</button>',
    '<button type="button" class="text-red-400 underline text-sm" data-bm="delete" data-id="', id, '">',
    'Delete',
    '</button>',
    '</div>',

    '</div>'
  ].join('');
}

function gameBox(label, p1, p2, muted) {
  return [
    '<div class="rounded-lg border border-slate-700 ',
    muted ? 'opacity-70' : '',
    ' p-2 text-center">',

    '<div class="text-[10px] text-slate-500 font-bold">',
    label,
    '</div>',

    '<div class="text-sm font-extrabold mt-1 tabular-nums">',
    Number(p1) || 0,
    ' − ',
    Number(p2) || 0,
    '</div>',

    '</div>'
  ].join('');
}

function escapeBmHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-bm]');
  if (!btn) return;

  var kind = btn.getAttribute('data-bm');
  var id = btn.getAttribute('data-id');

  if (kind === 'score' && typeof bmScore === 'function') {
    bmScore(
      id,
      btn.getAttribute('data-side'),
      Number(btn.getAttribute('data-d'))
    );
    return;
  }

  if (kind === 'status' && typeof bmStatus === 'function') {
    bmStatus(
      id,
      btn.getAttribute('data-status')
    );
    return;
  }

  if (kind === 'walkover' && typeof bmWalkover === 'function') {
    bmWalkover(
      id,
      btn.getAttribute('data-side')
    );
    return;
  }

  if (kind === 'clear-walkover' && typeof bmClearWalkover === 'function') {
    bmClearWalkover(id);
    return;
  }

  if (kind === 'reset' && typeof bmReset === 'function') {
    bmReset(id);
    return;
  }

  if (kind === 'delete' && typeof bmDelete === 'function') {
    bmDelete(id);
  }
});
