/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import ToolForm from "../ToolForm";

export type ToolInfo = {
  name: string;
  description?: string;
};

/**
 * Per-conversation tool toggles. Reads the MCP server's registered tools via
 * the in-app client route (GET returns { tools: [{ name, description }] }),
 * and reports the checked set upward. An empty set means "all tools" on the
 * server side, but here we default to everything checked for clarity.
 */
export default function ToolChecklist({
  enabled,
  onChange,
  endpoint = "/api/apptool",
}: {
  enabled: string[];
  onChange: (next: string[]) => void;
  endpoint?: string;
}) {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? res.statusText);

      const next: ToolInfo[] = (data?.tools ?? []).map((t: any) => ({
        name: t.name,
        description: t.description,
      }));
      setTools(next);

      // Default: enable all discovered tools the first time we load.
      if (enabled.length === 0 && next.length > 0) {
        onChange(next.map((t) => t.name));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   loadTools();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const toggle = (name: string) => {
    onChange(
      enabled.includes(name) ? enabled.filter((n) => n !== name) : [...enabled, name]
    );
  };

  const allChecked = tools.length > 0 && tools.every((t) => enabled.includes(t.name));
  const setAll = (on: boolean) => onChange(on ? tools.map((t) => t.name) : []);

    
  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>Tools for this conversation</strong>
        <button type="button" onClick={loadTools} disabled={loading} style={{ padding: "2px 8px" }}>
          {loading ? "…" : "Refresh"}
        </button>
        {tools.length > 0 ? (
          <button type="button" onClick={() => setAll(!allChecked)} style={{ padding: "2px 8px" }}>
            {allChecked ? "Uncheck all" : "Check all"}
          </button>
        ) : null}
      </div>

      {error ? <span style={{ color: "#b02020", fontSize: 12 }}>{error}</span> : null}

      {tools.length === 0 && !loading ? (
        <span style={{ fontSize: 12, color: "#666" }}>No tools registered.</span>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {tools.map((tool) => (
          <label key={tool.name} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={enabled.includes(tool.name)}
              onChange={() => toggle(tool.name)}
              style={{ marginTop: 3 }}
            />
            <span>
              <code>{tool.name}</code>
              {tool.description ? (
                <span style={{ color: "#666" }}> — {tool.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </div>
    <ToolForm />
    </>
  );
}
