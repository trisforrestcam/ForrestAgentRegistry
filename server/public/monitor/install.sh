#!/usr/bin/env bash
# Installs the skill-registry monitor hook (Claude Code) and plugin (OpenCode).
# Usage: curl -fsSL <origin>/monitor/install.sh | REGISTRY_URL=<origin> bash
set -euo pipefail

if [ -z "${REGISTRY_URL:-}" ]; then
  echo "REGISTRY_URL env var is required, e.g.:" >&2
  echo "  curl -fsSL https://your-registry/monitor/install.sh | REGISTRY_URL=https://your-registry bash" >&2
  exit 1
fi

WEBHOOK_URL="${REGISTRY_URL%/}/api/monitor/events"

# --- Claude Code ---
CLAUDE_HOOKS_DIR="$HOME/.claude/hooks"
CLAUDE_HOOK_PATH="$CLAUDE_HOOKS_DIR/skill-registry-monitor.mjs"
mkdir -p "$CLAUDE_HOOKS_DIR"
curl -fsSL "${REGISTRY_URL%/}/monitor/claude-hook.mjs" -o "$CLAUDE_HOOK_PATH"
chmod +x "$CLAUDE_HOOK_PATH"
echo "Đã ghi $CLAUDE_HOOK_PATH"

CLAUDE_SETTINGS="$HOME/.claude/settings.json"
mkdir -p "$HOME/.claude"
[ -f "$CLAUDE_SETTINGS" ] || echo '{}' > "$CLAUDE_SETTINGS"

CLAUDE_HOOK_PATH="$CLAUDE_HOOK_PATH" WEBHOOK_URL="$WEBHOOK_URL" CLAUDE_SETTINGS="$CLAUDE_SETTINGS" node <<'NODE'
const fs = require("node:fs");

const settingsPath = process.env.CLAUDE_SETTINGS;
const hookCommand = `node ${process.env.CLAUDE_HOOK_PATH} ${process.env.WEBHOOK_URL}`;

const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8") || "{}");
settings.hooks ??= {};
settings.hooks.SessionEnd ??= [];

const alreadyInstalled = settings.hooks.SessionEnd.some((group) =>
  (group.hooks ?? []).some((h) => h.command === hookCommand),
);

if (!alreadyInstalled) {
  settings.hooks.SessionEnd.push({ hooks: [{ type: "command", command: hookCommand }] });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  console.log(`Đã đăng ký SessionEnd hook trong ${settingsPath}`);
} else {
  console.log(`SessionEnd hook đã có sẵn trong ${settingsPath}, bỏ qua`);
}
NODE

# --- OpenCode ---
OPENCODE_PLUGINS_DIR="$HOME/.config/opencode/plugins"
OPENCODE_PLUGIN_PATH="$OPENCODE_PLUGINS_DIR/skill-registry-monitor.mjs"
mkdir -p "$OPENCODE_PLUGINS_DIR"
curl -fsSL "${REGISTRY_URL%/}/monitor/opencode-plugin.mjs" | sed "s#__WEBHOOK_URL__#$WEBHOOK_URL#" > "$OPENCODE_PLUGIN_PATH"
echo "Đã ghi $OPENCODE_PLUGIN_PATH"

echo ""
echo "Xong. Claude Code sẽ gọi webhook khi session kết thúc (SessionEnd)."
echo "OpenCode sẽ gọi webhook khi session idle (agent trả lời xong)."
