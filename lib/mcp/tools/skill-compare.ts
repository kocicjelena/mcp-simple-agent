// lib/mcp/tools/skill-compare.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Splits text into trimmed-right lines for line-oriented diffing.
 */
function toLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/\s+$/, ""));
}

/**
 * Longest Common Subsequence over two line arrays, walked to emit a unified diff.
 * Returns { diff, added, removed, unchanged }.
 */
function diffLines(
  a: string[],
  b: string[]
): { diff: string[]; added: number; removed: number; unchanged: number } {
  const m = a.length;
  const n = b.length;

  // LCS length table.
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const diff: string[] = [];
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      diff.push(`  ${a[i]}`);
      unchanged += 1;
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      diff.push(`- ${a[i]}`);
      removed += 1;
      i += 1;
    } else {
      diff.push(`+ ${b[j]}`);
      added += 1;
      j += 1;
    }
  }
  while (i < m) {
    diff.push(`- ${a[i]}`);
    removed += 1;
    i += 1;
  }
  while (j < n) {
    diff.push(`+ ${b[j]}`);
    added += 1;
    j += 1;
  }

  return { diff, added, removed, unchanged };
}

export function registerCompareTool(server: McpServer) {
  server.registerTool(
    "compare",
    {
      description:
        "Compare two documents and return the textual difference. Accepts the extracted " +
        "plain text of two documents (textA and textB) plus optional titles, and returns a " +
        "line-by-line unified diff with a summary of added, removed, and unchanged lines. " +
        "Call this tool when the user wants to diff, compare, or find changes between two " +
        "uploaded .doc, .docx, .txt, or .md documents.",
      inputSchema: {
        textA: z.string().describe("Extracted plain text of the first (original) document"),
        textB: z.string().describe("Extracted plain text of the second (changed) document"),
        titleA: z.string().optional().describe("Label for the first document, default 'Document A'"),
        titleB: z.string().optional().describe("Label for the second document, default 'Document B'"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ textA, textB, titleA, titleB }) => {
      const labelA = titleA?.trim() || "Document A";
      const labelB = titleB?.trim() || "Document B";

      const { diff, added, removed, unchanged } = diffLines(toLines(textA), toLines(textB));

      const header = `Comparing "${labelA}" (-) vs "${labelB}" (+)`;
      const summary =
        added === 0 && removed === 0
          ? "No differences found."
          : `Summary: ${added} added, ${removed} removed, ${unchanged} unchanged.`;

      const body = added === 0 && removed === 0 ? "" : `\n\n${diff.join("\n")}`;

      return {
        content: [
          {
            type: "text",
            text: `${header}\n\n${summary}${body}`,
          },
        ],
      };
    }
  );
}
