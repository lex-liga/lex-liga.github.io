// Lex Liga Badminton Admin — scoring, match status, walkovers and CRUD
// Requires js/badminton-rules.js to be loaded before this file.

(function () {
  'use strict';

  function sbClient() {
    return typeof getSb === 'function'
      ? getSb()
      : (window.supabaseClient ||
         window.supabase ||
         (typeof supabase !== 'undefined' ? supabase : null));
  }

  function rules() {
    return window.BadmintonRules || null;
  }

  function requireRules() {
    var r = rules();

    if (!r) {
      alert(
        'Badminton scoring engine is not loaded yet.\n\n' +
        'Please make sure js/badminton-rules.js is loaded before the Badminton admin scripts.'
      );
      return null;
    }

    return r;
  }

  async function fetchMatch(id) {
    var sb = sbClient();

    if (!sb || typeof sb.from !== 'function') {
      throw new Error('Supabase not ready');
    }

    var res = await sb
      .from('badminton_matches')
      .select('*')
      .eq('id', id)
      .single();

    if (res.error) throw res.error;
    if (!res.data) throw new Error('Match not found');

    return res.data;
  }

  async function saveMatch(match) {
    var r = requireRules();

    if (!r) return false;

    var sb = sbClient();

    if (!sb || typeof sb.from !== 'function') {
      alert('Supabase not ready');
      return false;
    }

    var update = r.toUpdate(match);

    var res = await sb
      .from('badminton_matches')
      .update(update)
      .eq('id', match.id);

    if (res.error) {
      alert(res.error.message || 'Could not save match');
      return false;
    }

    return true;
  }

  function refreshAdmin() {
    if (typeof loadBadmintonAdmin === 'function') {
      loadBadmintonAdmin();
    }
  }

  /*
   * Score +1 / -1.
   *
   * +1:
   *   Adds a rally point to the current game.
   *
   * -1:
   *   Removes a point from the latest non-empty game.
   *
   * The scoring engine then recalculates:
   *   - game winner(s)
   *   - games won
   *   - current game
   *   - match winner
   *   - status
   *   - winner_side
   */
  window.bmScore = async function (id, side, delta) {
    var r = requireRules();

    if (!r) return;

    if (side !== 'p1' && side !== 'p2') {
      alert('Invalid player side.');
      return;
    }

    var amount = Number(delta);

    if (amount !== 1 && amount !== -1) {
      alert('Invalid score change.');
      return;
    }

    try {
      var match = await fetchMatch(id);

      if (match.status === 'walkover') {
        alert(
          'This match is recorded as a walkover. ' +
          'Reset the match before entering scores.'
        );
        return;
      }

      var result = r.applyDelta(
        match,
        side,
        amount
      );

      if (!result.changed) {
        alert(
          result.reason ||
          'Score could not be changed.'
        );
        return;
      }

      if (await saveMatch(result.match)) {
        refreshAdmin();
      }
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  /*
   * Reset everything back to a fresh upcoming match.
   */
  window.bmReset = async function (id) {
    if (!confirm(
      'Reset this badminton match?\n\n' +
      'All scores, game results, winner and walkover status will be cleared.'
    )) {
      return;
    }

    var sb = sbClient();

    if (!sb || typeof sb.from !== 'function') {
      alert('Supabase not ready');
      return;
    }

    var r = requireRules();

    if (!r) return;

    try {
      var match = await fetchMatch(id);

      var reset = r.cloneMatch(match);

      reset.status = 'not_started';
      reset.winner_side = null;

      reset.current_game = 1;

      reset.games_p1 = 0;
      reset.games_p2 = 0;

      reset.g1_p1 = 0;
      reset.g1_p2 = 0;
      reset.g2_p1 = 0;
      reset.g2_p2 = 0;
      reset.g3_p1 = 0;
      reset.g3_p2 = 0;

      reset.stage =
        r.normalizeStage(match.stage);

      var update = {
        stage: reset.stage,
        status: 'not_started',
        winner_side: null,

        current_game: 1,

        games_p1: 0,
        games_p2: 0,

        g1_p1: 0,
        g1_p2: 0,
        g2_p1: 0,
        g2_p2: 0,
        g3_p1: 0,
        g3_p2: 0,

        updated_at:
          new Date().toISOString()
      };

      var up = await sb
        .from('badminton_matches')
        .update(update)
        .eq('id', id);

      if (up.error) {
        alert(up.error.message);
        return;
      }

      refreshAdmin();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  /*
   * Manual status control.
   *
   * Upcoming -> not_started
   * LIVE     -> live
   *
   * Finished is rule-aware:
   * the engine must have a valid winner.
   */
  window.bmStatus = async function (id, status) {
    var r = requireRules();

    if (!r) return;

    var sb = sbClient();

    if (!sb || typeof sb.from !== 'function') {
      alert('Supabase not ready');
      return;
    }

    try {
      var match = await fetchMatch(id);

      if (status === 'finished') {
        var evaluated =
          r.evaluate(match);

        var winner =
          r.getMatchWinner(evaluated);

        if (!winner) {
          alert(
            'This match has not reached a valid winning score yet.\n\n' +
            'Use the score controls to finish the match automatically.'
          );
          return;
        }

        var finishedUpdate =
          r.toUpdate(evaluated);

        var finishedRes =
          await sb
            .from('badminton_matches')
            .update(finishedUpdate)
            .eq('id', id);

        if (finishedRes.error) {
          alert(finishedRes.error.message);
          return;
        }

        refreshAdmin();
        return;
      }

      if (
        status !== 'not_started' &&
        status !== 'live'
      ) {
        alert('Invalid badminton status.');
        return;
      }

      /*
       * Re-evaluate existing scores first.
       * This prevents a manually selected status
       * from wiping winner_side or game totals.
       */
      var next = r.evaluate(match);

      /*
       * If the score already produces a finished
       * match, do not allow it to be changed to
       * LIVE/Upcoming accidentally.
       */
      var existingWinner =
        r.getMatchWinner(next);

      if (existingWinner) {
        alert(
          'This match has already finished ' +
          'under the official scoring rules.\n\n' +
          'Reset the match if you need to start it again.'
        );
        return;
      }

      next.status = status;

      var update = r.toUpdate(next);

      var res = await sb
        .from('badminton_matches')
        .update(update)
        .eq('id', id);

      if (res.error) {
        alert(res.error.message);
        return;
      }

      refreshAdmin();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  /*
   * Record a walkover.
   *
   * IMPORTANT:
   * A match that has already finished with a
   * valid score cannot be changed into a walkover.
   *
   * side:
   *   p1 -> Player/Pair 1 receives the walkover
   *   p2 -> Player/Pair 2 receives the walkover
   */
  window.bmWalkover = async function (id, side) {
    if (
      side !== 'p1' &&
      side !== 'p2'
    ) {
      alert('Invalid walkover winner.');
      return;
    }

    var sb = sbClient();

    if (!sb || typeof sb.from !== 'function') {
      alert('Supabase not ready');
      return;
    }

    var r = requireRules();

    if (!r) return;

    try {
      var match = await fetchMatch(id);

      /*
       * Hard block for an existing walkover.
       */
      if (match.status === 'walkover') {
        alert(
          'This match is already recorded as a walkover.'
        );
        return;
      }

      /*
       * Hard block for a score-completed match.
       *
       * We evaluate the score itself instead of relying
       * only on status, because winner_side/status could
       * have been manually changed earlier.
       */
      var evaluated =
        r.evaluate(match);

      var existingWinner =
        r.getMatchWinner(evaluated);

      /*
       * Walkover is only valid before scoring has begun.
       * A match with any recorded points must be played
       * out or reset; it cannot become a walkover.
       */
      if (
        match.status !== 'not_started' ||
        r.totalPoints(evaluated) > 0 ||
        existingWinner
      ) {
        alert(
          'Walkover can only be recorded before the match has started.\n\n' +
          'If points have already been entered, reset the match first.'
        );
        return;
      }

      var winnerName =
        side === 'p1'
          ? (match.player1 ||
             'Player / Pair 1')
          : (match.player2 ||
             'Player / Pair 2');

      if (!confirm(
        'Record a walkover for:\n\n' +
        winnerName +
        '\n\n' +
        'This will mark the match as W/O and record the winner.'
      )) {
        return;
      }

      var update = {
        status: 'walkover',
        winner_side: side,
        updated_at:
          new Date().toISOString()
      };

      var res = await sb
        .from('badminton_matches')
        .update(update)
        .eq('id', id);

      if (res.error) {
        alert(res.error.message);
        return;
      }

      refreshAdmin();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  /*
   * Clear a walkover.
   *
   * The stored score is preserved only when it does not
   * already represent a completed match. Otherwise the
   * admin is instructed to reset the match, avoiding an
   * inconsistent "Upcoming" record with a winning score.
   */
  window.bmClearWalkover = async function (id) {
    var sb = sbClient();

    if (!sb || typeof sb.from !== 'function') {
      alert('Supabase not ready');
      return;
    }

    try {
      var match = await fetchMatch(id);

      if (match.status !== 'walkover') {
        alert(
          'This match is not currently a walkover.'
        );
        return;
      }

      if (!confirm(
        'Clear the walkover result and return this match to Upcoming?\n\n' +
        'The existing score will be preserved.'
      )) {
        return;
      }

      var r = requireRules();

      if (!r) return;

      var next =
        r.cloneMatch(match);

      next.winner_side = null;

      var evaluated =
        r.evaluate(next);

      var scoreWinner =
        r.getMatchWinner(evaluated);

      /*
       * If the stored score itself is a winning result,
       * the admin should reset rather than create an
       * invalid upcoming match.
       */
      if (scoreWinner) {
        alert(
          'This match contains a completed winning score.\n\n' +
          'Use Reset match if you want to start it again.'
        );
        return;
      }

      var update = {
        stage:
          r.normalizeStage(match.stage),

        status: 'not_started',
        winner_side: null,

        current_game:
          r.getCurrentGame(evaluated),

        games_p1:
          evaluated.games_p1,

        games_p2:
          evaluated.games_p2,

        g1_p1:
          evaluated.g1_p1,

        g1_p2:
          evaluated.g1_p2,

        g2_p1:
          evaluated.g2_p1,

        g2_p2:
          evaluated.g2_p2,

        g3_p1:
          evaluated.g3_p1,

        g3_p2:
          evaluated.g3_p2,

        updated_at:
          new Date().toISOString()
      };

      var res = await sb
        .from('badminton_matches')
        .update(update)
        .eq('id', id);

      if (res.error) {
        alert(res.error.message);
        return;
      }

      refreshAdmin();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  /*
   * Delete match.
   */
  window.bmDelete = async function (id) {
    if (!confirm(
      'Delete this badminton match permanently?\n\n' +
      'This cannot be undone.'
    )) {
      return;
    }

    var sb = sbClient();

    if (!sb || typeof sb.from !== 'function') {
      alert('Supabase not ready');
      return;
    }

    try {
      var up = await sb
        .from('badminton_matches')
        .delete()
        .eq('id', id);

      if (up.error) {
        alert(up.error.message);
        return;
      }

      window.selectedBmId = null;

      if (typeof selectedBmId !== 'undefined') {
        selectedBmId = null;
      }

      refreshAdmin();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  /*
   * Add a new badminton match.
   */
  window.addBadmintonMatch = async function () {
    var p1El =
      document.getElementById('bmP1');

    var p2El =
      document.getElementById('bmP2');

    var catEl =
      document.getElementById('bmCategory');

    var stageEl =
      document.getElementById('bmStage');

    var p1 =
      ((p1El && p1El.value) || '')
        .trim();

    var p2 =
      ((p2El && p2El.value) || '')
        .trim();

    var cat =
      ((catEl && catEl.value) || '')
        .trim();

    var stage =
      ((stageEl && stageEl.value) ||
       'round1')
        .trim()
        .toLowerCase();

    var r = requireRules();

    if (!r) return;

    stage =
      r.normalizeStage(stage);

    if (!p1 || !p2) {
      alert(
        'Enter both players / pairs.'
      );
      return;
    }

    var sb = sbClient();

    if (!sb || typeof sb.from !== 'function') {
      alert('Supabase not ready');
      return;
    }

    try {
      var insertPayload = {
        player1: p1,
        player2: p2,

        category:
          cat || 'MS · R1',

        stage: stage,

        status: 'not_started',
        winner_side: null,

        current_game: 1,

        games_p1: 0,
        games_p2: 0,

        g1_p1: 0,
        g1_p2: 0,

        g2_p1: 0,
        g2_p2: 0,

        g3_p1: 0,
        g3_p2: 0
      };

      var ins = await sb
        .from('badminton_matches')
        .insert(insertPayload);

      if (ins.error) {
        alert(
          'Could not add match:\n' +
          ins.error.message
        );
        return;
      }

      if (p1El) {
        p1El.value = '';
      }

      if (p2El) {
        p2El.value = '';
      }

      if (catEl) {
        catEl.selectedIndex = 0;
      }

      if (stageEl) {
        stageEl.value = 'round1';
      }

      if (typeof selectedBmId !== 'undefined') {
        selectedBmId = null;
      }

      refreshAdmin();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

})();
