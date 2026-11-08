import { z } from "zod";
import { API_BASE } from "./api-base";
import { clearLocalSession, refreshSession } from "./auth/session";

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

const successEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

const errorEnvelopeSchema = z.object({
  success: z.literal(false).optional(),
  code: z.string().optional(),
  errorCode: z.string().optional(),
  message: z.string().optional(),
  details: z.unknown().optional(),
  error: z
    .union([
      z.string(),
      z.object({
        code: z.string().optional(),
        errorCode: z.string().optional(),
        message: z.string().optional(),
        details: z.unknown().optional(),
      }),
    ])
    .optional(),
});

type Params = Record<string, string | number | boolean | undefined | null>;

export interface ApiGetOptions {
  purpose?: "export";
}

export interface ApiPostOptions {
  idempotencyKey?: string;
}

export async function apiGet<T>(
  path: string,
  params?: Params,
  options?: ApiGetOptions,
): Promise<T> {
  return request<T>("GET", path, undefined, {
    params,
    purpose: options?.purpose,
  });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  opts?: ApiPostOptions,
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
  options?: {
    params?: Params;
    idempotencyKey?: string;
    purpose?: "export";
  },
): Promise<T> {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalizedPath}`, origin);

  for (const [key, value] of Object.entries(options?.params ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value).trim());
    }
  }

  const perform = async (): Promise<Response> => {
    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (method !== "GET") {
      headers.set("X-SX-CSRF", "1");
    }
    if (options?.purpose) {
      headers.set("X-Admin-Purpose", options.purpose);
    }
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (options?.idempotencyKey) {
      headers.set("X-Idempotency-Key", options.idempotencyKey);
    }
    return fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
    });
  };

  let response = await perform();
  if (response.status === 401) {
    // TOKEN_EXPIRED: the BFF never refreshes on its own (see session.ts);
    // anything else means the session is gone.
    const code = await response
      .clone()
      .json()
      .then((body: unknown) =>
        typeof body === "object" && body !== null && "errorCode" in body
          ? body.errorCode
          : undefined,
      )
      .catch(() => undefined);
    if (code !== "TOKEN_EXPIRED") {
      clearLocalSession();
      throw new ApiError(401, "Your session has ended. Sign in again.");
    }
    try {
      await refreshSession();
    } catch {
      clearLocalSession();
      throw new ApiError(401, "Your session has ended. Sign in again.");
    }
    response = await perform();
    if (response.status === 401) {
      clearLocalSession();
      throw new ApiError(401, "Your session has ended. Sign in again.");
    }
  }

  let payload: unknown;
  if (response.status === 204) {
    payload = null;
  } else {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError(502, "Unexpected response from server.");
    }
    try {
      payload = await response.json();
    } catch {
      throw new ApiError(502, "Unexpected response from server.");
    }
  }

  if (!response.ok) {
    throw parseApiError(response.status, payload);
  }

  const parsed = successEnvelopeSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data.data as T;
  }
  return payload as T;
}

function parseApiError(status: number, payload: unknown): ApiError {
  let message = `Request failed (${status})`;
  let code: string | undefined;
  let details: unknown;

  const parsed = errorEnvelopeSchema.safeParse(payload);
  if (parsed.success) {
    const data = parsed.data;
    if (typeof data.error === "object" && data.error !== null) {
      if (data.error.message) message = data.error.message;
      if (data.error.code) code = data.error.code;
      if (data.error.errorCode) code = data.error.errorCode;
      if (data.error.details !== undefined) details = data.error.details;
    } else if (typeof data.error === "string") {
      message = data.error;
    }
    if (data.message) message = data.message;
    if (data.code) code = data.code;
    if (data.errorCode) code = data.errorCode;
    if (data.details !== undefined) details = data.details;
  } else if (typeof payload === "string") {
    message = payload;
  }

  return new ApiError(status, message, code, details);
}
