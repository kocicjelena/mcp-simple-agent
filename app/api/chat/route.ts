/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@/lib/types/chat";
import { ApiError } from "@/lib/errors";

// Set OLLAMA_API_KEY in your .env.local, e.g.:
const SITE_URL = "http://localhost:11434";
//const SITE_URL = process.env.OLLAMA_API_URL;

export async function POST(req: NextRequest) {
  if (!SITE_URL) {
    return NextResponse.json(
      { error: "OLLAMA_API_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const body: ChatRequest = await req.json();

    const response = await fetch(`${SITE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    // Streaming: pipe the Ollama NDJSON stream straight through
    if (body.stream !== false && response.body) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Transfer-Encoding": "chunked",
        },
      });
    }
console.log(response.body, 'resp')
  const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }
        const myreader = response.body?.getReader();

   const stream = async function* (reader:any) {

    const decoder = new TextDecoder();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value); 
    }
  }
    const data: any = await stream(myreader)
    // Non-streaming: return single JSON object
   // const data: ChatResponse = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
