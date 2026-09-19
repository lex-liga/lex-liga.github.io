// Lex Liga Futsal Admin – goals, cards, penalties, sudden death

const sb = window.supabaseClient || window.supabase || supabase;

const logoutBtn = document.getElementById('logoutBtn');
logoutBtn?.addEventListener('click', () => {
  sessionStorage.removeItem('lexAdmin');
  sessionStorage.removeItem('lexAdminSport');
  location.reload();
});
document.getElementById('refreshAdmin')?.addEventListener('click', loadAdminData);

let allTeams = [];
let allGoals = [];
let allCards = [];

function getTeamName(id) {
  const t = allTeams.find(t => t.id === id);
  return t ? t.name : 'TBD';
}

async function loadAdminData() {
  const container = document.getElementById('adminMatches');
  if (!container) return;
  container.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Loading matches...</p>';
  if (!sb || typeof sb.from !== 'function') {
    container.innerHTML = '<p class="text-red-400 text-sm text-center">Supabase not ready. Please hard-refresh.</p>';
    return;
  }
  try {
    const { data: teams, error: te } = await sb.from('teams').select('*').order('name');
    if (te) throw te;
    allTeams = teams || [];
    const homeSelect = document.getElementById('newHome');
    const awaySelect = document.getElementById('newAway');
    if (homeSelect && awaySelect) {
      const opts = allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      homeSelect.innerHTML = opts;
      awaySelect.innerHTML = opts;
    }
    const { data: matches, error } = await sb.from('matches').select('*').order('kickoff_time', { ascending: true });
    if (error) throw error;
    const { data: goals } = await sb.from('goals').select('*');
    allGoals = goals || [];
    try {
      const { data: cards } = await sb.from('cards').select('*');
      allCards = cards || [];
    } catch (e) { allCards = []; }
    if (!matches || matches.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm text-center py-6">No matches yet.<br>Add one below.</p>';
      return;
    }
    container.innerHTML = matches.map(m => renderAdminCard(m)).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-red-400 text-sm text-center">Error: ${err.message || err}</p>`;
  }
}
window.loadAdminData = loadAdminData;

