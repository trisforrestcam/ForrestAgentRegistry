// Every MCP tool result is `{ content: [{ type: "text", text }], isError? }` — these
// helpers spell out that shape once instead of re-typing it in every tool handler.

export function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function jsonResult(data: unknown) {
  return textResult(JSON.stringify(data, null, 2));
}

export function errorResult(text: string) {
  return { content: [{ type: "text" as const, text }], isError: true as const };
}

// Prompt messages use a different shape than tool results ({ messages: [...] } with a
// role, instead of { content: [...] }) — same idea, kept separate to match the SDK type.
export function promptText(text: string) {
  return { messages: [{ role: "user" as const, content: { type: "text" as const, text } }] };
}
