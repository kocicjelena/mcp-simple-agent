"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { parseApiError } from "@/lib/errors";
import type { ChatRequest, ChatResponse, ChatMessage } from "@/lib/types/chat";
import styles from '@/page.module.css';

// ── Tool-call types ────────────────────────────────────────────────────────────
interface ToolCallArguments {
  [key: string]: unknown;
}

interface ToolCall {
  id?: string;
  type?: string;
  function?: {
    name: string;
    arguments: string | ToolCallArguments;
  };
  result?: unknown;
}

// ── ToolCallItem: one collapsible tool call ────────────────────────────────────
function ToolCallItem({ tc, index }: { tc: ToolCall; index: number }) {
  const [open, setOpen] = useState(false);

  const name = tc.function?.name ?? tc.type ?? `tool_call_${index}`;

  const parsedArgs: ToolCallArguments =
    typeof tc.function?.arguments === "string"
      ? (() => {
          try {
            return JSON.parse(tc.function!.arguments as string);
          } catch {
            return { raw: tc.function!.arguments };
          }
        })()
      : (tc.function?.arguments as ToolCallArguments) ?? {};

  return (
    <div
      className={styles.title}>
  
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          background: "#f6f8fa",
          border: "none",
          borderBottom: open ? "1px solid #d0d7de" : "none",
          padding: "4px 8px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "0.75em", color: "#888" }}>{open ? "▾" : "▸"}</span>
        <span
          style={{
            background: "#ddf4ff",
            color: "#0969da",
            borderRadius: 4,
            padding: "1px 6px",
            fontWeight: 600,
          }}
        >
          {name}
        </span>
        {tc.id && (
          <span style={{ color: "#aaa", fontSize: "0.85em" }}>#{tc.id}</span>
        )}
      </button>

      {/* Collapsible body */}
      {open && (
        <div
          style={{
            padding: "6px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Arguments */}
          {Object.keys(parsedArgs).length > 0 && (
            <div>
              <div style={{ color: "#57606a", fontWeight: 600, marginBottom: 4 }}>
                Arguments
              </div>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  {Object.entries(parsedArgs).map(([k, v]) => (
                    <tr key={k}>
                      <td
                        style={{
                          color: "#6639ba",
                          paddingRight: 12,
                          paddingBottom: 2,
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {k}
                      </td>
                      <td style={{ color: "#1f2328", wordBreak: "break-word" }}>
                        {typeof v === "object"
                          ? JSON.stringify(v, null, 2)
                          : String(v)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Result */}
          {tc.result !== undefined && (
            <div>
              <div style={{ color: "#4576ad", fontWeight: 600, marginBottom: 4 }}>
                Result
              </div>
              <pre
                style={{
                  margin: 0,
                  background: "#4090af",
                  border: "1px solid #b7f0c8",
                  borderRadius: 4,
                  padding: "4px 8px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "#25a08f",
                }}
              >
                {typeof tc.result === "string"
                  ? tc.result
                  : JSON.stringify(tc.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ToolForm ??
// ── ToolCallsBlock: renders a list of tool calls ───────────────────────────────
function ToolCallsBlock({ toolCalls }: { toolCalls: ToolCall[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
      {toolCalls.map((tc, i) => (
        <ToolCallItem key={tc.id ?? i} tc={tc} index={i} />
      ))}
    </div>
  );
}

const DEFAULT_MODEL = "";

export default function ChatForm() {
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !model.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const payload: ChatRequest = {
        model,
        messages: updatedMessages,
        stream: true,
      };

      const data = await apiClient<ChatRequest, ChatResponse>(
        "/api/chat",
        "POST",
        payload
      );

      if (data.done && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
    <div className={styles.intro}>
      {/* Model selector */}
      <label>
       <p>Model *</p> 
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. llama3.2, mistral, phi4"
          required
          className={styles.model}
        />
      </label>

      {/* Conversation history */}
      {messages.length > 0 && (
        <div
          style={{
            border: "1px solid #838ef0",
            borderRadius: 4,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          {messages.map((msg, i) => (
            <div key={i}>
              <strong style={{ textTransform: "capitalize" }}>{msg.role}:</strong>
              {msg.thinking && (
                <details style={{ color: "#888", fontSize: "0.85em", marginTop: 2 }}>
                  <summary>Thinking</summary>
                  <pre style={{ whiteSpace: "pre-wrap" }}>{msg.thinking}</pre>
                </details>
              )}
              <p style={{ margin: "2px 0 0" }}>{msg.content}</p>
              {msg.tool_calls && msg.tool_calls.length > 0 && (
                <ToolCallsBlock toolCalls={msg.tool_calls as ToolCall[]} />
              )}
            </div>
          ))}
          {loading && <p style={{ color: "#888" }}>Assistant is thinking…</p>}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{ color: "#ff3300", border: "1px solid red", padding: 8, borderRadius: 4 }}
        >
          {error}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={loading}
          required
          className={styles.main2}
        />
        <button type="submit" disabled={loading || !model.trim()} className={styles.main2}>
          {loading ? "Sending…" : "Send"}
        </button>
      </form>

      {messages.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.main2}>
        
          Clear conversation
        </button>
      )}
    </div>
    </>
  );
}
