import { afterEach, describe, expect, it, vi } from "vitest";
import { handleAuth } from "./bff-auth";
import type { Env } from "./env";
import { type SessionPayload, sealSession } from "./session";

const key = btoa(String.fromCharCode(...new Uint8Array(32)));
const profile = {
  id: "admin-1",
  email: "a@example.com",
  firstName: "A",
  lastName: "Admin",
  role: "SUPER_ADMIN",
};
const env = {
  SESSION_KEY: key,
  API_ORIGIN: "https://api.test",
  GATEWAY_SECRET: "secret",
} as Env;
const ctx = { env, requestId: "request-1" };
const csrf = {
  Origin: "https://admin.test",
  "X-SX-CSRF": "1",
  "Content-Type": "application/json",
};

describe("auth BFF", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("keeps backend tokens out of a successful browser response", async () => {
    const fakeFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: { token: "ACCESS_SECRET", expiresIn: 1800, admin: profile },
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie":
                "__Host-sx_admin_rt=REFRESH_SECRET; Secure; HttpOnly",
            },
          },
        ),
    );
    vi.stubGlobal("fetch", fakeFetch);
    const request = new Request("https://admin.test/bff/auth/login", {
      method: "POST",
      headers: csrf,
      body: JSON.stringify({ email: "A@EXAMPLE.COM", password: "pass" }),
    });
    const response = await handleAuth(request, ctx);
    const body = await response.text();
    expect(body).not.toContain("token");
    expect(body).not.toContain("refreshToken");
    expect(response.headers.get("Set-Cookie")).toContain("__Host-sx_admin=");
    expect(response.headers.get("Set-Cookie")).toContain(
      "HttpOnly; SameSite=Strict; Max-Age=43200",
    );
  });
  it("passes enrollment-required bodies through without setting a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: {
                enrollmentRequired: true,
                enrollmentToken: "enrollment-secret",
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    const response = await handleAuth(
      new Request("https://admin.test/bff/auth/login", {
        method: "POST",
        headers: csrf,
        body: JSON.stringify({ email: "a@example.com", password: "pass" }),
      }),
      ctx,
    );
    expect(await response.json()).toMatchObject({
      data: { enrollmentRequired: true },
    });
    expect(response.headers.has("Set-Cookie")).toBe(false);
  });
  it("clears the session cookie on logout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    const now = Math.floor(Date.now() / 1000);
    const session: SessionPayload = {
      v: 1,
      at: "at",
      atExp: now + 1800,
      rt: "rt",
      admin: profile,
      iat: now,
      sid: "sid",
    };
    const cookie = await sealSession(env, session);
    const request = new Request("https://admin.test/bff/auth/logout", {
      method: "POST",
      headers: { ...csrf, Cookie: cookie.split(";")[0] },
      body: "{}",
    });
    const response = await handleAuth(request, ctx);
    expect(response.status).toBe(204);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });
});
