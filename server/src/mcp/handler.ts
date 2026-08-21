import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";
import { logger } from "../lib/logger.js";

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
