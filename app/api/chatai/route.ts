/* eslint-disable @typescript-eslint/no-explicit-any */
import ollama, { type Tool as OllamaTool } from "ollama";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse, ToolCall } from "@/lib/types/chat";
import { loadDocs } from "@/lib/mcp/store";
import { registerAllTools } from "@/lib/mcp/registry";

/**
 * Unified chat route supporting two providers behind one endpoint:
 *   - "ollama"    -> local Ollama models (existing behaviour, unchanged loop)
 *   - "anthropic" -> Claude via @anthropic-ai/sdk
 *
 * Both providers share the same MCP tool runtime, honour a `system`
 * instruction string, filter tools by `enabledTools`, and return the same
 * `toolTrace` shape so the UI never needs to know which provider ran.
 */

type Provider = "ollama" | "anthropic";

type ToolTrace = {
  name: string;
  args: Record<string, unknown>;
  result: string;
  isError?: boolean;
};

type UnifiedChatResponse = ChatResponse & {
  provider: Provider;
  message: { role: "assistant"; content: string };
  toolCalls?: ToolCall[];
  toolTrace?: ToolTrace[];
  availableTools?: string[];
};

// Request body extends the base ChatRequest with the new switchable fields.
type UnifiedChatRequest = ChatRequest & {
  provider?: Provider;
  system?: string;
  enabledTools?: string[];
  anthropicModel?: string;
};

type RegisteredTool = {
  description?: string;
  inputSchema?: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<any> | any;
};

class InMemoryToolServer {
  tools = new Map<string, RegisteredTool>();

  registerTool(name: string, config: any, handler: RegisteredTool["handler"]) {
    this.tools.set(name, {
      description: config?.description,
      inputSchema: config?.inputSchema,
      handler,
    });
  }
}

async function createToolRuntime() {
  const docs = await loadDocs();
  const server = new InMemoryToolServer();
  registerAllTools(server as any, docs);
  return server.tools;
}

/** Restrict the runtime to the tools the user checked for this conversation. */
function selectTools(
  runtime: Map<string, RegisteredTool>,
  enabledTools?: string[]
): Array<[string, RegisteredTool]> {
  const all = Array.from(runtime.entries());
  if (!enabledTools || enabledTools.length === 0) return all; // default: all on
  const allow = new Set(enabledTools);
  return all.filter(([name]) => allow.has(name));
}

function parseToolArgs(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      // fall through
    }
  }
  return {};
}

function stringifyToolResult(result: any): string {
  if (!result || !Array.isArray(result.content)) {
    return JSON.stringify(result ?? {}, null, 2);
  }
  const textBlocks = result.content
    .filter((item: any) => item?.type === "text" && typeof item.text === "string")
    .map((item: any) => item.text);
  return textBlocks.length > 0 ? textBlocks.join("\n") : JSON.stringify(result, null, 2);
}

/* ------------------------------------------------------------------ */
/* Ollama branch                                                       */
/* ------------------------------------------------------------------ */

function toOllamaTool(name: string, tool: RegisteredTool): OllamaTool {
  return {
    type: "function",
    function: {
      name,
      description: tool.description,
      parameters: { type: "object", ...(tool.inputSchema ?? {}) },
    },
  };
}

async function runOllama(
  body: UnifiedChatRequest,
  selected: Array<[string, RegisteredTool]>
): Promise<UnifiedChatResponse> {
  const model = body.model || "llama3.1";
  const runtime = new Map(selected);
  const availableTools = Array.from(runtime.keys());
  const tools = selected.map(([name, tool]) => toOllamaTool(name, tool));

  // Prepend the system instruction as a system message if provided.
  const baseMessages: any[] = Array.isArray(body.messages) ? [...body.messages] : [];
  const messages: any[] = body.system
    ? [{ role: "system", content: body.system }, ...baseMessages]
    : baseMessages;

  const common = {
    model,
    tools,
    stream: false as const,
    ...(body.options ? { options: body.options as any } : {}),
    ...(body.think ? { think: body.think } : {}),
    ...(body.format ? { format: body.format } : {}),
  };

  const first = await ollama.chat({ ...common, messages });
  const toolCalls = first.message?.tool_calls ?? [];

  if (toolCalls.length === 0) {
    return {
      ...(first as any),
      created_at: first?.created_at ? new Date(first.created_at).toISOString() : undefined,
      provider: "ollama",
      message: { role: "assistant", content: first.message?.content ?? "" },
      toolCalls,
      toolTrace: [],
      availableTools,
    };
  }

  const followUp: any[] = [...messages, first.message as any];
  const toolTrace: ToolTrace[] = [];

  for (const call of toolCalls) {
    const args = parseToolArgs(call.function.arguments);
    const entry = runtime.get(call.function.name);
    const toolResult = entry
      ? await entry.handler(args)
      : {
          isError: true,
          content: [{ type: "text", text: JSON.stringify({ error: `Tool '${call.function.name}' not found` }) }],
        };
    const resultText = stringifyToolResult(toolResult);
    toolTrace.push({ name: call.function.name, args, result: resultText, isError: toolResult.isError });
    followUp.push({ role: "tool", tool_name: call.function.name, content: resultText });
  }

  const final = await ollama.chat({ ...common, messages: followUp });

  return {
    ...(final as any),
    created_at: final?.created_at ? new Date(final.created_at).toISOString() : undefined,
    provider: "ollama",
    message: { role: "assistant", content: final.message?.content ?? "" },
    toolCalls,
    toolTrace,
    availableTools,
  };
}

