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
          'Walkover can only be recorded before the match has started.\\n\\n' +
          'If points have already been entered, reset the match first.'
        );
        return;
      }
