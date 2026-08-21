# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

## What this is

Static frontend for the skill-registry server, served as-is by `express.static` (see
`../src/app.ts`) — no bundler, no framework, no build step. Edit these files directly and
they take effect on the next request.

## Structure

Deliberately framework-free: each tab is a **real, separate HTML page** linked via `<a>`,
not a JS-toggled single-page app.

```
style.css     → shared styles for every page
copy.js       → the one shared script (copy-to-clipboard buttons), included on pages that need it
index.html + install.js   → "Cài đặt" tab: install commands for Claude Code / OpenCode
skills.html + skills.js    → "Skills" tab: search + browse the skill list (fetches /api/skills)
monitor.html + monitor.js  → "Monitor" tab: shows the install.sh one-liner + recent telemetry events
monitor/      → files served to the *install.sh curl pipeline*, not to browsers:
  install.sh, claude-hook.mjs, opencode-plugin.mjs — see ../src/CLAUDE.md
  ("Monitor/telemetry") for what these do and how they're triggered.
```

Each `*.html` page follows the same pattern: `<link rel="stylesheet" href="/style.css">` in
`<head>`, then its matching `<script src="/<name>.js">` at the end of `<body>` (plus
`copy.js` if the page has copy buttons). Keep new pages consistent with this — don't inline
`<style>` or `<script>` back into the HTML.

The nav links (`<a href="/index.html">`, etc.) are duplicated across the three pages with a
hardcoded `class="active"` on the current one — there's no shared layout/include mechanism,
so when adding a new tab, update the nav block in all three HTML files.