function renderAdminCard(m) {
  const home = getTeamName(m.home_team_id);
  const away = getTeamName(m.away_team_id);
  const hs = Number(m.home_score) || 0;
  const as = Number(m.away_score) || 0;
  const pensOn = !!m.pens_on || m.status === 'penalties';
  const ph = Number(m.pen_home) || 0;
  const pa = Number(m.pen_away) || 0;
  const suddenDeath = !!m.pens_sudden || (pensOn && ph === pa && ph >= 5 && pa >= 5);

  const statusMap = {
    not_started: ['UPCOMING', 'bg-blue-600/30 text-blue-300'],
    live: ['LIVE', 'bg-red-600 text-white'],
    half_time: ['HT', 'bg-orange-500 text-white'],
    penalties: ['PENS', 'bg-amber-500 text-slate-900'],
    finished: ['FT', 'bg-slate-600 text-slate-200'],
    walkover: ['WO', 'bg-slate-600 text-slate-200']
  };
  const st = statusMap[m.status] || [m.status || '?', 'bg-slate-700 text-slate-300'];

  const matchGoals = (typeof allGoals !== 'undefined' ? allGoals : []).filter(g => g.match_id === m.id);
  const goalsList = matchGoals.length
    ? `<div class="mt-4 space-y-1">
        <p class="text-[11px] font-bold text-slate-500 uppercase">Goals</p>
        ${matchGoals.map(g => `
          <div class="flex justify-between items-center bg-slate-900/80 rounded-lg px-3 py-2 text-sm">
            <span>${g.player_name}${g.minute ? " " + g.minute + "'" : ''} <span class="text-slate-500 text-xs">(${getTeamName(g.team_id)})</span></span>
            <button type="button" onclick="deleteGoal('${g.id}', '${m.id}', '${g.team_id === m.home_team_id ? 'home' : 'away'}')" class="text-red-400 font-bold text-xs px-2">✕</button>
          </div>`).join('')}
      </div>`
    : '';

  const matchCards = (typeof allCards !== 'undefined' ? allCards : []).filter(c => c.match_id === m.id);
  const cardsList = matchCards.length
    ? `<div class="mt-3 space-y-1">
        <p class="text-[11px] font-bold text-slate-500 uppercase">Cards</p>
        ${matchCards.map(c => `
          <div class="flex justify-between items-center bg-slate-900/80 rounded-lg px-3 py-2 text-sm">
            <span>${c.card_type === 'red' ? '🟥' : '🟨'} ${c.player_name}${c.minute ? " " + c.minute + "'" : ''}</span>
            <button type="button" onclick="deleteCard('${c.id}')" class="text-red-400 font-bold text-xs px-2">✕</button>
          </div>`).join('')}
      </div>`
    : '';

  let pensUI = '';
  if (pensOn) {
    pensUI = `
      <div class="mt-4 p-4 rounded-2xl ${suddenDeath ? 'bg-red-500/15 border border-red-500/40' : 'bg-amber-500/10 border border-amber-500/30'}">
        <div class="text-center text-xs font-bold ${suddenDeath ? 'text-red-400' : 'text-amber-400'} mb-2">
          ${suddenDeath ? '⚡ SUDDEN DEATH' : 'PENALTIES'} · ${ph} – ${pa}
        </div>
        <div class="grid grid-cols-2 gap-3 mb-2">
          <div class="text-center">
            <p class="text-[11px] text-slate-400 mb-1 truncate">${home}</p>
            <div class="flex items-center justify-center gap-2">
              <button type="button" onclick="changePen('${m.id}', 'home', -1)" class="w-11 h-11 rounded-xl bg-slate-700 text-xl font-bold">−</button>
              <span class="text-2xl font-extrabold w-8">${ph}</span>
              <button type="button" onclick="changePen('${m.id}', 'home', 1)" class="w-11 h-11 rounded-xl bg-amber-500 text-slate-900 text-xl font-bold">+</button>
            </div>
          </div>
          <div class="text-center">
            <p class="text-[11px] text-slate-400 mb-1 truncate">${away}</p>
            <div class="flex items-center justify-center gap-2">
              <button type="button" onclick="changePen('${m.id}', 'away', -1)" class="w-11 h-11 rounded-xl bg-slate-700 text-xl font-bold">−</button>
              <span class="text-2xl font-extrabold w-8">${pa}</span>
              <button type="button" onclick="changePen('${m.id}', 'away', 1)" class="w-11 h-11 rounded-xl bg-amber-500 text-slate-900 text-xl font-bold">+</button>
            </div>
          </div>
        </div>
        ${!m.pens_sudden ? `<button type="button" onclick="enterSuddenDeath('${m.id}')" class="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm mb-2">Enter sudden death</button>` : ''}
        <button type="button" onclick="clearPens('${m.id}')" class="w-full text-xs text-slate-500 underline">Clear pens</button>
      </div>`;
  }

  return `
    <div class="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-4">
      <div class="flex items-center gap-2">
        <div class="flex-1 min-w-0 text-right">
          <p class="font-bold text-base truncate leading-tight">${home}</p>
        </div>
        <div class="shrink-0 text-center px-2">
          <div class="text-3xl font-black tracking-tight">
            <span id="home-${m.id}">${hs}</span>
            <span class="text-slate-500 mx-0.5">–</span>
            <span id="away-${m.id}">${as}</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-base truncate leading-tight">${away}</p>
        </div>
        <span class="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${st[1]}">${st[0]}</span>
      </div>

      ${m.group_name ? `<p class="text-center text-[11px] text-slate-500 -mt-2">${m.group_name}</p>` : ''}

      <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center justify-center gap-3">
          <button type="button" onclick="changeScoreOnly('${m.id}', 'home', -1)"
            class="w-14 h-14 rounded-2xl bg-slate-700 text-2xl font-bold active:scale-95">−</button>
          <span class="text-xs text-slate-400 font-semibold w-10 text-center">Home</span>
          <button type="button" onclick="openGoalDialog('${m.id}', 'home')"
            class="w-14 h-14 rounded-2xl bg-green-500 text-slate-900 text-2xl font-bold active:scale-95">+</button>
        </div>
        <div class="flex items-center justify-center gap-3">
          <button type="button" onclick="changeScoreOnly('${m.id}', 'away', -1)"
            class="w-14 h-14 rounded-2xl bg-slate-700 text-2xl font-bold active:scale-95">−</button>
          <span class="text-xs text-slate-400 font-semibold w-10 text-center">Away</span>
          <button type="button" onclick="openGoalDialog('${m.id}', 'away')"
            class="w-14 h-14 rounded-2xl bg-green-500 text-slate-900 text-2xl font-bold active:scale-95">+</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <button type="button" onclick="openCardDialog('${m.id}', 'yellow')"
          class="py-3.5 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 font-bold text-sm">🟨 Card</button>
        <button type="button" onclick="openCardDialog('${m.id}', 'red')"
          class="py-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 font-bold text-sm">🟥 Card</button>
        <button type="button" onclick="${pensOn ? 'void(0)' : `startPens('${m.id}')`}"
          class="py-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-sm ${pensOn ? 'opacity-50' : ''}">Pens</button>
      </div>

      ${pensUI}

      <div class="grid grid-cols-2 gap-2">
        ${m.status === 'not_started'
          ? `<button type="button" onclick="updateStatus('${m.id}', 'live')" class="col-span-2 py-4 rounded-xl bg-red-600 text-white font-bold text-base">▶ Start match</button>`
          : `
          <button type="button" onclick="updateStatus('${m.id}', 'half_time')"
            class="py-4 rounded-xl font-bold text-sm ${m.status === 'half_time' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-200'}">Half-time</button>
          <button type="button" onclick="updateStatus('${m.id}', 'finished')"
            class="py-4 rounded-xl font-bold text-sm ${m.status === 'finished' ? 'bg-slate-500 text-white' : 'bg-green-600 text-white'}">Finish</button>
          <button type="button" onclick="updateStatus('${m.id}', 'live')"
            class="col-span-2 py-3 rounded-xl bg-slate-700 text-sm font-semibold ${m.status === 'live' ? 'ring-2 ring-red-500' : ''}">Back to LIVE</button>
          `}
      </div>

      ${goalsList}
      ${cardsList}

      <div class="flex justify-between text-xs pt-1 border-t border-slate-700">
        <button type="button" onclick="resetScore('${m.id}')" class="text-slate-400 py-2 font-semibold">Reset → Upcoming</button>
        <button type="button" onclick="deleteMatch('${m.id}')" class="text-red-400/80 py-2">Delete match</button>
      </div>
    </div>`;
}

