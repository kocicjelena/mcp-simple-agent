/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProviderModelPicker, { type Provider } from "./ProviderModelPicker";
import InstructionForm from "./InstructionForm";
import ToolChecklist from "./ToolChecklist";
// Reuse your existing tool maker unchanged.
import ToolForm from "@/components/ToolForm";
import { useContextState } from "@/globalx/GlobalContext";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ToolTrace = {
  name: string;
  args: Record<string, unknown>;
  result: string;
  isError?: boolean;
};

type InstructionPreset = { id: string; name: string; instructions: string };

/**
 * AgentChat — one surface to chat against either Ollama or Anthropic, driven by
 * saved instruction presets and a per-conversation tool selection. All calls go
 * to the unified POST /api/chat route, which returns a provider-agnostic shape:
 *   { message: { content }, toolTrace[], availableTools[] }
 */

export default function AgentChat() {
 const { agent} = useContextState();
  const [provider, setProvider] = useState<Provider>("ollama");
  const [model, setModel] = useState("llama3.1");

  const [instructionPresets, setInstructionPresets] = useState<InstructionPreset[]>([]);
  const [selectedInstructionId, setSelectedInstructionId] = useState("");
  const [systemText, setSystemText] = useState("");

  const [enabledTools, setEnabledTools] = useState<string[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [lastTrace, setLastTrace] = useState<ToolTrace[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showToolMaker, setShowToolMaker] = useState(false);
  const [showInstructionMaker, setShowInstructionMaker] = useState(false);

  const threadRef = useRef<HTMLDivElement | null>(null);

  const loadInstructions2 = useCallback(async () => {
    try {
      const res = await fetch("/api/instructions");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? res.statusText);
      setInstructionPresets(data?.instructions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
},[]);

  useEffect(() => {
     async function loadInstructions() {
       try {
      const res = await fetch("/api/instructions");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? res.statusText);
      setInstructionPresets(data?.instructions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    }
     loadInstructions();
     //loadInstructionPresets()
  }, []); 

  // useEffect(() => {
  //   loadInstructions();
  // }, []);

  useEffect(() => {
      async function loadInstructionsPresets() {
    const preset = instructionPresets.find((p) => p.id === selectedInstructionId);
    if (preset) setSystemText(preset.instructions);
      }
      loadInstructionsPresets();
  }, [selectedInstructionId, instructionPresets]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, lastTrace]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);
    setLastTrace([]);

    try {
      const res = await fetch("/api/chatai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model:agent.modelnpm r,
          //model: provider === "ollama" ? model : undefined,
          anthropicModel: provider === "anthropic" ? model : undefined,
          system: systemText || undefined,
          enabledTools,
          messages: nextMessages,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? res.statusText);

      const content: string = data?.message?.content ?? "";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      setLastTrace(Array.isArray(data?.toolTrace) ? data.toolTrace : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
    <h1>Agent is decision-maker and the tools are his powers</h1>
    <div style={{ display: "flex", gap: 20, maxWidth: 1100, margin: "0 auto", alignItems: "flex-start" }}>
      {/* Sidebar: configuration */}
      <aside style={{ width: 340, display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>
        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
          <h3 style={{ margin: "0 0 10px" }}>Model</h3>
          <ProviderModelPicker
            provider={provider}
            onProviderChange={setProvider}
            model={model}
            onModelChange={setModel}
          />
        </section>

        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Instructions</h3>
            <button type="button" onClick={() => setShowInstructionMaker((v) => !v)} style={{ padding: "2px 8px" }}>
              {showInstructionMaker ? "Close" : "New"}
            </button>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginTop: 8 }}>
            Preset
            <select
              value={selectedInstructionId}
              onChange={(e) => setSelectedInstructionId(e.target.value)}
              style={{ padding: 6 }}
            >
              <option value="">(none)</option>
              {instructionPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <textarea
            value={systemText}
            onChange={(e) => setSystemText(e.target.value)}
            rows={4}
            placeholder="System instructions passed to the agent…"
            style={{ width: "100%", marginTop: 8, padding: 6, fontSize: 13, fontFamily: "monospace" }}
          />

          {showInstructionMaker ? (
            <div style={{ marginTop: 10, borderTop: "1px dashed #ccc", paddingTop: 10 }}>
              <InstructionForm
                onSaved={async (preset) => {
                  await loadInstructions2();
                  setSelectedInstructionId(preset.id);
                  setShowInstructionMaker(false);
                }}
              />
            </div>
          ) : null}
        </section>

        <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Tools</h3>
            <button type="button" onClick={() => setShowToolMaker((v) => !v)} style={{ padding: "2px 8px" }}>
              {showToolMaker ? "Close" : "New"}
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <ToolChecklist enabled={enabledTools} onChange={setEnabledTools} />
          </div>

          {showToolMaker ? (
            <div style={{ marginTop: 10, borderTop: "1px dashed #ccc", paddingTop: 10 }}>
              {/* Your existing ToolForm posts to /api/tool */}
              <ToolForm onSuccess={() => setShowToolMaker(false)} />
            </div>
          ) : null}
        </section>
      </aside>

      {/* Main: chat thread */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
        <div
          ref={threadRef}
          style={{
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: 14,
            height: 460,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: "#fafafa",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: "#888", fontSize: 14 }}>
              Start chatting. The agent uses your selected instructions and enabled tools.
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                background: m.role === "user" ? "#d6e4ff" : "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                padding: "8px 12px",
                whiteSpace: "pre-wrap",
                fontSize: 14,
              }}
            >
              {m.content}
            </div>
          ))}

          {sending ? <div style={{ color: "#888", fontSize: 13 }}>Thinking…</div> : null}
        </div>

        {lastTrace.length > 0 ? (
          <details style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10 }}>
            <summary style={{ cursor: "pointer" }}>
              Tool calls ({lastTrace.length})
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {lastTrace.map((t, i) => (
                <div key={i} style={{ borderLeft: `3px solid ${t.isError ? "#b02020" : "#2a7"}`, paddingLeft: 8 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 13 }}>
                    {t.name}({JSON.stringify(t.args)})
                  </div>
                  <pre style={{ margin: "4px 0 0", fontSize: 12, whiteSpace: "pre-wrap", color: "#333" }}>
                    {t.result}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {error ? (
          <div role="alert" style={{ color: "#b02020", border: "1px solid #b02020", padding: 8, borderRadius: 6 }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Message the agent… (Enter to send, Shift+Enter for newline)"
            style={{ flex: 1, padding: 8, fontSize: 14, resize: "vertical" }}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            style={{ padding: "0 20px", fontSize: 14 }}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </main>
    </div>
    
    </>
  );
}
