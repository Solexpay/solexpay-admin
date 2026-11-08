export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

export function downloadCsv<T>(
  name: string,
  rows: readonly T[],
  columns: CsvColumn<T>[],
): void {
  const lines = [
    columns.map((column) => cell(column.label)).join(","),
    ...rows.map((row) =>
      columns.map((column) => cell(column.value(row))).join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