window.openGoalDialog = function(matchId, side) {
  const player = prompt('Player name who scored?');
  if (!player || !player.trim()) return;
  const minuteStr = prompt('Minute of the goal? (optional)', '');
  const minute = minuteStr ? parseInt(minuteStr) : null;
  addGoalAndScore(matchId, side, player.trim(), minute);
};

async function addGoalAndScore(matchId, side, playerName, minute) {
  const el = document.getElementById(`${side}-${matchId}`);
  let current = (parseInt(el && el.textContent) || 0) + 1;
  if (el) el.textContent = current;
  const scoreUpdate = side === 'home' ? { home_score: current } : { away_score: current };
  scoreUpdate.updated_at = new Date().toISOString();
  scoreUpdate.status = 'live';
  const { error: scoreError } = await sb.from('matches').update(scoreUpdate).eq('id', matchId);
  if (scoreError) { alert('Could not update score: ' + scoreError.message); loadAdminData(); return; }
  const { data: matchData } = await sb.from('matches').select('home_team_id, away_team_id').eq('id', matchId).single();
  if (!matchData) return;
  const teamId = side === 'home' ? matchData.home_team_id : matchData.away_team_id;
  const { error: goalError } = await sb.from('goals').insert({ match_id: matchId, team_id: teamId, player_name: playerName, minute: minute });
  if (goalError) alert('Score updated but goal record failed: ' + goalError.message);
  loadAdminData();
}

window.deleteGoal = async function(goalId, matchId, side) {
  if (!confirm('Remove this goal and reduce the score by 1?')) return;
  const { error: delError } = await sb.from('goals').delete().eq('id', goalId);
  if (delError) { alert(delError.message); return; }
  const el = document.getElementById(`${side}-${matchId}`);
  let current = Math.max(0, (parseInt(el?.textContent) || 0) - 1);
  const scoreUpdate = side === 'home' ? { home_score: current } : { away_score: current };
  scoreUpdate.updated_at = new Date().toISOString();
  await sb.from('matches').update(scoreUpdate).eq('id', matchId);
  loadAdminData();
};

window.changeScoreOnly = async function(matchId, side, delta) {
  const el = document.getElementById(`${side}-${matchId}`);
  let current = Math.max(0, (parseInt(el && el.textContent) || 0) + delta);
  if (el) el.textContent = current;
  const update = side === 'home' ? { home_score: current } : { away_score: current };
  update.updated_at = new Date().toISOString();
  try {
    const { data: m } = await sb.from('matches').select('status').eq('id', matchId).single();
    if (m && m.status === 'not_started' && delta > 0) update.status = 'live';
  } catch (e) {}
  const { error } = await sb.from('matches').update(update).eq('id', matchId);
  if (error) { alert(error.message); loadAdminData(); }
  else loadAdminData();
};

