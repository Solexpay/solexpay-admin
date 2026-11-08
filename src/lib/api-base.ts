/** Base URL of the Go backend. Set NEXT_PUBLIC_API_URL to point elsewhere (staging, local). */
export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://api.solexpay.com.ng/api/v1";

/** Admin auth endpoints: the only calls that carry the refresh cookie. */
export const ADMIN_AUTH = `${API_BASE}/auth/admin`;
