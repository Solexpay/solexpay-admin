import { ADMIN_AUTH, API_BASE } from "./api-base";
import { getAccessToken, logout, refreshSession } from "./auth/session";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Params = Record<string, string | number | boolean | undefined | null>;
export async function apiGet<T>(path: string, params?: Params): Promise<T> {
  return request<T>("GET", path, undefined, { params });
}
export async function apiPost<T>(
  path: string,
  body?: unknown,
  opts?: { idempotencyKey?: string },
): Promise<T> {
  return request<T>("POST", path, body, {
    idempotencyKey: opts?.idempotencyKey,
  });
}
export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { params?: Params; idempotencyKey?: string },
): Promise<T> {
  const url = new URL(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(options?.params ?? {}))
    if (value !== null && value !== undefined && value !== "")
      url.searchParams.set(key, String(value).trim());
  const perform = async (): Promise<Response> => {
    const headers = new Headers();
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (options?.idempotencyKey)
      headers.set("X-Idempotency-Key", options.idempotencyKey);
    return fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: url.href.startsWith(`${ADMIN_AUTH}/`)
        ? "include"
        : "same-origin",
    });
  };
  let response = await perform();
  if (response.status === 401) {
    try {
      await refreshSession();
    } catch {
      /* The original unauthorized response is returned below. */
    }
    if (getAccessToken()) response = await perform();
    if (response.status === 401) {
      await logout();
      throw new ApiError(401, "Unauthorized");
    }
  }
  const payload: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw parseApiError(response.status, payload);
  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    payload.success === true &&
    "data" in payload
  )
    return payload.data as T;
  return payload as T;
}

function parseApiError(status: number, payload: unknown): ApiError {
  let message = `Request failed (${status})`;
  let code: string | undefined;
  let details: unknown;
  if (typeof payload === "string") message = payload;
  if (typeof payload === "object" && payload !== null) {
    const candidate =
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null
        ? payload.error
        : payload;
    if ("message" in candidate && typeof candidate.message === "string")
      message = candidate.message;
    else if ("error" in candidate && typeof candidate.error === "string")
      message = candidate.error;
    if ("code" in candidate && typeof candidate.code === "string")
      code = candidate.code;
    if ("errorCode" in candidate && typeof candidate.errorCode === "string")
      code = candidate.errorCode;
    if ("details" in candidate) details = candidate.details;
  }
  return new ApiError(status, message, code, details);
}
