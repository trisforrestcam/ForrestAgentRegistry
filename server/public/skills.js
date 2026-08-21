const GITHUB_REPO = 'trisforrestcam/CamkSkillV2';
const GITHUB_BRANCH = 'main';

async function api(path) {
  const res = await fetch('/api' + path);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlight(text, q) {
  const escaped = escapeHtml(text);
  if (!q) return escaped;
  const idx = escaped.toLowerCase().indexOf(escapeHtml(q).toLowerCase());
  if (idx === -1) return escaped;
  return escaped.slice(0, idx) + '<mark>' + escaped.slice(idx, idx + q.length) + '</mark>' + escaped.slice(idx + q.length);
}

let allSkills = [];

function renderSkills(skills, q = '') {
  const list = document.getElementById('skills-list');
  list.innerHTML = skills.length ? skills.map(s => `
    <article class="card">
      <h3>${highlight(s.name, q)}</h3>
      <p>${escapeHtml(s.description)}</p>
      <div class="actions">
        <a href="https://github.com/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${encodeURIComponent(s.dir)}" target="_blank" rel="noopener">Xem trên GitHub</a>
        <a href="/api/skills/${encodeURIComponent(s.dir)}/download">Download .zip</a>
      </div>
    </article>`).join('') : '<p class="hint">Không tìm thấy skill nào.</p>';
}

async function loadSkills() {
  const { skills } = await api('/skills');
  allSkills = skills;
  renderSkills(skills);
}

document.getElementById('search').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  const ql = q.toLowerCase();
  if (!ql) return renderSkills(allSkills);
  const filtered = allSkills.filter(s => s.name.toLowerCase().includes(ql));
  renderSkills(filtered, q);
});

loadSkills();
