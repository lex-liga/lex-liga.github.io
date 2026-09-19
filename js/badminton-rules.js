// Lex Liga Badminton — official tournament scoring rules
// Rulebook:
// - Round 1, Round 2, Round 3, Quarter-final: 15-point single set
//   Golden Point at 14-14; next rally wins.
// - Semi-final, Final: 21-point best of 3 games
//   Win by 2; at 29-29, next point wins (30-29).
//
// This file is intentionally UI-independent.
// Admin/public files can use window.BadmintonRules.

(function (window) {
  'use strict';

  var SHORT_SET_STAGES = [
    'round1',
    'round2',
    'round3',
    'quarter_final'
  ];

  var BEST_OF_THREE_STAGES = [
    'semi_final',
    'final'
  ];

  var STAGE_INFO = {
    round1: {
      key: 'round1',
      label: 'Round 1',
      shortLabel: 'R1',
      format: '15 points · 1 set',
      description: '15-point single set · Golden Point at 14–14'
    },
    round2: {
      key: 'round2',
      label: 'Round 2',
      shortLabel: 'R2',
      format: '15 points · 1 set',
      description: '15-point single set · Golden Point at 14–14'
    },
    round3: {
      key: 'round3',
      label: 'Round 3',
      shortLabel: 'R3',
      format: '15 points · 1 set',
      description: '15-point single set · Golden Point at 14–14'
    },
    quarter_final: {
      key: 'quarter_final',
      label: 'Quarter-final',
      shortLabel: 'QF',
      format: '15 points · 1 set',
      description: '15-point single set · Golden Point at 14–14'
    },
    semi_final: {
      key: 'semi_final',
      label: 'Semi-final',
      shortLabel: 'SF',
      format: '21 points · Best of 3',
      description: '21-point best of 3 · Win by 2 · Cap 30'
    },
    final: {
      key: 'final',
      label: 'Final',
      shortLabel: 'F',
      format: '21 points · Best of 3',
      description: '21-point best of 3 · Win by 2 · Cap 30'
    }
  };

  function intValue(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback == null ? 0 : fallback;
    return Math.trunc(n);
  }

  function nonNegative(value) {
    return Math.max(0, intValue(value, 0));
  }

  function normalizeStage(stage) {
    var s = String(stage || '').trim().toLowerCase();

    if (STAGE_INFO[s]) return s;

    // Backward-safe fallback because existing matches are defaulted to round1.
    return 'round1';
  }

  function isBestOfThree(stage) {
    return BEST_OF_THREE_STAGES.indexOf(normalizeStage(stage)) !== -1;
  }

  function isShortSet(stage) {
    return SHORT_SET_STAGES.indexOf(normalizeStage(stage)) !== -1;
  }

  function getStageInfo(stage) {
    return STAGE_INFO[normalizeStage(stage)];
  }

  function getStageLabel(stage) {
    return getStageInfo(stage).label;
  }

  function getFormatLabel(stage) {
    return getStageInfo(stage).format;
  }

  function getFormatDescription(stage) {
    return getStageInfo(stage).description;
  }

  function getGameScores(match, gameNumber) {
    var game = Math.max(1, Math.min(3, intValue(gameNumber, 1)));

    return {
      p1: nonNegative(match['g' + game + '_p1']),
      p2: nonNegative(match['g' + game + '_p2'])
    };
  }

  function setGameScores(match, gameNumber, p1, p2) {
    var game = Math.max(1, Math.min(3, intValue(gameNumber, 1)));

    match['g' + game + '_p1'] = nonNegative(p1);
    match['g' + game + '_p2'] = nonNegative(p2);
  }

  function gameHasAnyPoints(match, gameNumber) {
    var s = getGameScores(match, gameNumber);
    return s.p1 > 0 || s.p2 > 0;
  }

  /*
   * Returns:
   *   'p1' = player/pair 1 won the game
   *   'p2' = player/pair 2 won the game
   *   null = game is still active
   */
  function getGameWinner(match, gameNumber) {
    var stage = normalizeStage(match.stage);
    var score = getGameScores(match, gameNumber);
    var p1 = score.p1;
    var p2 = score.p2;

    if (isShortSet(stage)) {
      // 15-point single set.
      // At 14-14, the next point makes the score 15-14 and wins.
      if (p1 >= 15 && p1 > p2) return 'p1';
      if (p2 >= 15 && p2 > p1) return 'p2';
      return null;
    }

    // Semi-final / Final: 21-point game, win by 2,
    // but the score caps at 30. At 29-29, next point wins.
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
      if (winner) winners.push({
        game: game,
        winner: winner
      });
    }

    return winners;
  }

  function getGamesWon(match) {
    if (!isBestOfThree(match.stage)) {
      return {
        p1: 0,
        p2: 0
      };
    }

    var p1 = 0;
    var p2 = 0;

    for (var game = 1; game <= 3; game++) {
      var winner = getGameWinner(match, game);
      if (winner === 'p1') p1++;
      if (winner === 'p2') p2++;
    }

    return {
      p1: p1,
      p2: p2
    };
  }

  function getMatchWinner(match) {
    var stage = normalizeStage(match.stage);

    if (isShortSet(stage)) {
      return getGameWinner(match, 1);
    }

    var games = getGamesWon(match);

    if (games.p1 >= 2) return 'p1';
    if (games.p2 >= 2) return 'p2';

    return null;
  }

  function getLastCompletedGame(match) {
    if (!isBestOfThree(match.stage)) {
      return getGameWinner(match, 1) ? 1 : 0;
    }

    var last = 0;

    for (var game = 1; game <= 3; game++) {
      if (getGameWinner(match, game)) {
        last = game;
      }
    }

    return last;
  }

  /*
   * Returns the game currently being played.
   *
   * Examples:
   *   0-0 before the first game => 1
   *   Game 1 finished => 2
   *   Game 2 finished => 3
   *   Match finished 2-0 => 2
   *   Match finished 2-1 => 3
   */
  function getCurrentGame(match) {
    if (!isBestOfThree(match.stage)) return 1;

    var winner = getMatchWinner(match);
    var lastCompleted = getLastCompletedGame(match);

    if (winner) {
      return lastCompleted || 1;
    }

    if (lastCompleted >= 3) return 3;

    return Math.min(3, lastCompleted + 1);
  }

  function getCurrentScore(match) {
    return getGameScores(match, getCurrentGame(match));
  }

  function getOverallScore(match) {
    var stage = normalizeStage(match.stage);

    if (isShortSet(stage)) {
      return getGameScores(match, 1);
    }

    var games = getGamesWon(match);
    return {
      p1: games.p1,
      p2: games.p2
    };
  }

  function getPointCap(stage) {
    return isShortSet(stage) ? 15 : 30;
  }

  function isMatchFinished(match) {
    return getMatchWinner(match) !== null || String(match.status || '') === 'walkover';
  }

  function totalPoints(match) {
    var total = 0;

    for (var game = 1; game <= 3; game++) {
      var score = getGameScores(match, game);
      total += score.p1 + score.p2;
    }

    return total;
  }

  function cloneMatch(match) {
    return {
      id: match.id,
      player1: match.player1,
      player2: match.player2,
      category: match.category,
      stage: normalizeStage(match.stage),

      status: match.status || 'not_started',
      winner_side: match.winner_side || null,

      current_game: intValue(match.current_game, 1),

      games_p1: nonNegative(match.games_p1),
      games_p2: nonNegative(match.games_p2),

      g1_p1: nonNegative(match.g1_p1),
      g1_p2: nonNegative(match.g1_p2),
      g2_p1: nonNegative(match.g2_p1),
      g2_p2: nonNegative(match.g2_p2),
      g3_p1: nonNegative(match.g3_p1),
      g3_p2: nonNegative(match.g3_p2),

      created_at: match.created_at,
      updated_at: match.updated_at
    };
  }

  /*
   * Rebuilds game totals, current game, status and winner_side from the
   * stored game scores.
   *
   * This makes the scoring engine resilient to +1 and -1 operations.
   */
  function evaluate(match) {
    var next = cloneMatch(match);
    var stage = normalizeStage(next.stage);

    next.stage = stage;

    if (isShortSet(stage)) {
      // Single-set format only uses Game 1.
      next.g2_p1 = 0;
      next.g2_p2 = 0;
      next.g3_p1 = 0;
      next.g3_p2 = 0;

      next.games_p1 = 0;
      next.games_p2 = 0;
      next.current_game = 1;

      var singleWinner = getGameWinner(next, 1);

      if (singleWinner) {
        next.winner_side = singleWinner;
        next.status = 'finished';
      } else {
        next.winner_side = null;

        if (next.g1_p1 > 0 || next.g1_p2 > 0) {
          next.status = 'live';
        } else if (next.status !== 'walkover') {
          next.status = 'not_started';
        }
      }

      return next;
    }

    // Best-of-3 format.
    var gameWinners = [
      getGameWinner(next, 1),
      getGameWinner(next, 2),
      getGameWinner(next, 3)
    ];

    next.games_p1 = 0;
    next.games_p2 = 0;

    for (var i = 0; i < gameWinners.length; i++) {
      if (gameWinners[i] === 'p1') next.games_p1++;
      if (gameWinners[i] === 'p2') next.games_p2++;
    }

    var matchWinner = null;

    if (next.games_p1 >= 2) matchWinner = 'p1';
    if (next.games_p2 >= 2) matchWinner = 'p2';

    next.winner_side = matchWinner;

    if (matchWinner) {
      next.status = 'finished';
      next.current_game = getLastCompletedGame(next) || 1;
      return next;
    }

    next.current_game = getCurrentGame(next);

    if (totalPoints(next) > 0) {
      next.status = 'live';
    } else if (next.status !== 'walkover') {
      next.status = 'not_started';
    }

    return next;
  }

  /*
   * Positive delta:
   *   Adds a rally point to the current game.
   *
   * Negative delta:
   *   Removes the most recently played point.
   *   If the match/game was already finished, it automatically reopens it
   *   by undoing the last point from the latest played game.
   *
   * Returns:
   * {
   *   match: <new match>,
   *   changed: true/false,
   *   reason: <string>
   * }
   */
  function applyDelta(match, side, delta) {
    var next = cloneMatch(match);
    var stage = normalizeStage(next.stage);
    var change = delta > 0 ? 1 : delta < 0 ? -1 : 0;

    if (!change) {
      return {
        match: evaluate(next),
        changed: false,
        reason: 'No score change requested.'
      };
    }

    if (side !== 'p1' && side !== 'p2') {
      return {
        match: evaluate(next),
        changed: false,
        reason: 'Invalid scoring side.'
      };
    }

    /*
     * +1
     */
    if (change > 0) {
      if (String(next.status || '') === 'walkover') {
        return {
          match: evaluate(next),
          changed: false,
          reason: 'A walkover cannot receive score points.'
        };
      }

      if (getMatchWinner(next)) {
        return {
          match: evaluate(next),
          changed: false,
          reason: 'Match is already finished.'
        };
      }

      var currentGame = isBestOfThree(stage)
        ? getCurrentGame(next)
        : 1;

      var score = getGameScores(next, currentGame);
      var cap = getPointCap(stage);

      if (side === 'p1') {
        score.p1 = Math.min(cap, score.p1 + 1);
      } else {
        score.p2 = Math.min(cap, score.p2 + 1);
      }

      setGameScores(next, currentGame, score.p1, score.p2);

      if (next.status === 'not_started') {
        next.status = 'live';
      }

      return {
        match: evaluate(next),
        changed: true,
        reason: 'Point added.'
      };
    }

    /*
     * -1
     */
    var undoGame = 1;

    if (isBestOfThree(stage)) {
      /*
       * Undo the latest game with any points.
       *
       * This is important when:
       * - Game 1 just ended and current_game became 2.
       * - The match just ended.
       * - Game 2 or 3 was the last completed game.
       *
       * We always roll back the latest non-empty game.
       */
      for (var g = 3; g >= 1; g--) {
        if (gameHasAnyPoints(next, g)) {
          undoGame = g;
          break;
        }
      }
    }

    var undoScore = getGameScores(next, undoGame);

    if (side === 'p1') {
      if (undoScore.p1 <= 0) {
        return {
          match: evaluate(next),
          changed: false,
          reason: 'Player 1 score is already 0 in the latest game.'
        };
      }
      undoScore.p1--;
    } else {
      if (undoScore.p2 <= 0) {
        return {
          match: evaluate(next),
          changed: false,
          reason: 'Player 2 score is already 0 in the latest game.'
        };
      }
      undoScore.p2--;
    }

    setGameScores(next, undoGame, undoScore.p1, undoScore.p2);

    // A score edit can never remain a completed/walkover result after undo.
    next.winner_side = null;

    if (next.status === 'walkover') {
      next.status = 'live';
    }

    return {
      match: evaluate(next),
      changed: true,
      reason: 'Point removed.'
    };
  }

  /*
   * Returns the database columns that should be persisted.
   * This prevents callers from accidentally sending UI-only values.
   */
  function toUpdate(match) {
    var evaluated = evaluate(match);

    return {
      stage: normalizeStage(evaluated.stage),

      status: evaluated.status || 'not_started',
      winner_side: evaluated.winner_side || null,

      current_game: getCurrentGame(evaluated),

      games_p1: nonNegative(evaluated.games_p1),
      games_p2: nonNegative(evaluated.games_p2),

      g1_p1: nonNegative(evaluated.g1_p1),
      g1_p2: nonNegative(evaluated.g1_p2),
      g2_p1: nonNegative(evaluated.g2_p1),
      g2_p2: nonNegative(evaluated.g2_p2),
      g3_p1: nonNegative(evaluated.g3_p1),
      g3_p2: nonNegative(evaluated.g3_p2),

      updated_at: new Date().toISOString()
    };
  }

  function getStatusLabel(match) {
    if (String(match.status || '') === 'walkover') return 'W/O';

    var winner = getMatchWinner(match);
    if (winner) return 'FT';

    if (String(match.status || '') === 'live') return 'LIVE';

    return 'Upcoming';
  }

  function getWinnerName(match) {
    var winner = match.winner_side || getMatchWinner(match);

    if (winner === 'p1') return match.player1 || 'Player 1';
    if (winner === 'p2') return match.player2 || 'Player 2';

    return '';
  }

  function getScoreline(match) {
    var evaluated = evaluate(match);

    if (isShortSet(evaluated.stage)) {
      var single = getGameScores(evaluated, 1);

      return {
        mode: 'single',
        p1: single.p1,
        p2: single.p2,
        text: single.p1 + ' – ' + single.p2
      };
    }

    var current = getCurrentGame(evaluated);
    var currentScore = getGameScores(evaluated, current);
    var games = getGamesWon(evaluated);

    return {
      mode: 'best_of_3',
      p1: currentScore.p1,
      p2: currentScore.p2,
      current_game: current,
      games_p1: games.p1,
      games_p2: games.p2,
      text: currentScore.p1 + ' – ' + currentScore.p2,
      gamesText: games.p1 + ' – ' + games.p2
    };
  }

  /*
   * Data prepared for public/admin rendering.
   */
  function getDisplay(match) {
    var evaluated = evaluate(match);
    var info = getStageInfo(evaluated.stage);
    var scoreline = getScoreline(evaluated);
    var winner = evaluated.winner_side || getMatchWinner(evaluated);

    return {
      stage: info.key,
      stageLabel: info.label,
      stageShortLabel: info.shortLabel,

      format: info.format,
      formatDescription: info.description,

      bestOfThree: isBestOfThree(evaluated.stage),

      status: evaluated.status || 'not_started',
      statusLabel: getStatusLabel(evaluated),

      winnerSide: winner,
      winnerName: getWinnerName(evaluated),

      currentGame: getCurrentGame(evaluated),

      currentScoreP1: scoreline.p1,
      currentScoreP2: scoreline.p2,

      gamesP1: evaluated.games_p1,
      gamesP2: evaluated.games_p2,

      g1P1: evaluated.g1_p1,
      g1P2: evaluated.g1_p2,
      g2P1: evaluated.g2_p1,
      g2P2: evaluated.g2_p2,
      g3P1: evaluated.g3_p1,
      g3P2: evaluated.g3_p2,

      scoreText: scoreline.text,
      gamesText: scoreline.gamesText || '',

      finished: !!getMatchWinner(evaluated),
      totalPoints: totalPoints(evaluated)
    };
  }

  // Public API.
  window.BadmintonRules = {
    STAGES: STAGE_INFO,

    normalizeStage: normalizeStage,
    isShortSet: isShortSet,
    isBestOfThree: isBestOfThree,

    getStageInfo: getStageInfo,
    getStageLabel: getStageLabel,
    getFormatLabel: getFormatLabel,
    getFormatDescription: getFormatDescription,

    getGameScores: getGameScores,
    getGameWinner: getGameWinner,
    getCompletedGameWinners: getCompletedGameWinners,
    getGamesWon: getGamesWon,
    getMatchWinner: getMatchWinner,
    getCurrentGame: getCurrentGame,
    getCurrentScore: getCurrentScore,
    getOverallScore: getOverallScore,

    getPointCap: getPointCap,
    isMatchFinished: isMatchFinished,
    totalPoints: totalPoints,

    cloneMatch: cloneMatch,
    evaluate: evaluate,
    applyDelta: applyDelta,
    toUpdate: toUpdate,

    getStatusLabel: getStatusLabel,
    getWinnerName: getWinnerName,
    getScoreline: getScoreline,
    getDisplay: getDisplay
  };
})(window);
