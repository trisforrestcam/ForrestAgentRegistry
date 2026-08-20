import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import { z } from "zod";
import { getSkill, getSkillMarkdown, loadSkills, readSkillFile, resolveSkill } from "./registry.js";
import { logger } from "./logger.js";

export async function createMcpServer(): Promise<McpServer> {
  const server = new McpServer({ name: "skill-registry", version: "0.1.0" });

  // Single user-triggered prompt (/mcp__skill-registry__use_skill) instead of one prompt
  // per skill — the `name` argument gets fuzzy-matched suggestions as you type (via
  // completable), so the client only ever fetches the handful of skills matching what you
  // typed, not the full registry, no matter how many skills exist. Like the per-skill
  // prompts before it, this only ever runs because the user picked it — never the model.
  server.registerPrompt(
    "use_skill",
    {
      title: "Use skill",
      description:
        "Load one skill's full SKILL.md into this session. Doesn't need to be the exact name — " +
        "e.g. \"onlive\" resolves to \"onlive-id-login\" as long as it's the only match.",
      argsSchema: {
        name: completable(z.string(), async (value) => {
          const skills = await loadSkills();
          const q = value.toLowerCase();
          return skills
            .filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
            .map((s) => s.name)
            .slice(0, 20);
        }),
      },
    },
    async ({ name }) => {
      const resolved = await resolveSkill(name);
      if ("skill" in resolved) {
        logger.info({ query: name, resolved: resolved.skill.name, outcome: "loaded" }, "prompt:use_skill");
        const markdown = (await getSkillMarkdown(resolved.skill.name)) ?? "";
        return { messages: [{ role: "user", content: { type: "text", text: markdown } }] };
      }
      const outcome = resolved.candidates.length === 0 ? "no_match" : "ambiguous";
      logger.info({ query: name, outcome, candidates: resolved.candidates.map((s) => s.name) }, "prompt:use_skill");
      const text =
        resolved.candidates.length === 0
          ? `No skill matches "${name}".`
          : `"${name}" matches more than one skill, be more specific: ${resolved.candidates.map((s) => s.name).join(", ")}`;
      return { messages: [{ role: "user", content: { type: "text", text } }] };
    },
  );

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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              skills.map(({ name, description }) => ({ name, description })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

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
        return { content: [{ type: "text", text: `Skill "${name}" not found` }], isError: true };
      }
      logger.info({ name, outcome: "loaded" }, "tool:get_skill");
      const markdown = await getSkillMarkdown(name);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ name: skill.name, dir: skill.dir, files: skill.files, markdown }, null, 2),
          },
        ],
      };
    },
  );

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
          return { content: [{ type: "text", text: `Skill "${name}" not found` }], isError: true };
        }
        logger.info({ name, path: relPath, outcome: "loaded" }, "tool:read_skill_file");
        return { content: [{ type: "text", text: content }] };
      } catch (err) {
        logger.warn(
          { name, path: relPath, outcome: "error", error: String(err instanceof Error ? err.message : err) },
          "tool:read_skill_file",
        );
        return { content: [{ type: "text", text: String(err instanceof Error ? err.message : err) }], isError: true };
      }
    },
  );

  return server;
}

// Stateless mode: a fresh server+transport per request, no session persisted across calls.
export async function handleMcpRequest(req: any, res: any) {
  const method = req.body?.method;
  const params = req.body?.params;
  // Only log calls worth tracking — not every initialize/list/notification handshake.
  if (method === "tools/call" || method === "prompts/get") {
    logger.info({ method, name: params?.name }, "mcp:request");
  }

  const server = await createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error({ method, error: err instanceof Error ? err.message : String(err) }, "mcp:error");
    throw err;
  }
}
