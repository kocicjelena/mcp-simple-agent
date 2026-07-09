"use client";

import Link from "next/link";
import CompareDocuments from "@/components/CompareDocuments";

export default function CompareDocumentsPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>MCP Document Compare</h1>
      <p>
        Upload two .doc/.docx/.txt/.md files (or paste text), then run the registered
        compare tool to see the line-by-line difference between them.
      </p>
      <CompareDocuments />
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back</Link>
      </p>
    </main>
  );
}
