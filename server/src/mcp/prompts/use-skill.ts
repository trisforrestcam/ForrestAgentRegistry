import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import { z } from "zod";
import { getSkillMarkdown, loadSkills, resolveSkill } from "../../services/registry.service.js";
import { logger } from "../../lib/logger.js";
import { promptText } from "../response.js";

async function suggestSkillNames(query: string): Promise<string[]> {
  const skills = await loadSkills();
  const q = query.toLowerCase();
  return skills
    .filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    .map((s) => s.name)
    .slice(0, 20);
}

// Single user-triggered prompt (/mcp__skill-registry__use_skill) instead of one prompt
// per skill — the `name` argument gets fuzzy-matched suggestions as you type (via
// completable), so the client only ever fetches the handful of skills matching what you
// typed, not the full registry, no matter how many skills exist. This only ever runs
// because the user picked it — never the model.
export function registerUseSkillPrompt(server: McpServer) {
  server.registerPrompt(
    "use_skill",
    {
      title: "Use skill",
      description:
        "Load one skill's full SKILL.md into this session. Doesn't need to be the exact name — " +
        "e.g. \"onlive\" resolves to \"onlive-id-login\" as long as it's the only match.",
      argsSchema: {
        name: completable(z.string(), suggestSkillNames),
      },
    },
    async ({ name }) => {
      const resolved = await resolveSkill(name);

      if ("skill" in resolved) {
        logger.info({ query: name, resolved: resolved.skill.name, outcome: "loaded" }, "prompt:use_skill");
        const markdown = (await getSkillMarkdown(resolved.skill.name)) ?? "";
        return promptText(markdown);
      }

      const outcome = resolved.candidates.length === 0 ? "no_match" : "ambiguous";
      logger.info({ query: name, outcome, candidates: resolved.candidates.map((s) => s.name) }, "prompt:use_skill");
      const text =
        resolved.candidates.length === 0
          ? `No skill matches "${name}".`
          : `"${name}" matches more than one skill, be more specific: ${resolved.candidates.map((s) => s.name).join(", ")}`;
      return promptText(text);
    },
  );
}
