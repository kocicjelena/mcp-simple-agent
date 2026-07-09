// Web Worker: streams /api/chat responses off the main thread.
// Posts incremental tokens back via postMessage so the UI stays responsive.
//
// Protocol (main → worker):  { type: "start", payload: ChatRequest }
// Protocol (worker → main):  { type: "token", token: "..." }
//                             { type: "done",  response: ChatResponse }
//                             { type: "error", error: "..." }

import type {
  ChatRequest,
  ChatResponse,
  WorkerRequestMessage,
  WorkerOutMessage,
} from "./lib/types/chat";

function post(msg: WorkerOutMessage) {
  postMessage(msg);
}

async function streamChat(request: ChatRequest) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    post({ type: "error", error: `${res.status}: ${text}` });
    return;
  }

  if (!res.body) {
    post({ type: "error", error: "Response body is null — streaming not supported" });
    return;
  }

  // Pipe through TextDecoderStream → split on newlines → parse JSON chunks
  const reader = res.body
    .pipeThrough(new TextDecoderStream())
    .getReader();

  let buffer = "";
  let lastChunk: ChatResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += value;

    // Ollama streams NDJSON — one JSON object per line
    const lines = buffer.split("\n");
    // Keep the last (possibly incomplete) line in the buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const chunk: ChatResponse = JSON.parse(trimmed);
        lastChunk = chunk;

        // Post each token as it arrives
        if (chunk.message?.content) {
          post({ type: "token", token: chunk.message.content });
        }

        // Final chunk has done: true with stats
        if (chunk.done) {
          post({ type: "done", response: chunk });
          return;
        }
      } catch {
        // Incomplete JSON — will be completed in the next read
        buffer = trimmed + "\n" + buffer;
        break;
      }
    }
  }

  // If we exit the loop without a done chunk, send what we have
  if (lastChunk) {
    post({ type: "done", response: lastChunk });
  } else {
    post({ type: "error", error: "Stream ended without a response" });
  }
}

addEventListener("message", (event: MessageEvent<WorkerRequestMessage>) => {
  const msg = event.data;

  if (msg.type === "start") {
    streamChat(msg.payload).catch((err) => {
      post({ type: "error", error: err instanceof Error ? err.message : String(err) });
    });
  }
});
