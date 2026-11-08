import { useEffect, useSyncExternalStore } from "react";
import { canAccess as roleCanAccess } from "../access";
import { ADMIN_AUTH } from "../api-base";
import type {
  AdminProfile,
  EnrollmentRequiredResponse,
  LoginRequest,
  LoginResult,
  LoginSuccessResponse,
  TOTPEnrollResponse,
} from "../types";

export type SessionStatus = "loading" | "authenticated" | "anonymous";
interface State {
  status: SessionStatus;
  admin: AdminProfile | null;
  token: string | null;
}
let state: State = { status: "loading", admin: null, token: null };
let refreshFlight: Promise<LoginSuccessResponse> | null = null;
let initialized = false;
let sessionVersion = 0;
const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => state;

function setSession(session: LoginSuccessResponse): void {
  sessionVersion += 1;
  state = {
    status: "authenticated",
    admin: session.admin,
    token: session.token,
  };
  initialized = true;
  emit();
}

function unwrap<T>(value: unknown): T {
  if (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value
  )
    return value.data as T;
  return value as T;
}

async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${ADMIN_AUTH}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(errorMessage(payload, response.status)) as Error & {
      status?: number;
      code?: string;
      details?: unknown;
    };
    error.status = response.status;
    if (typeof payload === "object" && payload !== null) {
      const source =
        "error" in payload &&
        typeof payload.error === "object" &&
        payload.error !== null
          ? payload.error
          : payload;
      if ("errorCode" in source && typeof source.errorCode === "string")
        error.code = source.errorCode;
      else if ("code" in source && typeof source.code === "string")
        error.code = source.code;
      if ("details" in source) error.details = source.details;
    }
    throw error;
  }
  return unwrap<T>(payload);
}

function errorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string") return payload;
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    for (const key of ["message", "error", "errorMessage"]) {
      const value = record[key];
      if (typeof value === "string") return value;
    }
  }
  return `Request failed (${status})`;
}

export function getAccessToken(): string | null {
  return state.token;
}

export function refreshSession(): Promise<LoginSuccessResponse> {
  if (refreshFlight) return refreshFlight;
  const versionAtStart = sessionVersion;
  refreshFlight = authRequest<LoginSuccessResponse>("/refresh", {})
    .then((result) => {
      if (sessionVersion === versionAtStart) setSession(result);
      return result;
    })
    .catch((error: unknown) => {
      if (sessionVersion === versionAtStart) clearState();
      throw error;
    })
    .finally(() => {
      refreshFlight = null;
    });
  return refreshFlight;
}

async function initialize(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    await refreshSession();
  } catch {
    // refreshSession clears the store when no newer login superseded it.
  }
}

function clearState(): void {
  sessionVersion += 1;
  state = { status: "anonymous", admin: null, token: null };
  initialized = true;
  emit();
}

export async function logout(): Promise<void> {
  try {
    await authRequest<unknown>("/logout", {});
  } catch {
    /* Local logout must finish even when revocation is unavailable. */
  }
  clearState();
}

export function useAdminSession(): {
  status: SessionStatus;
  admin: AdminProfile | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  confirmTotp: (
    enrollmentToken: string,
    code: string,
  ) => Promise<LoginSuccessResponse>;
  enrollTotp: (enrollmentToken: string) => Promise<TOTPEnrollResponse>;
  logout: () => Promise<void>;
  canAccess: (section: string) => boolean;
} {
  const current = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    void initialize();
  }, []);
  return {
    status: current.status,
    admin: current.admin,
    login: async (email: string, password: string) => {
      const result = await authRequest<LoginResult>("/login", {
        email,
        password,
      } satisfies LoginRequest);
      if ("token" in result && result.token) setSession(result);
      else if ((result as EnrollmentRequiredResponse).enrollmentRequired)
        clearState();
      return result;
    },
    confirmTotp: async (enrollmentToken: string, code: string) => {
      const result = await authRequest<LoginSuccessResponse>("/totp/confirm", {
        enrollmentToken,
        code,
      });
      setSession(result);
      return result;
    },
    enrollTotp: (enrollmentToken: string) =>
      authRequest<TOTPEnrollResponse>("/totp/enroll", { enrollmentToken }),
    logout,
    canAccess: (section: string) => roleCanAccess(current.admin?.role, section),
  };
}
