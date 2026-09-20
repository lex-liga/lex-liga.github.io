// Lex Liga Badminton — official tournament scoring rules
// Rulebook:
// - Round 1–QF default: 15-point single set (Golden Point at 14–14)
// - Semi/Final default: 21-point best of 3 (win by 2, cap 30)
// Format can override via resolveFormatStage (15 or 21)

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
    if (s === 'qf' || s === 'quarter' || s === 'quarterfinal') return 'quarter_final';
    if (s === 'sf' || s === 'semi' || s === 'semifinal') return 'semi_final';
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
    return { p1: nonNegative(match['g' + game + '_p1']), p2: nonNegative(match['g' + game + '_p2']) };
  }
  function setGameScores(match, gameNumber, p1, p2) {
    var game = Math.max(1, Math.min(3, intValue(gameNumber, 1)));
    match['g' + game + '_p1'] = nonNegative(p1);
    match['g' + game + '_p2'] = nonNegative(p2);
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

  function getCompletedGameWinners(match) {
    var winners = [];
    if (!isBestOfThree(match.stage)) {
      var singleWinner = getGameWinner(match, 1);
      if (singleWinner) winners.push(singleWinner);
      return winners;
    }
    for (var game = 1; game <= 3; game++) {
      var winner = getGameWinner(match, game);
      if (winner) winners.push({ game: game, winner: winner });
    }
    return winners;
  }

  function getMatchWinner(match) {
    if (match.winner_side === 'p1' || match.winner_side === 'p2') return match.winner_side;
    if (!isBestOfThree(match.stage)) return getGameWinner(match, 1);
    var p1 = 0, p2 = 0;
    getCompletedGameWinners(match).forEach(function (w) {
      var side = typeof w === 'string' ? w : w.winner;
      if (side === 'p1') p1++;
      if (side === 'p2') p2++;
    });
    if (p1 >= 2) return 'p1';
    if (p2 >= 2) return 'p2';
    return null;
  }

  function getWinnerName(match) {
    var w = getMatchWinner(match);
    if (w === 'p1') return match.player1;
    if (w === 'p2') return match.player2;
    return null;
  }

  function getScoreline(match) {
    if (!isBestOfThree(match.stage)) {
      var s = getGameScores(match, 1);
      return s.p1 + '–' + s.p2;
    }
    var parts = [];
    for (var g = 1; g <= 3; g++) {
      var sc = getGameScores(match, g);
      if (sc.p1 || sc.p2 || g === 1) parts.push(sc.p1 + '–' + sc.p2);
    }
    return parts.join(' · ');
  }

  function getDisplay(match) {
    return {
      stageLabel: getStageLabel(match.stage),
      formatLabel: getFormatLabel(match.stage),
      formatDescription: getFormatDescription(match.stage),
      scoreline: getScoreline(match),
      winner: getWinnerName(match),
      isBestOfThree: isBestOfThree(match.stage),
      isShortSet: isShortSet(match.stage)
    };
  }

  window.BadmintonRules = {
    normalizeStage: normalizeStage,
    resolveFormatStage: resolveFormatStage,
    isBestOfThree: isBestOfThree,
    isShortSet: isShortSet,
    getStageInfo: getStageInfo,
    getStageLabel: getStageLabel,
    getFormatLabel: getFormatLabel,
    getFormatDescription: getFormatDescription,
    getGameScores: getGameScores,
    setGameScores: setGameScores,
    getGameWinner: getGameWinner,
    getCompletedGameWinners: getCompletedGameWinners,
    getMatchWinner: getMatchWinner,
    getWinnerName: getWinnerName,
    getScoreline: getScoreline,
    getDisplay: getDisplay
  };
})(window);
