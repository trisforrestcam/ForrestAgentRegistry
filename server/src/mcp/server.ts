import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerUseSkillPrompt } from "./prompts/use-skill.js";
import { registerListSkillsTool } from "./tools/list-skills.js";
import { registerGetSkillTool } from "./tools/get-skill.js";
import { registerReadSkillFileTool } from "./tools/read-skill-file.js";

export async function createMcpServer(): Promise<McpServer> {
  const server = new McpServer({ name: "skill-registry", version: "0.1.0" });

  registerUseSkillPrompt(server);
  registerListSkillsTool(server);
  registerGetSkillTool(server);
  registerReadSkillFileTool(server);

  return server;
}
