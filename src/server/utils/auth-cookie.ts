import { type H3Event, setCookie, getCookie, deleteCookie } from "h3";

export const AUTH_COOKIE_NAME = "sx_admin_rt";
export const AUTH_COOKIE_PATH = "/api/auth";
export const AUTH_COOKIE_MAX_AGE = 43200; // 12 hours (backend family lifetime)

export type AuthCookieOptions = NonNullable<Parameters<typeof setCookie>[3]>;

export function getAuthCookieOptions(): AuthCookieOptions {
  const isDev = process.env["NODE_ENV"] === "development";
  return {
    httpOnly: true,
    sameSite: "strict",
    path: AUTH_COOKIE_PATH,
    maxAge: AUTH_COOKIE_MAX_AGE,
    secure: !isDev,
  };
}

export function setAuthCookie(event: H3Event, refreshToken: string): void {
  setCookie(event, AUTH_COOKIE_NAME, refreshToken, getAuthCookieOptions());
}

export function getAuthCookie(event: H3Event): string | undefined {
  return getCookie(event, AUTH_COOKIE_NAME);
}

export function clearAuthCookie(event: H3Event): void {
  const isDev = process.env["NODE_ENV"] === "development";
  deleteCookie(event, AUTH_COOKIE_NAME, {
    path: AUTH_COOKIE_PATH,
    sameSite: "strict",
    secure: !isDev,
  });
}

export function handleAuthResponse<T extends Record<string, unknown>>(
  event: H3Event,
  res: T,
): Omit<T, "refreshToken"> {
  if (res && typeof res === "object" && "refreshToken" in res) {
    const tokenVal = res["refreshToken"];
    if (tokenVal) {
      setAuthCookie(event, String(tokenVal));
    }
    const clean = { ...res };
    delete clean["refreshToken"];
    return clean;
  }
  return res;
}
