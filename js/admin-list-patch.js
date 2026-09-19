/* Patch futsal admin: list matches, open one for controls, back button */
(function () {
  var selectedMatchId = null;
  var cachedMatches = [];

  function statusChip(status) {
    var map = {
      not_started: ['Upcoming', 'bg-blue-600/30 text-blue-300'],
      live: ['LIVE', 'bg-red-600 text-white'],
      half_time: ['HT', 'bg-orange-600 text-white'],
      extra_time: ['ET', 'bg-purple-600 text-white'],
      penalties: ['PENS', 'bg-amber-500 text-slate-900'],
      finished: ['FT', 'bg-slate-600 text-slate-200'],
      walkover: ['WO', 'bg-slate-600 text-slate-200']
    };

    var pair =
      map[status] || [
        status || '?',
        'bg-slate-700 text-slate-300'
      ];

    return (
      '<span class="text-[11px] font-bold px-2 py-0.5 rounded-full ' +
      pair[1] +
      '">' +
      pair[0] +
      '</span>'
    );
  }

  function findFutsalAddBox() {
    var box =
      document.getElementById(
        'futsalAddBox'
      );

    if (box) return box;

    var panel =
      document.getElementById(
        'adminPanelFutsal'
      );

    if (!panel) return null;

    var found = null;

    panel
      .querySelectorAll('.bg-slate-800')
      .forEach(function (c) {
        if (c.querySelector('#addMatchBtn')) {
          found = c;
        }
      });

    return found;
  }

  function setAddVisible(show) {
    var box = findFutsalAddBox();

    if (box) {
      box.classList.toggle(
        'hidden',
        !show
      );
    }

    var title =
      document.getElementById(
        'futsalListTitle'
      );

    if (title) {
      title.textContent =
        selectedMatchId
          ? 'Control match'
          : 'Matches';
    }
  }

  window.showMatchList =
    function () {
      selectedMatchId = null;
      setAddVisible(true);

      if (
        typeof window.loadAdminData ===
        'function'
      ) {
        window.loadAdminData();
      }
    };

  window.openFutsalMatch =
    function (id) {
      selectedMatchId = id;
      setAddVisible(false);

      if (
        typeof window.loadAdminData ===
        'function'
      ) {
        window.loadAdminData();
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

  function renderListRow(m) {
    var home =
      typeof getTeamName === 'function'
        ? getTeamName(m.home_team_id)
        : 'Home';

    var away =
      typeof getTeamName === 'function'
        ? getTeamName(m.away_team_id)
        : 'Away';

    var hs =
      Number(m.home_score) || 0;

    var as =
      Number(m.away_score) || 0;

    var pensOn =
      !!m.pens_on ||
      m.status === 'penalties';

    var ph =
      Number(m.pen_home) || 0;

    var pa =
      Number(m.pen_away) || 0;

    var penLine =
      pensOn
        ? '<div class="text-[11px] text-amber-400 font-semibold">Pens ' +
          ph +
          '-' +
          pa +
          (m.pens_sudden ? ' · SD' : '') +
          '</div>'
        : '';

    return (
      '<button type="button" onclick="openFutsalMatch(\'' +
      m.id +
      '\')" class="w-full text-left bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">' +

        '<div class="flex justify-between mb-1">' +

          statusChip(m.status) +

          '<span class="text-[11px] text-slate-500">' +
            (m.group_name || '') +
          '</span>' +

        '</div>' +

        '<div class="flex items-center gap-2">' +

          '<span class="flex-1 text-sm font-semibold text-right truncate">' +
            home +
          '</span>' +

          '<span class="text-lg font-extrabold">' +
            hs +
            '-' +
            as +
          '</span>' +

          '<span class="flex-1 text-sm font-semibold truncate">' +
            away +
          '</span>' +

        '</div>' +

        penLine +

        '<div class="text-[11px] text-green-400 text-center mt-1">' +
          'Open controls' +
        '</div>' +

      '</button>'
    );
  }

  function groupLabel(g) {
    var t =
      String(g || '').trim();

    if (!t) {
      return 'Uncategorized';
    }

    var u =
      t.toUpperCase();

    if (
      u.indexOf('FINAL') >= 0 &&
      u.indexOf('SEMI') < 0 &&
      u.indexOf('QF') < 0 &&
      u.indexOf('QUARTER') < 0
    ) {
      return 'Final';
    }

    if (
      u.indexOf('SF') >= 0 ||
      u.indexOf('SEMI') >= 0
    ) {
      return 'Semi-finals';
    }

    if (
      u.indexOf('QF') >= 0 ||
      u.indexOf('QUARTER') >= 0
    ) {
      return 'Quarter-finals';
    }

    if (
      u.indexOf('GROUP') >= 0
    ) {
      if (
        u === 'GROUP A' ||
        u === 'GROUP B' ||
        u === 'GROUP C' ||
        u === 'GROUP D' ||
        u === 'GROUP E'
      ) {
        return (
          'Group ' +
          u.replace(
            'GROUP ',
            ''
          )
        );
      }

      return t;
    }

    if (
      u.indexOf('FIXTURE') >= 0
    ) {
      return 'Fixtures';
    }

    return t;
  }

  function groupOrder(label) {
    var order = [
      'Fixtures',
      'Group A',
      'Group B',
      'Group C',
      'Group D',
      'Group E',
      'Quarter-finals',
      'Semi-finals',
      'Final'
    ];

    var i =
      order.indexOf(label);

    if (i >= 0) {
      return i;
    }

    return 50;
  }

  function statusOrder(s) {
    if (
      s === 'live' ||
      s === 'half_time' ||
      s === 'extra_time' ||
      s === 'penalties'
    ) {
      return 0;
    }

    if (
      s === 'not_started'
    ) {
      return 1;
    }

    return 2;
  }

  window.loadAdminData =
    async function () {
      var container =
        document.getElementById(
          'adminMatches'
        );

      if (!container) {
        return;
      }

      if (!selectedMatchId) {
        container.innerHTML =
          '<p class="text-slate-400 text-sm text-center py-8">' +
          'Loading matches...' +
          '</p>';
      }

      var sb =
        window.supabaseClient ||
        window.supabase ||
        (
          typeof supabase !== 'undefined'
            ? supabase
            : null
        );

      if (
        !sb ||
        typeof sb.from !== 'function'
      ) {
        container.innerHTML =
          '<p class="text-red-400 text-sm text-center">' +
          'Supabase not ready' +
          '</p>';

        return;
      }

      try {
        var teamsRes =
          await sb
            .from('teams')
            .select('*')
            .order('name');

        if (teamsRes.error) {
          throw teamsRes.error;
        }

        if (
          typeof allTeams !==
          'undefined'
        ) {
          allTeams =
            teamsRes.data || [];
        } else {
          window.allTeams =
            teamsRes.data || [];
        }

        var homeSelect =
          document.getElementById(
            'newHome'
          );

        var awaySelect =
          document.getElementById(
            'newAway'
          );

        if (
          homeSelect &&
          awaySelect &&
          teamsRes.data
        ) {
          var opts =
            teamsRes.data
              .map(function (t) {
                return (
                  '<option value="' +
                  t.id +
                  '">' +
                  t.name +
                  '</option>'
                );
              })
              .join('');

          homeSelect.innerHTML =
            opts;

          awaySelect.innerHTML =
            opts;
        }

        var matchesRes =
          await sb
            .from('matches')
            .select('*')
            .order(
              'kickoff_time',
              {
                ascending: true
              }
            );

        if (matchesRes.error) {
          throw matchesRes.error;
        }

        cachedMatches =
          matchesRes.data || [];

        var goalsRes =
          await sb
            .from('goals')
            .select('*');

        if (
          typeof allGoals !==
          'undefined'
        ) {
          allGoals =
            goalsRes.data || [];
        }

        try {
          var cardsRes =
            await sb
              .from('cards')
              .select('*');

          if (
            typeof allCards !==
            'undefined'
          ) {
            allCards =
              cardsRes.data || [];
          }
        } catch (e) {}

        if (selectedMatchId) {
          var m =
            cachedMatches.find(
              function (x) {
                return (
                  String(x.id) ===
                  String(
                    selectedMatchId
                  )
                );
              }
            );

          if (!m) {
            selectedMatchId = null;
            setAddVisible(true);

            return window.loadAdminData();
          }

          setAddVisible(false);

          var cardHtml =
            typeof renderAdminCard ===
            'function'
              ? renderAdminCard(m)
              : '<p>Controls unavailable</p>';

          container.innerHTML =
            '<button type="button" onclick="showMatchList()" class="flex items-center gap-2 text-sm text-green-400 font-semibold mb-4">' +
              '<span class="text-lg">&larr;</span>' +
              ' Back to matches' +
            '</button>' +
            cardHtml;

          return;
        }

        setAddVisible(true);

        if (!cachedMatches.length) {
          container.innerHTML =
            '<p class="text-slate-400 text-sm text-center py-6">' +
            'No matches yet.<br>Add one below.' +
            '</p>';

          return;
        }

        var byGroup = {};

        cachedMatches.forEach(
          function (m) {
            var lab =
              groupLabel(
                m.group_name
              );

            if (!byGroup[lab]) {
              byGroup[lab] = [];
            }

            byGroup[lab].push(m);
          }
        );

        var groups =
          Object.keys(byGroup)
            .sort(
              function (a, b) {
                return (
                  groupOrder(a) -
                  groupOrder(b)
                );
              }
            );

        var html = '';

        groups.forEach(
          function (lab) {
            var list =
              byGroup[lab]
                .slice()
                .sort(
                  function (a, b) {
                    return (
                      statusOrder(
                        a.status
                      ) -
                      statusOrder(
                        b.status
                      )
                    );
                  }
                );

            var liveN =
              list.filter(
                function (m) {
                  return (
                    m.status ===
                      'live' ||
                    m.status ===
                      'half_time' ||
                    m.status ===
                      'extra_time' ||
                    m.status ===
                      'penalties'
                  );
                }
              ).length;

            var upN =
              list.filter(
                function (m) {
                  return (
                    m.status ===
                    'not_started'
                  );
                }
              ).length;

            html +=
              '<div class="mt-5 first:mt-0">' +

                '<div class="flex items-center justify-between mb-2">' +

                  '<p class="text-sm font-extrabold text-green-400">' +
                    lab +
                  '</p>' +

                  '<span class="text-[11px] text-slate-500">' +
                    list.length +
                    ' · ' +
                    (
                      liveN
                        ? liveN +
                          ' live · '
                        : ''
                    ) +
                    upN +
                    ' up' +
                  '</span>' +

                '</div>' +

                '<div class="space-y-2">' +
                  list
                    .map(renderListRow)
                    .join('') +
                '</div>' +

              '</div>';
          }
        );

        html +=
          '<p class="text-xs text-slate-500 text-center pt-3">' +
          'Tap a match to control scores' +
          '</p>';

        container.innerHTML =
          html;

      } catch (err) {
        console.error(err);

        container.innerHTML =
          '<p class="text-red-400 text-sm text-center">' +
          'Error: ' +
          (err.message || err) +
          '</p>';
      }
    };

  setTimeout(
    function () {
      var panel =
        document.getElementById(
          'adminPanelFutsal'
        );

      if (
        !panel ||
        panel.classList.contains(
          'hidden'
        )
      ) {
        return;
      }

      if (
        typeof window.loadAdminData ===
        'function'
      ) {
        window.loadAdminData();
      }
    },
    300
  );
})();
