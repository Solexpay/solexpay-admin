const dateParts = (iso: string): Date => new Date(iso);

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(dateParts(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    dateParts(iso),
  );
}

export function formatRelative(iso: string): string {
  const delta = dateParts(iso).getTime() - Date.now();
  const seconds = Math.round(delta / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ];
  const formatter = new Intl.RelativeTimeFormat("en-NG", { numeric: "auto" });
  for (const [unit, size] of units)
    if (Math.abs(seconds) >= size || unit === "second")
      return formatter.format(Math.round(seconds / size), unit);
  return iso;
}

export function maskAccountNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length <= 4
    ? digits
    : `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
