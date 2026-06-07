import { createError } from "h3";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export function assertUuid(value: string | undefined, label = "id"): string {
  if (!value || !UUID_RE.test(value))
    throw createError({
      statusCode: 400,
      message: `Invalid ${label}: must be a UUID`,
    });
  return value;
}

export function assertEmail(value: unknown): string {
  if (typeof value !== "string" || !EMAIL_RE.test(value))
    throw createError({ statusCode: 400, message: "Invalid email address" });
  return value.toLowerCase().trim();
}

export function assertNonEmptyString(
  value: unknown,
  label: string,
  max = 128,
): string {
  if (typeof value !== "string" || value.trim().length === 0)
    throw createError({ statusCode: 400, message: `${label} is required` });
  if (value.length > max)
    throw createError({
      statusCode: 400,
      message: `${label} exceeds maximum length of ${max}`,
    });
  return value.trim();
}

export function assertPassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 8)
    throw createError({
      statusCode: 400,
      message: "Password must be at least 8 characters",
    });
  if (value.length > 128)
    throw createError({ statusCode: 400, message: "Password too long" });
  return value;
}

/** Strip every key not in the allowlist and coerce values to strings. */
export function allowQueryParams(
  query: Record<string, unknown>,
  allowed: string[],
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of allowed) {
    const val = query[key];
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, String(val).slice(0, 256));
    }
  }
  return params;
}
