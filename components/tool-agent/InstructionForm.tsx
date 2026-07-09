/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

/**
 * Instruction maker — the system-prompt sibling of ToolForm.
 * Saves a named instruction preset (persisted via /api/instructions) and
 * reports the saved preset back so the parent can select it immediately.
 */
export default function InstructionForm({
  onSaved,
}: {
  onSaved?: (preset: { id: string; name: string; instructions: string }) => void;
}) {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedName(null);

    try {
      const res = await fetch("/api/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, instructions }),
      });

      const data: any = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setSavedName(data.name);
      onSaved?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        Preset name *
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. concise-planner"
          style={{ padding: 6 }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        Agent instructions *
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          required
          rows={6}
          placeholder="You are an agent that starts each sentence with one action verb. Prefer using registered tools over guessing."
          style={{ padding: 6, fontFamily: "monospace", fontSize: 13 }}
        />
      </label>

      {error ? (
        <div role="alert" style={{ color: "#b02020", border: "1px solid #b02020", padding: 8 }}>
          {error}
        </div>
      ) : null}

      {savedName ? (
        <div style={{ background: "#e6ffe6", padding: 8, border: "1px solid green" }}>
          Saved instruction preset — <code>{savedName}</code>
        </div>
      ) : null}

      <button type="submit" disabled={loading} style={{ padding: "8px 16px", alignSelf: "flex-start" }}>
        {loading ? "Saving…" : "Save Instructions"}
      </button>
    </form>
  );
}
