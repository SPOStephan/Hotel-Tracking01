import type { BookingStatus } from "@/types/database";

const ALLOWED_STATUSES: BookingStatus[] = [
  "pending",
  "verified",
  "cancelled",
  "paid",
];

export type CsvStatusRow = {
  transaction_id: string;
  status: BookingStatus;
};

export function parseReconciliationCsv(text: string): {
  rows: CsvStatusRow[];
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ["CSV ist leer"] };
  }

  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const txIdx = header.indexOf("transaction_id");
  const statusIdx = header.indexOf("status");

  if (txIdx === -1 || statusIdx === -1) {
    return {
      rows: [],
      errors: [
        "CSV braucht Spaltenköpfe: transaction_id,status (weitere Spalten ok)",
      ],
    };
  }

  const rows: CsvStatusRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const transactionId = (cols[txIdx] ?? "").trim();
    const statusRaw = (cols[statusIdx] ?? "").trim().toLowerCase();

    if (!transactionId) {
      errors.push(`Zeile ${i + 1}: transaction_id fehlt`);
      continue;
    }

    if (!ALLOWED_STATUSES.includes(statusRaw as BookingStatus)) {
      errors.push(
        `Zeile ${i + 1}: ungültiger status "${statusRaw}" (erlaubt: ${ALLOWED_STATUSES.join(", ")})`,
      );
      continue;
    }

    rows.push({
      transaction_id: transactionId,
      status: statusRaw as BookingStatus,
    });
  }

  return { rows, errors };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const needsQuotes = /[",\n\r]/.test(cell);
          const escaped = cell.replace(/"/g, '""');
          return needsQuotes ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n");
}
