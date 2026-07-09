/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { mcpClientNew } from "@/lib/mcp/mcpclientnew";

type ToolCallPayload = {
  toolName?: string;
  args?: Record<string, unknown>;
  message?: string;
};

function resultToText(result: any): string {
  if (!result || !Array.isArray(result.content)) {
    return JSON.stringify(result ?? {}, null, 2);
  }

  const textBlocks = result.content
    .filter((item: any) => item?.type === "text" && typeof item.text === "string")
    .map((item: any) => item.text);

  return textBlocks.length > 0 ? textBlocks.join("\n") : JSON.stringify(result, null, 2);
}

export async function GET(req: Request) {
  let client: Awaited<ReturnType<typeof mcpClientNew>>["client"] | null = null;
  let transport: Awaited<ReturnType<typeof mcpClientNew>>["transport"] | null = null;

  try {
    const origin = new URL(req.url).origin;
    const connection = await mcpClientNew(origin);
    client = connection.client;
    transport = connection.transport;

    const listed = await client.listTools();

    return NextResponse.json({
      tools: listed.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await transport?.close?.().catch(() => undefined);
    await client?.close?.().catch(() => undefined);
  }
}

export async function POST(req: Request) {
  let client: Awaited<ReturnType<typeof mcpClientNew>>["client"] | null = null;
  let transport: Awaited<ReturnType<typeof mcpClientNew>>["transport"] | null = null;

  try {
    const body = (await req.json()) as ToolCallPayload;

    if (!body.toolName) {
      return NextResponse.json({ error: "toolName is required" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const connection = await mcpClientNew(origin);
    client = connection.client;
    transport = connection.transport;

    const result = await client.callTool({
      name: body.toolName,
      arguments: body.args ?? {},
    });

    const toolText = resultToText(result);

    return NextResponse.json({
      answer: body.message
        ? `Message: ${body.message}\n\nTool: ${body.toolName}\n\n${toolText}`
        : `Tool: ${body.toolName}\n\n${toolText}`,
      toolName: body.toolName,
      toolResult: result,
      toolText,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await transport?.close?.().catch(() => undefined);
    await client?.close?.().catch(() => undefined);
  }
}
