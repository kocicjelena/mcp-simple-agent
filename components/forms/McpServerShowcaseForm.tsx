"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

function normalizeType(prop?: ToolProperty): string {
  if (!prop?.type) return "string";
  if (Array.isArray(prop.type)) {
    return prop.type.find((entry) => entry !== "null") ?? "string";
  }
  return prop.type;
}

function parseArgValue(raw: string, prop?: ToolProperty): unknown {
  const normalized = normalizeType(prop);

  if (normalized === "number" || normalized === "integer") {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) throw new Error(`Expected ${normalized} but got '${raw}'`);
    return parsed;
  }

  if (normalized === "boolean") {
    if (raw !== "true" && raw !== "false") {
      throw new Error("Expected boolean value true/false");
    }
    return raw === "true";
  }

  return raw;
}

function createArgsMapForTool(
  tool: ToolOption | null,
  current: Record<string, string> = {}
): Record<string, string> {
  const next: Record<string, string> = {};
  Object.keys(tool?.inputSchema?.properties ?? {}).forEach((key) => {
    next[key] = current[key] ?? "";
  });
  return next;
}

export default function McpServerShowcaseForm() {
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [selectedToolName, setSelectedToolName] = useState("");
  const [message, setMessage] = useState("");
  const [argsMap, setArgsMap] = useState<Record<string, string>>({});
  const [loadingTools, setLoadingTools] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolCallResponse | null>(null);
  const selectedToolNameRef = useRef("");

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.name === selectedToolName) ?? null,
    [tools, selectedToolName]
  );

  const properties = useMemo(() => selectedTool?.inputSchema?.properties ?? {}, [selectedTool]);
  const required = selectedTool?.inputSchema?.required ?? [];

  const fetchTools = useCallback(async () => {
    const response = await fetch("/api/mcpserver-client");
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error ?? response.statusText);
    }

    return (data?.tools ?? []) as ToolOption[];
  }, []);

  const applyLoadedTools = useCallback((nextTools: ToolOption[]) => {
    const currentToolName = selectedToolNameRef.current;
    const nextToolName =
      currentToolName && nextTools.some((tool) => tool.name === currentToolName)
        ? currentToolName
        : nextTools[0]?.name ?? "";
    const nextTool = nextTools.find((tool) => tool.name === nextToolName) ?? null;

    selectedToolNameRef.current = nextToolName;
    setTools(nextTools);
    setSelectedToolName(nextToolName);
    setArgsMap((current) => createArgsMapForTool(nextTool, current));
  }, []);

  const loadTools = useCallback(async () => {
    setLoadingTools(true);
    setError(null);

    try {
      const nextTools = await fetchTools();
      applyLoadedTools(nextTools);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingTools(false);
    }
  }, [applyLoadedTools, fetchTools]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialTools() {
      try {
        const nextTools = await fetchTools();
        if (!ignore) {
          applyLoadedTools(nextTools);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!ignore) {
          setLoadingTools(false);
        }
      }
    }

    void loadInitialTools();

    return () => {
      ignore = true;
    };
  }, [applyLoadedTools, fetchTools]);

  const handleToolChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextToolName = event.target.value;
    const nextTool = tools.find((tool) => tool.name === nextToolName) ?? null;

    selectedToolNameRef.current = nextToolName;
    setSelectedToolName(nextToolName);
    setArgsMap((current) => createArgsMapForTool(nextTool, current));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      if (!selectedToolName) {
        throw new Error("Select a tool first");
      }

      const parsedArgs: Record<string, unknown> = {};

      for (const [key, prop] of Object.entries(properties)) {
        const raw = argsMap[key]?.trim() ?? "";

        if (!raw) {
          if (required.includes(key)) {
            throw new Error(`Field '${key}' is required`);
          }
          continue;
        }

        parsedArgs[key] = parseArgValue(raw, prop);
      }

      const response = await fetch("/api/mcpserver-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: selectedToolName,
          args: parsedArgs,
          message,
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

  return (
  <>
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        maxWidth: 820,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <strong>Registered MCP tools</strong>
        <button type="button" onClick={loadTools} disabled={loadingTools}>
          {loadingTools ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <label>
        Choose Tool *
        <select
          value={selectedToolName}
          onChange={handleToolChange}
          required
          style={{ width: "100%", marginTop: 4 }}
        >
          {tools.length === 0 ? (
            <option value="">{loadingTools ? "Loading tools..." : "No tools found"}</option>
          ) : null}
          {tools.map((tool) => (
            <option key={tool.name} value={tool.name}>
              {tool.name}
            </option>
          ))}
        </select>
      </label>

      {selectedTool?.description ? (
        <div style={{ color: "#a1a1aa", border: "1px solid #27272a", padding: 10 }}>
          {selectedTool.description}
        </div>
      ) : null}

      <label>
        Message
        <textarea
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Optional note for the response wrapper"
          style={{ width: "100%", marginTop: 4 }}
        />
      </label>

      {Object.keys(properties).length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <strong>Tool Arguments</strong>
          {Object.entries(properties).map(([key, prop]) => {
            const normalizedType = normalizeType(prop);
            const isRequired = required.includes(key);
            const currentValue = argsMap[key] ?? "";

            if (normalizedType === "boolean") {
              return (
                <label key={key}>
                  {key} {isRequired ? "*" : ""}
                  <select
                    value={currentValue}
                    onChange={(event) =>
                      setArgsMap((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                    style={{ width: "100%", marginTop: 4 }}
                  >
                    <option value="">Select value</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                  {prop.description ? (
                    <small style={{ display: "block", color: "#71717a" }}>
                      {prop.description}
                    </small>
                  ) : null}
                </label>
              );
            }

            return (
              <label key={key}>
                {key} {isRequired ? "*" : ""}
                <input
                  type={normalizedType === "number" || normalizedType === "integer" ? "number" : "text"}
                  value={currentValue}
                  onChange={(event) =>
                    setArgsMap((prev) => ({ ...prev, [key]: event.target.value }))
                  }
                  style={{ width: "100%", marginTop: 4 }}
                />
                {prop.description ? (
                  <small style={{ display: "block", color: "#71717a" }}>
                    {prop.description}
                  </small>
                ) : null}
              </label>
            );
          })}
        </div>
      ) : (
        <div style={{ color: "#71717a" }}>Selected tool has no input arguments.</div>
      )}

      {error ? (
        <div role="alert" style={{ color: "#fecdd3", border: "1px solid #7f1d1d", padding: 10 }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ background: "#18181b", padding: 12, whiteSpace: "pre-wrap" }}>
            {result.answer}
          </div>
          <details>
            <summary>Raw tool result</summary>
            <pre style={{ background: "#18181b", padding: 10, overflowX: "auto" }}>
              {JSON.stringify(result.toolResult, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}

      <button type="submit" disabled={submitting || !selectedToolName}>
        {submitting ? "Calling tool..." : "Run MCP Tool"}
      </button>
    </form>
    </>
  );
}
