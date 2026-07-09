// lib/mcp/skills/compare.ts
// Skill body exported as a TypeScript string, consumed by the compare MCP tool.

export const COMPARE_SKILL = `
# compare-documents Skill

Computes the textual difference between two documents whose plain text has already
been extracted client-side (from .doc / .docx / .txt / .md uploads).

The tool receives two strings, textA and textB, and returns a line-oriented diff
plus a short summary of what changed.

## Inputs

- textA: extracted plain text of the first (left / original) document
- textB: extracted plain text of the second (right / changed) document
- titleA (optional): label for the first document, default "Document A"
- titleB (optional): label for the second document, default "Document B"

## Output Shape

The tool returns a single text block containing:

1. A header line naming both documents.
2. A summary: number of added lines, removed lines, and unchanged lines.
3. A unified line-by-line diff where:
   - Lines only in A are prefixed with "- "
   - Lines only in B are prefixed with "+ "
   - Lines present in both are prefixed with "  " (two spaces)

## Diff Algorithm

Use a standard Longest Common Subsequence (LCS) over the line arrays of textA and
textB, then walk the LCS table to emit additions, removals, and matches in order.
Normalize by splitting on newlines and trimming trailing whitespace per line; do
not collapse internal whitespace so that real content changes are preserved.

## Rules

1. Empty input on either side is valid — treat it as an all-added or all-removed diff.
2. Identical inputs produce a summary stating "No differences found" and no +/- lines.
3. Keep ordering stable; never reorder lines to minimize the diff beyond what LCS yields.
4. The result is plain text only (no HTML, no markdown fences in the emitted diff body).
`;
