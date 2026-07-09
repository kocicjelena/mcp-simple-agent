/* eslint-disable @typescript-eslint/no-explicit-any */
import { registerSimpleTools } from "@/lib/tools/registerTools";
import {
  McpServer,
  WebStandardStreamableHTTPServerTransport,
} from "@modelcontextprotocol/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;



async function createServer() {
  const server = new McpServer({
    name: "nextjs-simple-mcpserver",
    version: "1.0.0",
  });

  registerSimpleTools(server);
  return server;
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = await createServer();
  await server.connect(transport);

  return transport.handleRequest(request);
}

export { handleMcpRequest as DELETE, handleMcpRequest as GET, handleMcpRequest as POST };
