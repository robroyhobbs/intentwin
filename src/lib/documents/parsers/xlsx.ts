import type { ParsedSection } from "../parser";

/**
 * Parses an Excel workbook (.xlsx / .xls) into structured sections.
 * Each worksheet becomes a section. Cells are rendered as a readable
 * markdown-style table so the AI extraction can parse pricing rows,
 * bid tables, and rate schedules.
 */
export async function parseXlsx(buffer: Buffer): Promise<ParsedSection[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sections: ParsedSection[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert sheet to array-of-arrays for reliable iteration
    const rows: (string | number | boolean | null)[][] =
      XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (rows.length === 0) continue;

    // Find the max column count for consistent table rows
    const maxCols = Math.max(...rows.map((r) => r.length));
    if (maxCols === 0) continue;

    const lines: string[] = [];

    // Render as a plain text table (pipe-separated) so the AI can read it
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const cells = Array.from({ length: maxCols }, (_, i) => {
        const val = row[i] ?? "";
        return String(val).trim().replace(/\|/g, "\\|"); // escape pipes
      });
      lines.push("| " + cells.join(" | ") + " |");

      // Add header separator after first row
      if (rowIdx === 0) {
        lines.push("| " + cells.map(() => "---").join(" | ") + " |");
      }
    }

    sections.push({
      heading: sheetName,
      content: lines.join("\n"),
    });
  }

  return sections.length > 0
    ? sections
    : [{ heading: null, content: "(Empty workbook)" }];
}
