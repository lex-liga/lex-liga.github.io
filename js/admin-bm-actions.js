/* Lex Liga Badminton Admin Actions — scoring controls + add match */
(function () {
  'use strict';

  function sbClient() {
    return window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  }

  function requireRules() {
    if (!window.BadmintonRules) {
      alert('Scoring rules not loaded. Refresh the page.');
      return null;
    }
    return window.BadmintonRules;
  }

  function refreshAdmin() {
    if (typeof window.loadBadmintonAdmin === 'function') {
      window.loadBadmintonAdmin();
    }
  }

  window.addBadmintonMatch = async function () {
    var p1El = document.getElementById('bmP1');
    var p2El = document.getElementById('bmP2');
    var catEl = document.getElementById('bmCategory');
    var stageEl = document.getElementById('bmStage');
    var formatEl = document.getElementById('bmFormat');

    var p1 = ((p1El && p1El.value) || '').trim();
    var p2 = ((p2El && p2El.value) || '').trim();
    var cat = ((catEl && catEl.value) || '').trim();
    var stage = ((stageEl && stageEl.value) || 'round1').trim().toLowerCase();
    var format = ((formatEl && formatEl.value) || 'auto').trim().toLowerCase();

    var r = requireRules();
    if (!r) return;

    stage = r.normalizeStage(stage);
    if (typeof r.resolveFormatStage === 'function') {
      stage = r.resolveFormatStage(stage, format);
    }

    if (!p1 || !p2) {
      alert('Enter both players / pairs.');
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
        category: cat || 'MS · R1',
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

      var ins = await sb.from('badminton_matches').insert(insertPayload);
      if (ins.error) {
        alert('Could not add match:\n' + ins.error.message);
        return;
      }

      if (p1El) p1El.value = '';
      if (p2El) p2El.value = '';
      if (catEl) catEl.selectedIndex = 0;
      if (stageEl) stageEl.value = 'round1';
      if (formatEl) formatEl.value = 'auto';

      if (typeof selectedBmId !== 'undefined') selectedBmId = null;
      refreshAdmin();
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  function bindBmAddBtn() {
    var btn = document.getElementById('bmAddBtn');
    if (!btn || btn.dataset.boundAdd === '1') return;
    btn.dataset.boundAdd = '1';
    btn.addEventListener('click', function () {
      window.addBadmintonMatch();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindBmAddBtn);
  } else {
    bindBmAddBtn();
  }
  setInterval(bindBmAddBtn, 2000);
})();
