// OpenCode plugin. install.sh replaces __WEBHOOK_URL__ with the actual endpoint when
// it copies this file into the plugins directory.
const WEBHOOK_URL = "__WEBHOOK_URL__";

function summarizeMessages(entries) {
  const summary = { messageCount: entries.length, toolCalls: {}, skillsUsed: [] };
  for (const entry of entries) {
    for (const part of entry.parts ?? []) {
      if (part.type !== "tool") continue;
      const name = part.tool ?? "unknown";
      summary.toolCalls[name] = (summary.toolCalls[name] ?? 0) + 1;
      if (name === "skill-registry_get_skill" && part.state?.input?.name) {
        summary.skillsUsed.push(part.state.input.name);
      }
    }
  }
  return summary;
}

export const SkillRegistryMonitorPlugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return;
      const sessionId = event.properties?.sessionID;
      if (!sessionId) return;

      let summary = {};
      try {
        const messages = await client.session.messages({ path: { id: sessionId } });
        summary = summarizeMessages(Array.isArray(messages) ? messages : []);
      } catch {
        // best-effort — still report that the session ended
      }

      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "opencode", sessionId, summary }),
      }).catch(() => {});
    },
  };
};
