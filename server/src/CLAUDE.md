# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

## Layered structure

```
config/   → env.ts reads all of process.env once; nothing else should read process.env directly
lib/      → logger.ts (pino)
db/       → mongoose.ts: lazy connectMongo(), returns undefined if MONGODB_URI unset
schema/   → Mongoose schemas/models (currently just event.ts)
services/ → business logic: registry.service.ts (read skills from SKILLS_PATH),
            monitor.service.ts (record/list telemetry events via db+schema)
routes/   → Express routers, one per resource, mounted in routes/index.ts.
            Routes call services directly — no separate controller layer.
mcp/      → the MCP server surface (see below)
app.ts    → assembles the Express app (middleware, mounts routes/index.ts at /api,
            mounts mcp/handler.ts at /mcp, serves ../public/) — does NOT call listen()
index.ts  → entrypoint: reads config, calls createApp().listen()
```

Dependency direction is one-way: `routes/` and `mcp/` depend on `services/`; `services/`
depend on `db/` + `schema/` + `config/`. Don't import a route from a service, etc.

## MCP surface (`mcp/`)

- `server.ts` just wires prompts/tools together (`registerXxx(server)` calls) — look here
  first to see what the MCP server exposes, then follow into `prompts/` or `tools/`.
- `handler.ts` is the HTTP transport glue: stateless mode, a **fresh** `McpServer` +
  `StreamableHTTPServerTransport` per request (no session persisted across calls).
- `response.ts` has the shared result-shape helpers (`textResult`, `jsonResult`,
  `errorResult` for tools; `promptText` for prompts) — use these instead of hand-writing
  `{ content: [{ type: "text", ... }] }` in a new tool/prompt.
- Exactly **one prompt** (`use_skill`) instead of one per skill: it fuzzy-matches the `name`
  arg via `completable` so the client only fetches matching suggestions, and `prompts/list`
  stays a single entry no matter how many skills exist. Prompts only run when the user
  explicitly invokes them (`/mcp__skill-registry__use_skill`) — never model-triggered.
- Three tools instead (model-triggered): `list_skills`, `get_skill`, `read_skill_file`.
  `get_skill` returns the skill's file manifest; `read_skill_file` fetches one file from
  that manifest on demand — tools are expected to be called in that order, not all upfront.
- Every tool/prompt call is logged via pino with an `outcome` field
  (`loaded`/`not_found`/`ambiguous`/`error`) — keep this convention when adding new ones,
  it's how usage/failures get monitored in production (`pm2 logs skill-registry`).

## Monitor/telemetry (opt-in, client-side)

`server/public/monitor/install.sh` is a one-shot installer (`curl | bash`), **not a cron** —
it writes a Claude Code `SessionEnd` hook and an OpenCode plugin onto the *user's* machine,
which then self-report session summaries to `POST /api/monitor/events` on their own
(event-driven: Claude Code fires on session end, OpenCode fires on `session.idle`). The
server side (`routes/monitor.routes.ts` → `services/monitor.service.ts`) only stores what
gets POSTed — it can't reach into a user's local session itself.