window.openCardDialog = async function(matchId, type) {
  const player = prompt(`Player name for ${type === 'yellow' ? 'Yellow' : 'Red'} Card?`);
  if (!player || !player.trim()) return;
  const minuteStr = prompt('Minute? (optional)', '');
  const minute = minuteStr ? parseInt(minuteStr) : null;
  const { error } = await sb.from('cards').insert({ match_id: matchId, player_name: player.trim(), card_type: type, minute: minute });
  if (error) alert(error.message); else loadAdminData();
};

window.deleteCard = async function(cardId) {
  if (!confirm('Remove this card?')) return;
  const { error } = await sb.from('cards').delete().eq('id', cardId);
  if (error) alert(error.message); else loadAdminData();
};

window.updateStatus = async function(matchId, status) {
  const { error } = await sb.from('matches').update({ status, updated_at: new Date().toISOString() }).eq('id', matchId);
  if (error) alert(error.message); else loadAdminData();
};

window.resetScore = async function(matchId) {
  if (!confirm('Reset this match?\n\n• Score → 0-0\n• Clear goals, cards & pens\n• Status → Upcoming')) return;
  await sb.from('matches').update({
    home_score: 0, away_score: 0,
    pens_on: false, pen_home: 0, pen_away: 0, pens_sudden: false,
    status: 'not_started',
    updated_at: new Date().toISOString()
  }).eq('id', matchId);
  await sb.from('goals').delete().eq('match_id', matchId);
  try { await sb.from('cards').delete().eq('match_id', matchId); } catch (e) {}
  loadAdminData();
};

window.startPens = async function(matchId) {
  const { error } = await sb.from('matches').update({
    pens_on: true, pen_home: 0, pen_away: 0, pens_sudden: false,
    status: 'penalties', updated_at: new Date().toISOString()
  }).eq('id', matchId);
  if (error) alert(error.message); else loadAdminData();
};

window.enterSuddenDeath = async function(matchId) {
  const { error } = await sb.from('matches').update({
    pens_on: true, pens_sudden: true, status: 'penalties',
    updated_at: new Date().toISOString()
  }).eq('id', matchId);
  if (error) alert('Run SQL_PENS.md for pens_sudden column. ' + error.message);
  loadAdminData();
};

window.changePen = async function(matchId, side, delta) {
  const { data: m, error } = await sb.from('matches').select('*').eq('id', matchId).single();
  if (error || !m) { alert(error ? error.message : 'Not found'); return; }
  let ph = Number(m.pen_home) || 0;
  let pa = Number(m.pen_away) || 0;
  if (side === 'home') ph = Math.max(0, ph + delta);
  else pa = Math.max(0, pa + delta);
  const up = await sb.from('matches').update({
    pens_on: true, pen_home: ph, pen_away: pa,
    status: m.status === 'finished' ? 'finished' : 'penalties',
    updated_at: new Date().toISOString()
  }).eq('id', matchId);
  if (up.error) alert(up.error.message); else loadAdminData();
};

window.clearPens = async function(matchId) {
  if (!confirm('Clear penalty scores?')) return;
  const { error } = await sb.from('matches').update({
    pens_on: false, pen_home: 0, pen_away: 0, pens_sudden: false,
    updated_at: new Date().toISOString()
  }).eq('id', matchId);
  if (error) alert(error.message); else loadAdminData();
};

window.deleteMatch = async function(matchId) {
  if (!confirm('Delete this match and all its goals/cards?')) return;
  await sb.from('goals').delete().eq('match_id', matchId);
  try { await sb.from('cards').delete().eq('match_id', matchId); } catch (e) {}
  const { error } = await sb.from('matches').delete().eq('id', matchId);
  if (error) alert(error.message); else loadAdminData();
};

document.getElementById('addMatchBtn')?.addEventListener('click', async () => {
  const home = document.getElementById('newHome').value;
  const away = document.getElementById('newAway').value;
  const group = document.getElementById('newGroup').value.trim();
  if (home === away) { alert('Please choose two different teams'); return; }
  const { error } = await sb.from('matches').insert({
    home_team_id: home, away_team_id: away, group_name: group || null,
    status: 'not_started', home_score: 0, away_score: 0, kickoff_time: new Date().toISOString()
  });
  if (error) alert(error.message);
  else {
    var g = document.getElementById('newGroup'); if (g) { if (g.tagName === 'SELECT') g.selectedIndex = 0; else g.value = ''; }
    alert('Match added!');
    loadAdminData();
  }
});
