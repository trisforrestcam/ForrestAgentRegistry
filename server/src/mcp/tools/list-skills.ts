import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSkills } from "../../services/registry.service.js";
import { logger } from "../../lib/logger.js";
import { jsonResult } from "../response.js";

export function registerListSkillsTool(server: McpServer) {
  server.registerTool(
    "list_skills",
    {
      title: "List skills",
      description: "List all skills available in the registry, with their name and description.",
      inputSchema: {},
    },
    async () => {
      const skills = await loadSkills();
      logger.info({ count: skills.length }, "tool:list_skills");
      return jsonResult(skills.map(({ name, description }) => ({ name, description })));
    },
  );
}
