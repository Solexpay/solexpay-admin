/** Base URL of the Go backend. Set VITE_API_URL to point elsewhere (staging, local). */
export const API_BASE: string =
  (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(
    /\/+$/,
    "",
  ) || "https://api.solexpay.com.ng/api/v1";

/** Admin auth endpoints: the only calls that carry the refresh cookie. */
export const ADMIN_AUTH = `${API_BASE}/auth/admin`;
