//import { createMcpHandler } from "mcp-handler";
import { loadDocs } from "@/lib/mcp/store";
import { registerAllTools } from "@/lib/mcp/registry";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";

// const handler = createMcpHandler(
//   async (server) => {
//     //const docs = await loadDocs();
//    // registerAllTools(server, docs);
//   },
//   {
//     capabilities: { tools: {} },
//   },
//   {
//     basePath: "/api/mcp-stream",
//     verboseLogs: process.env.NODE_ENV === "development",
//     maxDuration: 60,
//     disableSse: false,
//   }
// );

// export { handler as GET, handler as POST, handler as DELETE };
  // TO DO
   //  export async function POST(req: Request) {
async function createServer() {
  
      const server = new McpServer({
        name: "nextjs-simple-mcpserver",
        version: "1.0.0",
      });
      
      registerAllTools(server);
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

        