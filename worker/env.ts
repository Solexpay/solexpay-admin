/** Bindings available to the admin edge Worker. */
export interface Env {
  ASSETS: Fetcher;
  API_ORIGIN: string;
  ENVIRONMENT: "development" | "staging" | "production";
  SESSION_KEY: string;
  GATEWAY_SECRET: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  LOGIN_LIMITER?: RateLimit;
  API_LIMITER?: RateLimit;
}

/** Minimal admin identity stored in the sealed session. */
export interface AdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}
