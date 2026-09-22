// Lex Liga Badminton scoring rules
(function (window) {
  'use strict';

  var SHORT_SET_STAGES = [
    'round1', 'round2', 'round3', 'quarter_final', 'semi_final_15', 'final_15'
  ];
  var BEST_OF_THREE_STAGES = [
    'semi_final', 'final', 'round1_21', 'round2_21', 'round3_21', 'quarter_final_21'
  ];

  var STAGE_INFO = {
    round1: { key: 'round1', label: 'Round 1', shortLabel: 'R1', format: '15 points · 1 set', description: '15-point single set · Golden Point at 14–14' },
    round2: { key: 'round2', label: 'Round 2', shortLabel: 'R2', format: '15 points · 1 set', description: '15-point single set · Golden Point at 14–14' },
    round3: { key: 'round3', label: 'Round 3', shortLabel: 'R3', format: '15 points · 1 set', description: '15-point single set · Golden Point at 14–14' },
    quarter_final: { key: 'quarter_final', label: 'Quarter-final', shortLabel: 'QF', format: '15 points · 1 set', description: '15-point single set · Golden Point at 14–14' },
    semi_final: { key: 'semi_final', label: 'Semi-final', shortLabel: 'SF', format: '21 points · Best of 3', description: '21-point best of 3 · Win by 2 · Cap 30' },
    final: { key: 'final', label: 'Final', shortLabel: 'F', format: '21 points · Best of 3', description: '21-point best of 3 · Win by 2 · Cap 30' },
    semi_final_15: { key: 'semi_final_15', label: 'Semi-final', shortLabel: 'SF', format: '15 points · 1 set', description: '15-point single set · Golden Point at 14–14' },
    final_15: { key: 'final_15', label: 'Final', shortLabel: 'F', format: '15 points · 1 set', description: '15-point single set · Golden Point at 14–14' },
    round1_21: { key: 'round1_21', label: 'Round 1', shortLabel: 'R1', format: '21 points · Best of 3', description: '21-point best of 3 · Win by 2 · Cap 30' },
    round2_21: { key: 'round2_21', label: 'Round 2', shortLabel: 'R2', format: '21 points · Best of 3', description: '21-point best of 3 · Win by 2 · Cap 30' },
    round3_21: { key: 'round3_21', label: 'Round 3', shortLabel: 'R3', format: '21 points · Best of 3', description: '21-point best of 3 · Win by 2 · Cap 30' },
    quarter_final_21: { key: 'quarter_final_21', label: 'Quarter-final', shortLabel: 'QF', format: '21 points · Best of 3', description: '21-point best of 3 · Win by 2 · Cap 30' }
  };

  function intValue(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback == null ? 0 : fallback;
    return Math.trunc(n);
  }
  function nonNegative(value) { return Math.max(0, intValue(value, 0)); }

  function normalizeStage(stage) {
    var s = String(stage || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (s === 'r1' || s === 'round_1') return 'round1';
    if (s === 'r2' || s === 'round_2') return 'round2';
    if (s === 'r3' || s === 'round_3') return 'round3';
    if (s === 'qf' || s === 'quarter' || s === 'quarterfinal' || s === 'quarter_finals') return 'quarter_final';
    if (s === 'sf' || s === 'semi' || s === 'semifinal' || s === 'semi_finals') return 'semi_final';
    if (s === 'f' || s === 'finale') return 'final';
    if (STAGE_INFO[s]) return s;
    return 'round1';
  }

  function isBestOfThree(stage) {
    return BEST_OF_THREE_STAGES.indexOf(normalizeStage(stage)) !== -1;
  }
  function isShortSet(stage) {
    return SHORT_SET_STAGES.indexOf(normalizeStage(stage)) !== -1;
  }
  function getStageInfo(stage) {
    return STAGE_INFO[normalizeStage(stage)] || STAGE_INFO.round1;
  }
  function getStageLabel(stage) { return getStageInfo(stage).label; }
  function getFormatLabel(stage) { return getStageInfo(stage).format; }
  function getFormatDescription(stage) { return getStageInfo(stage).description; }

  function resolveFormatStage(stage, format) {
    var s = normalizeStage(stage);
    var f = String(format || 'auto').trim();
    if (f === '15' || f === 'short') {
      if (s === 'semi_final' || s === 'semi_final_15') return 'semi_final_15';
      if (s === 'final' || s === 'final_15') return 'final_15';
      return s.replace(/_21$/, '');
    }
    if (f === '21' || f === 'long') {
      if (s === 'semi_final' || s === 'semi_final_15') return 'semi_final';
      if (s === 'final' || s === 'final_15') return 'final';
      if (SHORT_SET_STAGES.indexOf(s) !== -1 && s.indexOf('_15') < 0) return s + '_21';
      return s;
    }
    return s;
  }

  function getGameScores(match, gameNumber) {
    var game = Math.max(1, Math.min(3, intValue(gameNumber, 1)));
    return {
      p1: nonNegative(match['g' + game + '_p1']),
      p2: nonNegative(match['g' + game + '_p2'])
    };
  }

  function getGameWinner(match, gameNumber) {
    var stage = normalizeStage(match.stage);
    var score = getGameScores(match, gameNumber);
    var p1 = score.p1, p2 = score.p2;
    if (isShortSet(stage)) {
      if (p1 >= 15 && p1 > p2) return 'p1';
      if (p2 >= 15 && p2 > p1) return 'p2';
      return null;
    }
    if (p1 >= 30 && p1 > p2) return 'p1';
    if (p2 >= 30 && p2 > p1) return 'p2';
    if (p1 >= 21 && p1 - p2 >= 2) return 'p1';
    if (p2 >= 21 && p2 - p1 >= 2) return 'p2';
    return null;
  }

  function getMatchWinner(match) {
    if (match.winner_side === 'p1' || match.winner_side === 'p2') return match.winner_side;
    if (!isBestOfThree(match.stage)) return getGameWinner(match, 1);
    var p1 = 0, p2 = 0;
    for (var g = 1; g <= 3; g++) {
      var w = getGameWinner(match, g);
      if (w === 'p1') p1++;
      if (w === 'p2') p2++;
    }
    if (p1 >= 2) return 'p1';
    if (p2 >= 2) return 'p2';
    return null;
  }

  function getWinnerName(match) {
    var w = match.winner_side || getMatchWinner(match);
    if (w === 'p1') return match.player1 || 'Player 1';
    if (w === 'p2') return match.player2 || 'Player 2';
    return '';
  }

  function getCurrentGame(match) {
    var cg = intValue(match.current_game, 1);
    return Math.max(1, Math.min(3, cg || 1));
  }

  function getDisplay(match) {
    var m = match || {};
    var stage = normalizeStage(m.stage);
    var info = getStageInfo(stage);
    var bot = isBestOfThree(stage);
    var currentGame = getCurrentGame(m);
    var cur = getGameScores(m, bot ? currentGame : 1);
    var winner = m.winner_side || getMatchWinner(m);
    var status = m.status || 'not_started';
    var statusLabel = 'Upcoming';
    if (status === 'walkover') statusLabel = 'W/O';
    else if (status === 'finished' || winner) statusLabel = 'FT';
    else if (status === 'live') statusLabel = 'LIVE';

    return {
      stage: info.key,
      stageLabel: info.label,
      stageShortLabel: info.shortLabel,
      format: info.format,
      formatDescription: info.description,
      bestOfThree: bot,
      status: status,
      statusLabel: statusLabel,
      winnerSide: winner,
      winnerName: getWinnerName(m),
      currentGame: currentGame,
      currentScoreP1: cur.p1,
      currentScoreP2: cur.p2,
      gamesP1: nonNegative(m.games_p1),
      gamesP2: nonNegative(m.games_p2),
      g1P1: nonNegative(m.g1_p1),
      g1P2: nonNegative(m.g1_p2),
      g2P1: nonNegative(m.g2_p1),
      g2P2: nonNegative(m.g2_p2),
      g3P1: nonNegative(m.g3_p1),
      g3P2: nonNegative(m.g3_p2),
      scoreText: cur.p1 + ' – ' + cur.p2,
      gamesText: bot ? (nonNegative(m.games_p1) + ' – ' + nonNegative(m.games_p2)) : '',
      finished: !!winner || status === 'finished' || status === 'walkover',
      totalPoints: nonNegative(m.g1_p1) + nonNegative(m.g1_p2) + nonNegative(m.g2_p1) + nonNegative(m.g2_p2) + nonNegative(m.g3_p1) + nonNegative(m.g3_p2)
    };
  }

  // Minimal evaluate/applyDelta for admin scoring if detail script needs them
  function cloneMatch(match) {
    return Object.assign({}, match);
  }
  function evaluate(match) {
    var m = cloneMatch(match);
    var w = getMatchWinner(m);
    if (w && m.status !== 'walkover') {
      m.winner_side = w;
      if (m.status === 'live' || m.status === 'not_started') m.status = 'finished';
    }
    return m;
  }
  function applyDelta(match, side, delta) {
    var m = cloneMatch(match);
    var game = getCurrentGame(m);
    var key = 'g' + game + '_' + (side === 'p2' ? 'p2' : 'p1');
    m[key] = Math.max(0, nonNegative(m[key]) + intValue(delta, 0));
    if (isBestOfThree(m.stage)) {
      var p1g = 0, p2g = 0;
      for (var g = 1; g <= 3; g++) {
        var gw = getGameWinner(m, g);
        if (gw === 'p1') p1g++;
        if (gw === 'p2') p2g++;
      }
      m.games_p1 = p1g;
      m.games_p2 = p2g;
    }
    return evaluate(m);
  }
  function toUpdate(match) {
    return {
      stage: match.stage,
      status: match.status,
      winner_side: match.winner_side || null,
      current_game: getCurrentGame(match),
      games_p1: nonNegative(match.games_p1),
      games_p2: nonNegative(match.games_p2),
      g1_p1: nonNegative(match.g1_p1),
      g1_p2: nonNegative(match.g1_p2),
      g2_p1: nonNegative(match.g2_p1),
      g2_p2: nonNegative(match.g2_p2),
      g3_p1: nonNegative(match.g3_p1),
      g3_p2: nonNegative(match.g3_p2),
      updated_at: new Date().toISOString()
    };
  }

  window.BadmintonRules = {
    STAGES: STAGE_INFO,
    normalizeStage: normalizeStage,
    resolveFormatStage: resolveFormatStage,
    isBestOfThree: isBestOfThree,
    isShortSet: isShortSet,
    getStageInfo: getStageInfo,
    getStageLabel: getStageLabel,
    getFormatLabel: getFormatLabel,
    getFormatDescription: getFormatDescription,
    getGameScores: getGameScores,
    getGameWinner: getGameWinner,
    getMatchWinner: getMatchWinner,
    getWinnerName: getWinnerName,
    getCurrentGame: getCurrentGame,
    getDisplay: getDisplay,
    cloneMatch: cloneMatch,
    evaluate: evaluate,
    applyDelta: applyDelta,
    toUpdate: toUpdate
  };
})(window);
