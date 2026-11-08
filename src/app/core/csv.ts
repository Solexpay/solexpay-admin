export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Downloads rows as a CSV file named `<name>-YYYY-MM-DD.csv`.
 *
 *   downloadCsv("users", users, [
 *     { label: "Name", value: (u) => `${u.firstName} ${u.lastName}` },
 *     { label: "Email", value: (u) => u.email },
 *   ]);
 */
export function downloadCsv<T>(
  name: string,
  rows: readonly T[],
  columns: CsvColumn<T>[],
) {
  const lines = [
    columns.map((c) => cell(c.label)).join(","),
    ...rows.map((row) => columns.map((c) => cell(c.value(row))).join(",")),
  ];
  // BOM so Excel reads ₦ and accented names as UTF-8.
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Stop spreadsheet apps treating a value as a formula.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
