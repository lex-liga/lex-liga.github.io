function renderBmDetail(m) {
  var p1 = Number(m.g1_p1) || 0, p2 = Number(m.g1_p2) || 0;
  var id = m.id;
  var n1 = (m.player1 || 'P1').split(' ')[0];
  var n2 = (m.player2 || 'P2').split(' ')[0];
  var liveCls = m.status === 'live' ? 'bg-red-600 text-white' : 'bg-slate-700';
  var finCls = m.status === 'finished' ? 'bg-slate-500 text-white' : 'bg-slate-700';
  var upCls = m.status === 'not_started' ? 'bg-blue-600 text-white' : 'bg-slate-700';
  return '<div class="bg-slate-800 rounded-2xl p-5 border border-slate-700">' +
    '<div class="text-center mb-4">' + bmStatusChip(m.status) +
    '<div class="text-xs text-slate-400 mt-2">' + (m.category || '') + '</div>' +
    '<div class="font-bold text-lg mt-2">' + (m.player1 || '') + '</div>' +
    '<div class="text-4xl font-extrabold my-2">' + p1 + ' - ' + p2 + '</div>' +
    '<div class="font-bold text-lg">' + (m.player2 || '') + '</div></div>' +
    '<div class="grid grid-cols-2 gap-3 mb-3">' +
    '<button type="button" onclick="bmScore(\'' + id + '\',\'p1\',1)" class="py-4 bg-green-500 text-slate-900 rounded-xl font-bold">+1 ' + n1 + '</button>' +
    '<button type="button" onclick="bmScore(\'' + id + '\',\'p2\',1)" class="py-4 bg-green-500 text-slate-900 rounded-xl font-bold">+1 ' + n2 + '</button></div>' +
    '<div class="grid grid-cols-2 gap-3 mb-4">' +
    '<button type="button" onclick="bmScore(\'' + id + '\',\'p1\',-1)" class="py-3 bg-slate-700 rounded-xl text-sm">-1 ' + n1 + '</button>' +
    '<button type="button" onclick="bmScore(\'' + id + '\',\'p2\',-1)" class="py-3 bg-slate-700 rounded-xl text-sm">-1 ' + n2 + '</button></div>' +
    '<div class="grid grid-cols-3 gap-2 mb-4">' +
    '<button type="button" onclick="bmStatus(\'' + id + '\',\'not_started\')