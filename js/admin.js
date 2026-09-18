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
  const isLive = m.status === 'live' || m.status === 'half_time' || m.status === 'penalties';
  const isFinished = m.status === 'finished' || m.status === 'walkover';
  const hs = Number(m.home_score) || 0;
  const as = Number(m.away_score) || 0;
  const pensOn = !!m.pens_on || m.status === 'penalties';
  const ph = Number(m.pen_home) || 0;
  const pa = Number(m.pen_away) || 0;

  let pensBlock = '';
  if (pensOn) {
    const suddenDeath = !!m.pens_sudden || (ph === pa && ph >= 5 && pa >= 5);
    let pensWinner = '';
    if (ph > pa) pensWinner = home;
    else if (pa > ph) pensWinner = away;
    const phase = suddenDeath
      ? 'SUDDEN DEATH — one each until a winner'
      : 'First 5 each — if still level, tap Sudden Death';
    pensBlock = `
        <div class="mt-3 p-3 rounded-xl ${suddenDeath ? 'bg-red-500/15 border border-red-500/40' : 'bg-amber-500/10 border border-amber-500/30'}">
          <div class="text-xs ${suddenDeath ? 'text-red-400' : 'text-amber-400'} font-bold mb-1">${suddenDeath ? '⚡ ' : ''}PENALTIES · ${phase}</div>
          <div class="text-2xl font-extrabold ${suddenDeath ? 'text-red-300' : 'text-amber-300'}">${ph} – ${pa}</div>
          ${pensWinner ? `<div class="text-sm text-green-400 font-bold mt-1">Leading on pens: ${pensWinner}</div>` : ''}
          <p class="text-[11px] text-slate-400 mt-2 leading-snug">
            ${suddenDeath
              ? 'Keep +1 pen for each successful kick. When one leads, press Finished.'
              : 'After both teams have taken 5 kicks and the score is still level, press Enter sudden death below.'}
          </p>
        </div>`;
  } else if (hs === as) {
    pensBlock = `<div class="mt-2 text-xs text-slate-500">Scores level — start penalties if needed</div>`;
  }

  const matchGoals = allGoals.filter(g => g.match_id === m.id);
  const goalsList = matchGoals.length
    ? `<div class="mt-3 text-sm space-y-1"><p class="text-xs text-slate-400 mb-1">Goals</p>${matchGoals.map(g => `
          <div class="flex justify-between items-center bg-slate-700/60 rounded-lg px-3 py-2">
            <span>${g.player_name} <span class="text-slate-400">(${getTeamName(g.team_id)})</span> ${g.minute ? g.minute + "'" : ''}</span>
            <button onclick="deleteGoal('${g.id}', '${m.id}', '${g.team_id === m.home_team_id ? 'home' : 'away'}')" class="text-red-400 font-bold px-2">X</button>
          </div>`).join('')}</div>` : '';

  const matchCards = allCards.filter(c => c.match_id === m.id);
  const cardsList = matchCards.length
    ? `<div class="mt-3 text-sm space-y-1"><p class="text-xs text-slate-400 mb-1">Cards</p>${matchCards.map(c => `
          <div class="flex justify-between items-center bg-slate-700/60 rounded-lg px-3 py-2">
            <span>${c.card_type === 'yellow' ? 'Y' : 'R'} ${c.player_name} ${c.minute ? c.minute + "'" : ''}</span>
            <button onclick="deleteCard('${c.id}')" class="text-red-400 font-bold px-2">X</button>
          </div>`).join('')}</div>` : '';

  return `
    <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700" data-id="${m.id}">
      <div class="text-center mb-5">
        <div class="text-xs text-slate-400 mb-2">${m.group_name || ''}</div>
        <div class="font-bold text-lg mb-1">${home}</div>
        <div class="text-4xl font-extrabold my-2">
          <span id="home-${m.id}">${m.home_score ?? 0}</span>
          <span class="text-slate-500 mx-2">–</span>
          <span id="away-${m.id}">${m.away_score ?? 0}</span>
        </div>
        <div class="font-bold text-lg">${away}</div>
        ${pensBlock}
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button onclick="openGoalDialog('${m.id}', 'home')" class="w-full big-btn bg-green-500 text-slate-900 rounded-xl py-3 font-bold">+1 ${home.split(' ')[0]}</button>
        <button onclick="openGoalDialog('${m.id}', 'away')" class="w-full big-btn bg-green-500 text-slate-900 rounded-xl py-3 font-bold">+1 ${away.split(' ')[0]}</button>
      </div>
      <div class="grid grid-cols-2 gap-3 mb-5">
        <button onclick="changeScoreOnly('${m.id}', 'home', -1)" class="w-full py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1 ${home.split(' ')[0]}</button>
        <button onclick="changeScoreOnly('${m.id}', 'away', -1)" class="w-full py-3 bg-slate-700 rounded-xl text-sm font-semibold">–1 ${away.split(' ')[0]}</button>
      </div>
      <div class="grid grid-cols-3 gap-2 mb-5">
        <button onclick="updateStatus('${m.id}', 'not_started')" class="status-btn rounded-xl ${m.status === 'not_started' ? 'bg-blue-600 text-white' : 'bg-slate-700'}">Upcoming</button>
        <button onclick="updateStatus('${m.id}', 'live')" class="status-btn rounded-xl ${isLive ? 'bg-red-600 text-white' : 'bg-slate-700'}">LIVE</button>
        <button onclick="updateStatus('${m.id}', 'finished')" class="status-btn rounded-xl ${isFinished ? 'bg-slate-500 text-white' : 'bg-slate-700'}">Finished</button>
      </div>
      <div class="mb-4 p-3 rounded-xl border border-slate-600 bg-slate-900/50">
        <p class="text-xs text-slate-400 mb-2 font-semibold">Penalty shootout (if draw)</p>
        ${!pensOn ? `
        <button type="button" onclick="startPens('${m.id}')" class="w-full py-3 mb-2 rounded-xl bg-amber-500 text-slate-900 font-bold text-sm">Start penalties</button>
        ` : `
        <div class="grid grid-cols-2 gap-2 mb-2">
          <button type="button" onclick="changePen('${m.id}', 'home', 1)" class="py-3 bg-amber-500 text-slate-900 rounded-xl font-bold text-sm">+1 pen ${home.split(' ')[0]}</button>
          <button type="button" onclick="changePen('${m.id}', 'away', 1)" class="py-3 bg-amber-500 text-slate-900 rounded-xl font-bold text-sm">+1 pen ${away.split(' ')[0]}</button>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <button type="button" onclick="changePen('${m.id}', 'home', -1)" class="py-2 bg-slate-700 rounded-xl text-xs">–1 pen</button>
          <button type="button" onclick="changePen('${m.id}', 'away', -1)" class="py-2 bg-slate-700 rounded-xl text-xs">–1 pen</button>
        </div>
        ${!m.pens_sudden ? `<button type="button" onclick="enterSuddenDeath('${m.id}')" class="w-full py-3 mb-2 rounded-xl bg-red-600 text-white font-bold text-sm">Enter sudden death</button>` : `<div class="text-center text-red-400 text-xs font-bold mb-2">⚡ Sudden death active</div>`}
        <button type="button" onclick="clearPens('${m.id}')" class="w-full text-xs text-slate-400 underline">Clear pens</button>
        `}
      </div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button onclick="openCardDialog('${m.id}', 'yellow')" class="py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-semibold text-sm">Yellow Card</button>
        <button onclick="openCardDialog('${m.id}', 'red')" class="py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-semibold text-sm">Red Card</button>
      </div>
      ${goalsList}${cardsList}
      <div class="flex justify-between text-sm pt-3">
        <button onclick="resetScore('${m.id}')" class="text-slate-400 underline">Reset Score + Goals</button>
        <button onclick="deleteMatch('${m.id}')" class="text-red-400 underline">Delete</button>
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
  let current = (parseInt(el.textContent) || 0) + 1;
  el.textContent = current;
  const scoreUpdate = side === 'home' ? { home_score: current } : { away_score: current };
  scoreUpdate.updated_at = new Date().toISOString();
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
  let current = Math.max(0, (parseInt(el.textContent) || 0) + delta);
  el.textContent = current;
  const update = side === 'home' ? { home_score: current } : { away_score: current };
  update.updated_at = new Date().toISOString();
  const { error } = await sb.from('matches').update(update).eq('id', matchId);
  if (error) { alert(error.message); loadAdminData(); }
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
  if (!confirm('Reset score to 0-0 and clear all goals of this match?')) return;
  await sb.from('matches').update({
    home_score: 0, away_score: 0, pens_on: false, pen_home: 0, pen_away: 0, pens_sudden: false,
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
    document.getElementById('newGroup').value = '';
    alert('Match added!');
    loadAdminData();
  }
});
