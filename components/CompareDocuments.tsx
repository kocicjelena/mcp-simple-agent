"use client";

import { useEffect, useMemo, useState,useCallback } from "react";
import * as mammoth from "mammoth";

type ToolProperty = {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
};

type ToolInputSchema = {
  type?: string;
  properties?: Record<string, ToolProperty>;
  required?: string[];
};

type ToolOption = {
  name: string;
  description?: string;
  inputSchema?: ToolInputSchema;
};

type ToolCallResponse = {
  answer: string;
  toolName: string;
  toolText: string;
  toolResult: unknown;
};

type Slot = "A" | "B";

const SUPPORTED_UPLOAD_REGEX = /\.(doc|docx|txt|md)$/i;
const COMPARE_TOOL_NAME = "compare";

function cleanMarkdown(text: string): string {
  let t = text;
  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/`([^`]+)`/g, "$1");
  t = t.replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/^[ \t]*[-*+]\s+/gm, "");
  t = t.replace(/^[ \t]*\d+\.\s+/gm, "");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || name;
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    return readAsText(file);
  }

  if (ext === "md") {
    const raw = await readAsText(file);
    return cleanMarkdown(raw);
  }

  if (ext === "doc" || ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error(`Unsupported format: .${ext ?? "unknown"}`);
}

export default function CompareDocuments() {
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [compareAvailable, setCompareAvailable] = useState(false);
  const [loadingTools, setLoadingTools] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingSlot, setProcessingSlot] = useState<Slot | null>(null);

  const [titleA, setTitleA] = useState("");
  const [titleB, setTitleB] = useState("");
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolCallResponse | null>(null);

  const bothReady = useMemo(
    () => textA.trim().length > 0 && textB.trim().length > 0,
    [textA, textB]
  );

  // const loadTools = async () => {
  //   setLoadingTools(true);
  //   setError(null);

  //   try {
  //     const response = await fetch("/api/apptool");
  //     const data = await response.json().catch(() => null);

  //     if (!response.ok) {
  //       throw new Error(data?.error ?? response.statusText);
  //     }

  //     const nextTools = (data?.tools ?? []) as ToolOption[];
  //     setTools(nextTools);
  //     setCompareAvailable(nextTools.some((tool) => tool.name === COMPARE_TOOL_NAME));
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : String(err));
  //   } finally {
  //     setLoadingTools(false);
  //   }
  // };

  const loadTools = useCallback(async () => {
    setLoadingTools(true);
    setError(null);

    try {
      const response = await fetch("/api/apptool");
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? response.statusText);
      }

      const nextTools = (data?.tools ?? []) as ToolOption[];
      setTools(nextTools);
      setCompareAvailable(nextTools.some((tool) => tool.name === COMPARE_TOOL_NAME));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingTools(false);
    }
  
  }, []);

  const handleFileInput = async (slot: Slot, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!SUPPORTED_UPLOAD_REGEX.test(file.name)) {
      setError("Upload a .doc, .docx, .txt, or .md file.");
      return;
    }

    setProcessingSlot(slot);
    setError(null);

    try {
      const text = (await extractText(file)).trim();
      const title = titleFromFilename(file.name);

      if (slot === "A") {
        setTextA(text);
        setTitleA(title);
      } else {
        setTextB(text);
        setTitleB(title);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessingSlot(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      if (!bothReady) {
        throw new Error("Upload two documents (or paste text) before comparing.");
      }

      const response = await fetch("/api/apptool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: COMPARE_TOOL_NAME,
          args: {
            textA,
            textB,
            titleA: titleA || "Document A",
            titleB: titleB || "Document B",
          },
          message: `Compare "${titleA || "Document A"}" against "${titleB || "Document B"}"`,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? response.statusText);
      }

      setResult(data as ToolCallResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderSlot = (slot: Slot) => {
    const title = slot === "A" ? titleA : titleB;
    const setTitle = slot === "A" ? setTitleA : setTitleB;
    const text = slot === "A" ? textA : textB;
    const setText = slot === "A" ? setTextA : setTextB;

    return (
 
      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 8 }}>
        <strong>Document {slot}</strong>

        <label>
          Upload File
          <input
            type="file"
            accept=".doc,.docx,.txt,.md"
            onChange={(event) => handleFileInput(slot, event)}
          />
        </label>
        {processingSlot === slot ? (
          <small style={{ color: "#666" }}>Extracting text...</small>
        ) : null}

        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`Document ${slot}`}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Extracted / Pasted Text
          <textarea
            rows={10}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Upload a file to auto-fill, or paste text here."
            style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
          />
        </label>
      </div>
    );
  };

  return (
         <>
      <button onClick={() => loadTools()}>tools</button>
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 960, margin: "0 auto" }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <strong>Registered MCP tools</strong>
        <button type="button" onClick={loadTools} disabled={loadingTools}>
          {loadingTools ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {!loadingTools && !compareAvailable ? (
        <div style={{ color: "#664d03", background: "#fff3cd", border: "1px solid #ffecb5", padding: 8 }}>
          The <code>{COMPARE_TOOL_NAME}</code> tool was not found on the MCP server. Register it
          (registerCompareTool) and refresh. Found tools: {tools.map((tool) => tool.name).join(", ") || "none"}.
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {renderSlot("A")}
        {renderSlot("B")}
      </div>

      {error ? (
        <div role="alert" style={{ color: "#842029", background: "#f8d7da", border: "1px solid #f5c2c7", padding: 8 }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12 }}>
            {result.toolText || result.answer}
          </div>
          <details>
            <summary>Raw tool result</summary>
            <pre style={{ background: "#f0f0f0", padding: 8, fontSize: 12, overflowX: "auto" }}>
              {JSON.stringify(result.toolResult, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}

      <button type="submit" disabled={submitting || !bothReady || processingSlot !== null}>
        {submitting ? "Comparing..." : "Compare Documents"}
      </button>
    </form>
    </>
  );
}
