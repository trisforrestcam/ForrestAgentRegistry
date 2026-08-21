import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readSkillFile } from "../../services/registry.service.js";
import { logger } from "../../lib/logger.js";
import { errorResult, textResult } from "../response.js";

export function registerReadSkillFileTool(server: McpServer) {
  server.registerTool(
    "read_skill_file",
    {
      title: "Read skill file",
      description:
        "Read one supporting file (from the `files` list returned by get_skill) belonging to a skill — " +
        "e.g. a references/*.md doc, a scripts/* helper, or a templates/* file.",
      inputSchema: {
        name: z.string().describe("Skill name"),
        path: z.string().describe("File path relative to the skill's own directory, e.g. references/integration-guide.md"),
      },
    },
    async ({ name, path: relPath }) => {
      try {
        const content = await readSkillFile(name, relPath);
        if (content === undefined) {
          logger.info({ name, path: relPath, outcome: "not_found" }, "tool:read_skill_file");
          return errorResult(`Skill "${name}" not found`);
        }

        logger.info({ name, path: relPath, outcome: "loaded" }, "tool:read_skill_file");
        return textResult(content);
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        logger.warn({ name, path: relPath, outcome: "error", error }, "tool:read_skill_file");
        return errorResult(error);
      }
    },
  );
}