/* ------------------------------------------------------------------ */
/* Anthropic branch                                                    */
/* ------------------------------------------------------------------ */

function toAnthropicTool(name: string, tool: RegisteredTool) {
  const schema = (tool.inputSchema ?? {}) as Record<string, unknown>;
  return {
    name,
    description: tool.description ?? "",
    input_schema: { type: "object" as const, ...schema },
  };
}

// Convert the chat transcript (role/content) to Anthropic message blocks.
function toAnthropicMessages(messages: any[]): Anthropic.MessageParam[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : String(m.content ?? ""),
    }));
}

async function runAnthropic(
  body: UnifiedChatRequest,
  selected: Array<[string, RegisteredTool]>
): Promise<UnifiedChatResponse> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const model = body.anthropicModel || body.model || "claude-haiku-4-5-20251001";
  const runtime = new Map(selected);
  const availableTools = Array.from(runtime.keys());
  const tools = selected.map(([name, tool]) => toAnthropicTool(name, tool));

  const messages: Anthropic.MessageParam[] = toAnthropicMessages(
    Array.isArray(body.messages) ? body.messages : []
  );

  const toolTrace: ToolTrace[] = [];
  const toolCalls: ToolCall[] = [];
  let guard = 0;

  let response = await client.messages.create({
    model,
    max_tokens: 1024,
    ...(body.system ? { system: body.system } : {}),
    ...(tools.length > 0 ? { tools } : {}),
    messages,
  });

  // Loop while Claude requests tools. Cap iterations to avoid runaway loops.
  while (response.stop_reason === "tool_use" && guard < 8) {
    guard += 1;

    const toolUses = response.content.filter(
      (block: any) => block.type === "tool_use"
    ) as Anthropic.ToolUseBlock[];

    // Record the assistant turn (with its tool_use blocks) verbatim.
    messages.push({ role: "assistant", content: response.content });

    const resultBlocks: Anthropic.ToolResultBlockParam[] = [];

    for (const use of toolUses) {
      const args = (use.input ?? {}) as Record<string, unknown>;
      toolCalls.push({ function: { name: use.name, arguments: args } } as any);

      const entry = runtime.get(use.name);
      const toolResult = entry
        ? await entry.handler(args)
        : {
            isError: true,
            content: [{ type: "text", text: JSON.stringify({ error: `Tool '${use.name}' not found` }) }],
          };
      const resultText = stringifyToolResult(toolResult);
      toolTrace.push({ name: use.name, args, result: resultText, isError: toolResult.isError });

      resultBlocks.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: resultText,
        ...(toolResult.isError ? { is_error: true } : {}),
      });
    }

    // Feed all tool results back as a single user turn.
    messages.push({ role: "user", content: resultBlocks });

    response = await client.messages.create({
      model,
      max_tokens: 1024,
      ...(body.system ? { system: body.system } : {}),
      ...(tools.length > 0 ? { tools } : {}),
      messages,
    });
  }

  const text = response.content
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text)
    .join("\n");

  return {
    provider: "anthropic",
    model,
    created_at: new Date().toISOString(),
    message: { role: "assistant", content: text },
    done: true,
    toolCalls,
    toolTrace,
    availableTools,
  } as UnifiedChatResponse;
}

/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as UnifiedChatRequest;
    const provider: Provider = body.provider === "anthropic" ? "anthropic" : "ollama";
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const runtime = await createToolRuntime();
    const selected = selectTools(runtime, body.enabledTools);

    const result =
      provider === "anthropic"
        ? await runAnthropic(body, selected)
        : await runOllama(body, selected);

    return NextResponse.json(result);
  } catch (error) {
    console.error("chat route error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
