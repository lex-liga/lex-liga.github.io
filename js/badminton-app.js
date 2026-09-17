// Lex Liga Badminton – public page (single match score, like futsal)

const sb = window.supabaseClient || window.supabase || supabase;

function forceDark() {
  document.documentElement.classList.add('dark');
  document.body.classList.remove('light');
  localStorage.setItem('theme', 'dark');
}

function statusBadge(status) {
  const map = { live: 'LIVE', finished: 'FT', not_started: 'Upcoming' };
  return `<span class="status-${status || 'not_started'} text-xs font-bold px-2 py-0.5 rounded text-white">${map[status] || status}</span>`;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scoreOf(m, side) {
  if (side === 1) {
    if (m.score_p1 != null) return Number(m.score_p1) || 0;
    return Number(m.g1_p1) || 0;
  }
  if (m.score_p2 != null) return Number(m.score_p2) || 0;
  return Number(m.g1_p2) || 0;
}

function buildBmShareText(m) {
  const p1 = scoreOf(m, 1);
  const p2 = scoreOf(m, 2);
  const lines = [
    '🏸 Lex Liga Badminton',
    (m.category || 'Match') + (m.status === 'live' ? ' · LIVE' : m.status === 'finished' ? ' · FT' : ''),
    '',
    m.player1 + '  ' + p1 + ' – ' + p2 + '  ' + m.player2
  ];
  if (m.status === 'finished') {
    if (p1 > p2) lines.push('Winner: ' + m.player1);
    else if (p2 > p1) lines.push('Winner: ' + m.player2);
  }
  lines.push('', 'Follow live: https://lex-liga.github.io/badminton.html');
  return lines.join('\n');
}

window.shareBmMatch = async function (id) {
  const m = (window.__bmMatches || []).find((x) => String(x.id) === String(id));
  if (!m) return;
  const text = buildBmShareText(m);
  try {
    if (navigator.share) await navigator.share({ title: 'Lex Liga Badminton', text });
    else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      alert('Score copied — paste anywhere to share');
    } else prompt('Copy this score:', text);
  } catch (e) {}
};

function renderBmCard(m) {
  const p1 = scoreOf(m, 1);
  const p2 = scoreOf(m, 2);
  let winner = '';
  if (m.status === 'finished') {
    if (p1 > p2)
      winner = `<div class="text-center text-green-400 text-xs font-bold mt-2">Winner: ${escapeHtml(m.player1)}</div>`;
    else if (p2 > p1)
      winner = `<div class="text-center text-green-400 text-xs font-bold mt-2">Winner: ${escapeHtml(m.player2)}</div>`;
  }
  return `
    <div class="match-card bg-slate-800 rounded-xl p-4 border border-slate-700 ${m.status === 'live' ? 'match-live' : ''}">
      <div class="flex items-center justify-between mb-3">
        ${statusBadge(m.status)}
        <span class="text-xs text-slate-400">${escapeHtml(m.category || 'Match')}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex-1 text-right font-semibold text-sm">${escapeHtml(m.player1)}</div>
        <div class="text-2xl font-extrabold tabular-nums px-3 min-w-[70px] text-center">${p1} – ${p2}</div>
        <div class="flex-1 text-left font-semibold text-sm">${escapeHtml(m.player2)}</div>
      </div>
      ${winner}
      <button type="button" class="share-button" onclick="shareBmMatch('${m.id}')">↗ Share</button>
    </div>
  `;
}

async function loadBadminton() {
  if (!sb || typeof sb.from !== 'function') return;
  try {
    const { data, error } = await sb.from('badminton_matches').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    const matches = data || [];
    window.__bmMatches = matches;
    const live = matches.filter((m) => m.status === 'live');
    const finished = matches.filter((m) => m.status === 'finished');

    if (typeof window.lexWatchScores === 'function') {
      window.lexWatchScores(
        live.map((m) => ({
          id: 'b-' + m.id,
          label: 'Badminton: ' + (m.player1 || '') + ' vs ' + (m.player2 || ''),
          scoreKey: String(scoreOf(m, 1)) + '-' + String(scoreOf(m, 2)),
          isLive: true
        }))
      );
    }

    const liveEl = document.getElementById('bmLive');
    if (liveEl)
      liveEl.innerHTML = live.length ? live.map(renderBmCard).join('') : '<p class="text-slate-400 text-sm">No live matches</p>';
    const recentEl = document.getElementById('bmRecent');
    if (recentEl)
      recentEl.innerHTML = finished.length
        ? finished.slice(0, 8).map(renderBmCard).join('')
        : '<p class="text-slate-400 text-sm">No results yet</p>';
    const allEl = document.getElementById('bmAll');
    if (allEl)
      allEl.innerHTML = matches.length ? matches.map(renderBmCard).join('') : '<p class="text-slate-400 text-sm">No fixtures yet</p>';
    const up = document.getElementById('lastUpdated');
    if (up) up.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error(err);
    ['bmLive', 'bmRecent', 'bmAll'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<p class="text-red-400 text-sm">${err.message}</p>`;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  forceDark();
  loadBadminton();
  setInterval(loadBadminton, 20000);
  document.getElementById('refreshBtn')?.addEventListener('click', loadBadminton);
});
