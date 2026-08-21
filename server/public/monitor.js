const originUrl = location.origin;

document.getElementById('cmd-install').textContent =
  `curl -fsSL ${originUrl}/monitor/install.sh | REGISTRY_URL=${originUrl} bash`;

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function loadEvents() {
  const list = document.getElementById('events-list');
  try {
    const res = await fetch('/api/monitor/events?limit=50');
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
    const { events } = await res.json();
    list.innerHTML = events.length
      ? events.map(e => `
        <article class="card">
          <h3>${escapeHtml(e.source)} — ${escapeHtml(e.sessionId ?? 'unknown session')}</h3>
          <p>${escapeHtml(JSON.stringify(e.summary ?? {}, null, 2))}</p>
        </article>`).join('')
      : '<p class="hint">Chưa có event nào.</p>';
  } catch (err) {
    list.innerHTML = `<p class="hint">Không tải được events: ${escapeHtml(err.message)}</p>`;
  }
}

loadEvents();
