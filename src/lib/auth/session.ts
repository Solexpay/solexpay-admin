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
}

let state: State = { status: "loading", admin: null };
let refreshFlight: Promise<LoginSuccessResponse> | null = null;
let initFlight: Promise<void> | null = null;
let sessionVersion = 0;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let lastRefreshTime = 0;
let channel: BroadcastChannel | null = null;

const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => state;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel("sx-admin-session");
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (event.data === "logout") {
          clearLocalSession();
        } else if (event.data === "login") {
          void initialize(true);
        }
      };
    } catch {
      channel = null;
    }
  }
  return channel;
}

function broadcastSession(type: "login" | "logout"): void {
  try {
    getBroadcastChannel()?.postMessage(type);
  } catch {
    // BroadcastChannel error ignored
  }
}

function clearRefreshTimer(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleProactiveRefresh(expiresIn: number): void {
  clearRefreshTimer();
  const delaySeconds = Math.max(30, expiresIn - 90);
  refreshTimer = setTimeout(() => {
    void refreshSession().catch(() => {
      /* Refresh error already clears session if still current */
    });
  }, delaySeconds * 1000);
}

if (typeof window !== "undefined") {
  window.addEventListener("focus", () => {
    if (
      state.status === "authenticated" &&
      Date.now() - lastRefreshTime > 10 * 60 * 1000
    ) {
      void refreshSession().catch(() => {});
    }
  });
}

export function isAuthenticated(): boolean {
  return state.status === "authenticated";
}

export function clearLocalSession(): void {
  sessionVersion += 1;
  state = { status: "anonymous", admin: null };
  clearRefreshTimer();
  emit();
}

function setSession(session: LoginSuccessResponse): void {
  sessionVersion += 1;
  state = {
    status: "authenticated",
    admin: session.admin,
  };
  lastRefreshTime = Date.now();
  scheduleProactiveRefresh(session.expiresIn);
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

async function authRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${ADMIN_AUTH}${normalized}`, origin);

  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (method !== "GET") {
    headers.set("X-SX-CSRF", "1");
  }
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
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

/**
 * Runs `task` while holding a cross-tab Web Lock, so only one tab refreshes at
 * a time. The backend rotates refresh tokens and revokes the whole session
 * family when an old one is replayed, so concurrent refreshes would log the
 * admin out. Falls back to running directly where Web Locks are unavailable.
 */
function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { locks?: LockManager }).locks
      : undefined;
  if (!locks) return task();
  return locks.request("sx-admin-refresh", task) as Promise<T>;
}

/** Below this many seconds of access-token life a refresh is needed. */
const REFRESH_MARGIN_S = 120;

export function refreshSession(): Promise<LoginSuccessResponse> {
  if (refreshFlight) return refreshFlight;
  const versionAtStart = sessionVersion;
  refreshFlight = withRefreshLock(async () => {
    // Another tab may have refreshed while we waited for the lock: the cookie
    // is shared, so re-read the session before spending the refresh token.
    const current = await authRequest<LoginSuccessResponse>("GET", "/session");
    if (current.expiresIn > REFRESH_MARGIN_S) return current;
    return authRequest<LoginSuccessResponse>("POST", "/refresh", {});
  })
    .then((result) => {
      if (sessionVersion === versionAtStart) setSession(result);
      return result;
    })
    .catch((error: unknown) => {
      if (sessionVersion === versionAtStart) clearLocalSession();
      throw error;
    })
    .finally(() => {
      refreshFlight = null;
    });
  return refreshFlight;
}

export async function initialize(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  getBroadcastChannel();
  if (initFlight) return initFlight;
  if (state.status !== "loading" && !force) return;

  initFlight = (async () => {
    try {
      const session = await authRequest<LoginSuccessResponse>(
        "GET",
        "/session",
      );
      if (session.expiresIn > REFRESH_MARGIN_S) setSession(session);
      else await refreshSession();
    } catch {
      clearLocalSession();
    } finally {
      initFlight = null;
    }
  })();

  return initFlight;
}

export async function logout(): Promise<void> {
  try {
    await authRequest<unknown>("POST", "/logout", {});
  } catch {
    /* Local logout must finish even when revocation is unavailable. */
  }
  clearLocalSession();
  broadcastSession("logout");
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
      const result = await authRequest<LoginResult>("POST", "/login", {
        email,
        password,
      } satisfies LoginRequest);
      if ("admin" in result && result.admin) {
        setSession(result);
        broadcastSession("login");
      } else if ((result as EnrollmentRequiredResponse).enrollmentRequired) {
        clearLocalSession();
      }
      return result;
    },
    confirmTotp: async (enrollmentToken: string, code: string) => {
      const result = await authRequest<LoginSuccessResponse>(
        "POST",
        "/totp/confirm",
        {
          enrollmentToken,
          code,
        },
      );
      setSession(result);
      broadcastSession("login");
      return result;
    },
    enrollTotp: (enrollmentToken: string) =>
      authRequest<TOTPEnrollResponse>("POST", "/totp/enroll", {
        enrollmentToken,
      }),
    logout,
    canAccess: (section: string) => roleCanAccess(current.admin?.role, section),
  };
}

export function __resetSessionForTests(): void {
  clearRefreshTimer();
  state = { status: "loading", admin: null };
  refreshFlight = null;
  initFlight = null;
  sessionVersion = 0;
  lastRefreshTime = 0;
}
