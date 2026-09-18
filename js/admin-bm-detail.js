function renderBmDetail(m) {
  var p1 = Number(m.g1_p1) || 0;
  var p2 = Number(m.g1_p2) || 0;
  var id = String(m.id);
  var n1 = (m.player1 || 'P1').split(' ')[0];
  var n2 = (m.player2 || 'P2').split(' ')[0];
  var liveCls = m.status === 'live' ? 'bg-red-600 text-white' : 'bg-slate-700';
  var finCls = m.status === 'finished' ? 'bg-slate-500 text-white' : 'bg-slate-700';
  var upCls = m.status === 'not_started' ? 'bg-blue-600 text-white' : 'bg-slate-700';
  return [
    '<div class="bg-slate-800 rounded-2xl p-5 border border-slate-700">',
    '<div class="text-center mb-4">', bmStatusChip(m.status),
    '<div class="text-xs text-slate-400 mt-2">', (m.category || ''), '</div>',
    '<div class="font-bold text-lg mt-2">', (m.player1 || ''), '</div>',
    '<div class="text-4xl font-extrabold my-2">', p1, ' - ', p2, '</div>',
    '<div class="font-bold text-lg">', (m.player2 || ''), '</div></div>',
    '<div class="grid grid-cols-2 gap-3 mb-3">',
    '<button type="button" class="py-4 bg-green-500 text-slate-900 rounded-xl font-bold" data-bm="score" data-id="', id, '" data-side="p1" data-d="1">+1 ', n1, '</button>',
    '<button type="button" class="py-4 bg-green-500 text-slate-900 rounded-xl font-bold" data-bm="score" data-id="', id, '" data-side="p2" data-d="1">+1 ', n2, '</button></div>',
    '<div class="grid grid-cols-2 gap-3 mb-4">',
    '<button type="button" class="py-3 bg-slate-700 rounded-xl text-sm" data-bm="score" data-id="', id, '" data-side="p1" data-d="-1">-1 ', n1, '</button>',
    '<button type="button" class="py-3 bg-slate-700 rounded-xl text-sm" data-bm="score" data-id="', id, '" data-side="p2" data-d="-1">-1 ', n2, '</button></div>',
    '<div class="grid grid-cols-3 gap-2 mb-4">',
    '<button type="button" class="py-3 rounded-xl text-sm font-semibold ', upCls, '" data-bm="status" data-id="', id, '" data-status="not_started">Upcoming</button>',
    '<button type="button" class="py-3 rounded-xl text-sm font-semibold ', liveCls, '" data-bm="status" data-id="', id, '" data-status="live">LIVE</button>',
    '<button type="button" class="py-3 rounded-xl text-sm font-semibold ', finCls, '" data-bm="status" data-id="', id, '" data-status="finished">Finished</button></div>',
    '<div class="flex justify-between text-sm">',
    '<button type="button" class="text-slate-400 underline" data-bm="reset" data-id="', id, '">Reset score</button>',
    '<button type="button" class="text-red-400 underline" data-bm="delete" data-id="', id, '">Delete</button></div></div>'
  ].join('');
}

document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-bm]');
  if (!btn) return;
  var kind = btn.getAttribute('data-bm');
  var id = btn.getAttribute('data-id');
  if (kind === 'score' && typeof bmScore === 'function') {
    bmScore(id, btn.getAttribute('data-side'), Number(btn.getAttribute('data-d')));
  } else if (kind === 'status' && typeof bmStatus === 'function') {
    bmStatus(id, btn.getAttribute('data-status'));
  } else if (kind === 'reset' && typeof bmReset === 'function') {
    bmReset(id);
  } else if (kind === 'delete' && typeof bmDelete === 'function') {
    bmDelete(id);
  }
});
