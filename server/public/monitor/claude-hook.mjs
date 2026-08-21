#!/usr/bin/env node
// Claude Code SessionEnd hook. Installed by install.sh with the webhook URL baked in
// as argv[2] — SessionEnd hooks share a short (1.5s, up to 60s) timeout budget, so this
// reads the payload from stdin, does a best-effort transcript scan, and fires the POST
// without waiting for network retries.
import { readFileSync } from "node:fs";

const webhookUrl = process.argv[2];
if (!webhookUrl) {
  console.error("skill-registry monitor hook: missing webhook URL argument");
  process.exit(0);
}

function readStdin() {
  try {
    return readFileSync(0, "utf-8");
  } catch {
    return "";
  }
}

function summarizeTranscript(transcriptPath) {
  const summary = { messageCount: 0, toolCalls: {}, skillsUsed: [] };
  if (!transcriptPath) return summary;
  let raw;
  try {
    raw = readFileSync(transcriptPath, "utf-8");
  } catch {
    return summary;
  }
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    summary.messageCount++;
    const content = entry?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type !== "tool_use") continue;
      const name = block.name ?? "unknown";
      summary.toolCalls[name] = (summary.toolCalls[name] ?? 0) + 1;
      if (name === "mcp__skill-registry__get_skill" && block.input?.name) {
        summary.skillsUsed.push(block.input.name);
      }
    }
  }
  return summary;
}

async function main() {
  const stdin = readStdin();
  let payload = {};
  try {
    payload = JSON.parse(stdin);
  } catch {
    // no valid payload on stdin, still send what we know
  }

  const event = {
    source: "claude-code",
    sessionId: payload.session_id,
    reason: payload.reason,
    cwd: payload.cwd,
    summary: summarizeTranscript(payload.transcript_path),
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {});
}

await main();
