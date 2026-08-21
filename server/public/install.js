const originUrl = location.origin;

document.getElementById('cmd-claude-add-user').textContent =
  `claude mcp add --transport http skill-registry ${originUrl}/mcp -s user`;
document.getElementById('cmd-claude-add-local').textContent =
  `claude mcp add --transport http skill-registry ${originUrl}/mcp -s local`;
document.getElementById('cmd-claude-remove').textContent =
  `claude mcp remove skill-registry`;
document.getElementById('cmd-opencode-add').textContent =
  `opencode mcp add skill-registry --url ${originUrl}/mcp`;
document.getElementById('cmd-verify-claude').textContent =
  `claude mcp list | grep skill-registry`;
document.getElementById('cmd-verify-opencode').textContent =
  `opencode mcp list | grep skill-registry`;
document.getElementById('expect-claude').textContent =
  `skill-registry: ${originUrl}/mcp (HTTP) - ✔ Connected`;
