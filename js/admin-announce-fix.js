/* Load futsal list/detail patch on admin page */
(function () {
  if (document.querySelector('script[src*="admin-list-patch"]')) return;
  var s = document.createElement('script');
  s.src = 'js/admin-list-patch.js?v=2';
  document.body.appendChild(s);
})();

/* Patch announce admin to allow multiple LIVE messages */
(function () {
  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>');
  }

  window.renderHistoryItem = function (row) {
    var active = row.active
      ? '<span class="text-green-400 text-xs font-bold">LIVE</span>'
      : '<span class="text-slate-500 text-xs">off</span>';
    var id = row.id;
    return (
      '<div class="bg-slate-900 border border-slate-700 rounded-xl p-3 flex gap-3 items-start">' +
      '<div class="flex-1 min-w-0">' +
      '<p class="text-sm break-words">' +
      escapeHtml(row.message || '') +
      '</p>' +
      '<p class="text-xs text-slate-500 mt-1">' +
      active +
      ' · ' +
      (row.created_at ? new Date(row.created_at).toLocaleString() : '') +
      '</p></div>' +
      '<div class="flex flex-col gap-1 shrink-0">' +
      (row.active
        ? '<button type="button" class="text-xs text-slate-400" onclick="deactivateAnnounce(' +
          id +
          ')">Hide</button>'
        : '<button type="button" class="text-xs text-green-400" onclick="activateAnnounce(' +
          id +
          ')">Show</button>') +
      '<button type="button" class="text-xs text-red-400" onclick="deleteAnnounce(' +
      id +
      ')">Delete</button></div></div>'
    );
  };

  window.publishAnnounce = async function () {
    var sb = window.supabaseClient;
    var msg = document.getElementById('annMsg').value.trim();
    var active = document.getElementById('annActive').checked;
    var st = document.getElementById('annStatus');
    if (!msg) {
      st.textContent = 'Enter a message';
      st.className = 'text-sm text-center text-red-400';
      return;
    }
    st.textContent = 'Saving…';
    var res = await sb.from('announcements').insert({
      message: msg,
      active: active,
      created_at: new Date().toISOString()
    });
    if (res.error) {
      var u = await sb.from('announcements').upsert({
        id: 1,
        message: msg,
        active: active,
        updated_at: new Date().toISOString()
      });
      if (u.error) {
        st.textContent = 'Error: ' + (res.error.message || u.error.message);
        st.className = 'text-sm text-center text-red-400';
        return;
      }
    }
    st.textContent = 'Published. Live site updates within ~20s.';
    st.className = 'text-sm text-center text-green-400';
    document.getElementById('annMsg').value = '';
    if (typeof loadAnnounceAdmin === 'function') loadAnnounceAdmin();
  };

  window.activateAnnounce = async function (id) {
    var sb = window.supabaseClient;
    await sb.from('announcements').update({ active: true }).eq('id', id);
    if (typeof loadAnnounceAdmin === 'function') loadAnnounceAdmin();
  };

  window.deactivateAnnounce = async function (id) {
    var sb = window.supabaseClient;
    await sb.from('announcements').update({ active: false }).eq('id', id);
    if (typeof loadAnnounceAdmin === 'function') loadAnnounceAdmin();
  };

  window.deleteAnnounce = async function (id) {
    if (!confirm('Delete this announcement?')) return;
    var sb = window.supabaseClient;
    var res = await sb.from('announcements').delete().eq('id', id);
    if (res.error) alert(res.error.message);
    if (typeof loadAnnounceAdmin === 'function') loadAnnounceAdmin();
  };
})();
