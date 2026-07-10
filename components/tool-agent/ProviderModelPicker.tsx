/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useContextActions } from "@/globalx/GlobalContext";
import { ChangeEvent, useEffect, useState } from "react";

export type Provider = "ollama" | "anthropic";

// Anthropic model options. Bare aliases track the newest snapshot; the pinned
// Haiku id is the cost-efficient default for development.
const ANTHROPIC_MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (fast, cheap)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
];

type Props = {
  provider: Provider;
  onProviderChange: (provider: Provider) => void;
  model: string;
  onModelChange: (model: string) => void;
};

export default function ProviderModelPicker({
  provider,
  onProviderChange,
  model,
  onModelChange,
}: Props) {
  const {setProvider}= useContextActions()
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOllamaModels = async () => {
    setLoading(true);
    setError(null);
    try {
      // Expects a route that returns { models: [{ name }] } — align with your
      // existing list endpoint (OptionModel.tsx used listModels()).
      const res = await fetch("/api/list");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? res.statusText);

      const names: string[] = (data?.models ?? data?.data ?? [])
        .map((m: any) => m?.name ?? m?.model)
        .filter(Boolean);
      setOllamaModels(names);

      if (names.length > 0 && !names.includes(model)) {
        onModelChange(names[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (provider === "ollama") {
      setProvider(provider)
     //loadOllamaModels();
    } else if (!ANTHROPIC_MODELS.some((m) => m.value === model)) {
      onModelChange(ANTHROPIC_MODELS[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const handleProvider = (e: ChangeEvent<HTMLSelectElement>) => {
    loadOllamaModels();
    onProviderChange(e.target.value as Provider);
  };

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <label style={{ display: "flex", flexDirection: "column", fontSize: 13, gap: 4 }}>
        Provider
        <select value={provider} onChange={handleProvider} style={{ padding: 6, minWidth: 140 }}>
          <option value="ollama">Ollama (local)</option>
          <option value="anthropic">Anthropic (Claude)</option>
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", fontSize: 13, gap: 4, flex: 1, minWidth: 220 }}>
        Model
        {provider === "ollama" ? (
          <div style={{ display: "flex", gap: 6 }}>
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              style={{ padding: 6, flex: 1 }}
            >
              {ollamaModels.length === 0 ? <option value="">No models found</option> : null}
              {ollamaModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button type="button" onClick={loadOllamaModels} disabled={loading} style={{ padding: "6px 10px" }}>
              {loading ? "…" : "↻"}
            </button>
          </div>
        ) : (
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            style={{ padding: 6 }}
          >
            {ANTHROPIC_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </label>

      {error ? <span style={{ color: "#b02020", fontSize: 12 }}>{error}</span> : null}
    </div>
  );
}
