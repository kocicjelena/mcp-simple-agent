/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { parseApiError } from "@/lib/errors";
import styles from '@/page.module.css';

export default function ToolForm({
  onSuccess,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (result: any) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [properties, setProperties] = useState("{}");
  const [required, setRequired] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let parsedProperties: Record<string, unknown>;
      try {
        parsedProperties = JSON.parse(properties);
      } catch {
        throw new Error("Properties must be valid JSON");
      }

      const body = JSON.stringify({
        name,
        description,
        properties: parsedProperties,
        required: required ? required.split(",").map((s) => s.trim()) : [],
      });

      const res = await fetch("/api/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error((data as any).error || "Request failed");
      }

      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form
      onSubmit={handleSubmit}
      className={styles.form}>
      <label>
        Name *
        <input
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. get_weather"
          className={styles.main2}
        />
      </label>

      <label>
        Description *
        <input
          name="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="What this tool does"
          className={styles.main2}
        />
      </label>

      <label>
        Properties (JSON) *
        <textarea
          name="properties"
          value={properties}
          onChange={(e) => setProperties(e.target.value)}
          required
          rows={6}
          placeholder='{"location": {"type": "string", "description": "City name"}}'
           className={styles.main2}        />
      </label>

      <label>
        Required fields (comma-separated)
        <input
          name="required"
          type="text"
          value={required}
          onChange={(e) => setRequired(e.target.value)}
          placeholder="location, unit"
          className={styles.main2}
        />
      </label>

      {error && (
        <div role="alert" style={{ color: "red", border: "1px solid red", padding: 8 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: "#e6ffe6", padding: 8, border: "1px solid green" }}>
          Tool created — <code>{result.name}</code>
        </div>
      )}

      <button type="submit" disabled={loading} className={styles.dugme}>
        {loading ? "Creating…" : "Create Tool"}
      </button>
    </form>
    </>
  );
}
