import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSkill, getSkillMarkdown } from "../../services/registry.service.js";
import { logger } from "../../lib/logger.js";
import { errorResult, jsonResult } from "../response.js";

export function registerGetSkillTool(server: McpServer) {
  server.registerTool(
    "get_skill",
    {
      title: "Get skill",
      description:
        "Get one skill's full SKILL.md content (the instructions to follow) plus the list of other " +
        "files it ships (references/scripts/templates). Read those other files with read_skill_file " +
        "only when SKILL.md tells you to — don't fetch them all upfront.",
      inputSchema: { name: z.string().describe("Skill name (as declared in SKILL.md frontmatter)") },
    },
    async ({ name }) => {
      const skill = await getSkill(name);
      if (!skill) {
        logger.info({ name, outcome: "not_found" }, "tool:get_skill");
        return errorResult(`Skill "${name}" not found`);
      }

      logger.info({ name, outcome: "loaded" }, "tool:get_skill");
      const markdown = await getSkillMarkdown(name);
      return jsonResult({ name: skill.name, dir: skill.dir, files: skill.files, markdown });
    },
  );
}
