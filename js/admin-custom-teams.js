/* Lex Liga – free-text team names + Women group on Add Match */
(function () {
  function enhanceForm() {
    var home = document.getElementById('newHome');
    var away = document.getElementById('newAway');
    var group = document.getElementById('newGroup');
    if (!home || !away || !group) return;

    if (!document.getElementById('newHomeCustom')) {
      var hi = document.createElement('input');
      hi.id = 'newHomeCustom';
      hi.type = 'text';
      hi.placeholder = 'Or type a new team name (e.g. girls team)';
      hi.className = 'w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 mb-3 text-base';
      home.insertAdjacentElement('afterend', hi);
    }
    if (!document.getElementById('newAwayCustom')) {
      var ai = document.createElement('input');
      ai.id = 'newAwayCustom';
      ai.type = 'text';
      ai.placeholder = 'Or type a new team name';
      ai.className = 'w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 mb-3 text-base';
      away.insertAdjacentElement('afterend', ai);
    }

    if (!Array.from(group.options).some(function (o) { return o.value === 'Women'; })) {
      var opt = document.createElement('option');
      opt.value = 'Women';
      opt.textContent = 'Women';
      // insert after Group B if present
      var after = null;
      for (var i = 0; i < group.options.length; i++) {
        if (group.options[i].value === 'Group B') after = group.options[i];
      }
      if (after && after.nextSibling) group.insertBefore(opt, after.nextSibling);
      else group.appendChild(opt);
    }
  }

  async function resolveTeamId(selectEl, customEl, groupName) {
    var sb = window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    var custom = (customEl && customEl.value || '').trim();
    if (custom) {
      var teams = (typeof allTeams !== 'undefined' && allTeams) ? allTeams : [];
      var existing = teams.find(function (t) {
        return String(t.name || '').toLowerCase() === custom.toLowerCase();
      });
      if (existing) return existing.id;
      if (!sb || typeof sb.from !== 'function') throw new Error('Supabase not ready');
      var res = await sb.from('teams').insert({ name: custom, group_name: groupName || null }).select().single();
      if (res.error) throw res.error;
      if (typeof allTeams !== 'undefined' && res.data) allTeams.push(res.data);
      return res.data.id;
    }
    return selectEl ? selectEl.value : '';
  }

  function rebindAddMatch() {
    var btn = document.getElementById('addMatchBtn');
    if (!btn || btn.dataset.customTeamsBound === '1') return;
    btn.dataset.customTeamsBound = '1';

    // clone to drop previous listeners
    var next = btn.cloneNode(true);
    btn.parentNode.replaceChild(next, btn);
    next.dataset.customTeamsBound = '1';

    next.addEventListener('click', async function () {
      var sb = window.supabaseClient || window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
      if (!sb) {
        alert('Supabase not ready');
        return;
      }
      var groupEl = document.getElementById('newGroup');
      var group = (groupEl && groupEl.value || '').trim();
      var home, away;
      try {
        home = await resolveTeamId(
          document.getElementById('newHome'),
          document.getElementById('newHomeCustom'),
          group
        );
        away = await resolveTeamId(
          document.getElementById('newAway'),
          document.getElementById('newAwayCustom'),
          group
        );
      } catch (err) {
        alert((err && err.message) || 'Could not create team');
        return;
      }
      if (!home || !away) {
        alert('Pick or type both teams');
        return;
      }
      if (home === away) {
        alert('Please choose two different teams');
        return;
      }
      var res = await sb.from('matches').insert({
        home_team_id: home,
        away_team_id: away,
        group_name: group || null,
        status: 'not_started',
        home_score: 0,
        away_score: 0,
        kickoff_time: new Date().toISOString()
      });
      if (res.error) {
        alert(res.error.message);
        return;
      }
      var hc = document.getElementById('newHomeCustom');
      var ac = document.getElementById('newAwayCustom');
      if (hc) hc.value = '';
      if (ac) ac.value = '';
      if (groupEl && groupEl.tagName === 'SELECT') groupEl.selectedIndex = 0;
      if (typeof loadAdminData === 'function') loadAdminData();
      else if (typeof window.loadAdminData === 'function') window.loadAdminData();
    });
  }

  function boot() {
    enhanceForm();
    rebindAddMatch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 300);
    });
  } else {
    setTimeout(boot, 300);
  }
  // also after futsal panel opens
  setInterval(function () {
    if (document.getElementById('newHome') && !document.getElementById('newHomeCustom')) {
      boot();
    }
  }, 1500);
})();
