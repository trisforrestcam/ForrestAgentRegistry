# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`ForrestAgentRegistry` — a backend (`server/`) that is simultaneously:
1. An **MCP server** ("skill-registry") exposing coding skills over `/mcp`.
2. A **REST API** exposing the same skills plus a session-telemetry endpoint.
3. A tiny **static frontend** (`server/public/`) for installing/browsing/monitoring, served
   by the same Express app.

The actual skill content (`SKILL.md` + supporting files) does **not** live in this repo — it
lives in a separate repo, `CamkSkillV2`, checked out somewhere on disk. This repo only reads
and serves it. `mcp-servers/registry.json` is an unrelated, currently-empty directory of
*other* external MCP servers (schema documented in `mcp-servers/README.md`) — don't confuse
it with the skill registry.

For code-level details, there are scoped CLAUDE.md files closer to the code:
- `server/src/CLAUDE.md` — backend architecture (layering, MCP surface, conventions).
- `server/public/CLAUDE.md` — frontend structure and conventions.

## Commands (run from `server/`)

```bash
npm install
npm run build   # tsc -p tsconfig.json → dist/
npm run dev     # tsx watch src/index.ts, no build step needed
npm run start   # node dist/index.js (what pm2 runs in production)
```

There is no lint or test script configured.

Required env (`server/.env`, copy from `.env.example`):
- `SKILLS_PATH` — absolute path to the `CamkSkillV2` checkout. If unset, falls back to a
  sibling `../skills` dir (dev convenience only, not present in this repo).
- `MONGODB_URI` / `MONGODB_DB` — optional. Only needed for the monitor/telemetry endpoints;
  everything else (skills, MCP) works without Mongo configured.

Production runs via pm2 (`ecosystem.config.cjs`, entry `dist/index.js`, loads `.env` via
node's `--env-file`, not dotenv).

Skills are read from `SKILLS_PATH` **live on every request, uncached** — updating the
`CamkSkillV2` checkout (e.g. via `git pull`) makes new/edited skills show up immediately,
no restart needed.

## Conventions

- `.plans/` (gitignored) holds design docs written *before* implementing a nontrivial
  feature — check it for open questions/decisions before assuming a feature is finished.
