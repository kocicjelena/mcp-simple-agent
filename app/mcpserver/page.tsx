import Link from "next/link";
import McpServerShowcaseForm from "@/components/forms/McpServerShowcaseForm";

export default function McpServerPage() {
  return (
    <div style={{ color: "#a78bfa" }}>
      MCP Server - showcase tools calling 
      <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
        A local App Router MCP endpoint with small built-in tools.
      </p>
      <McpServerShowcaseForm />
      <p style={{ marginTop: "1.25rem" }}>
        <Link href="/" style={{ color: "#a78bfa" }}>
          Back
        </Link>
      </p>
    </div>
  );
}
