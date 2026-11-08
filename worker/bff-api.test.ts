import { afterEach, describe, expect, it, vi } from "vitest";
import { handleApi } from "./bff-api";
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
const ctx = { env, requestId: "request-api" };

describe("API BFF", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("forwards the session bearer and strips backend cookies", async () => {
    const calls: Array<{ url: string; headers: Headers }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), headers: new Headers(init?.headers) });
        return new Response('{"success":true,"data":{"id":"admin-1"}}', {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "backend_cookie=should_not_escape",
          },
        });
      }),
    );
    const now = Math.floor(Date.now() / 1000);
    const session: SessionPayload = {
      v: 1,
      at: "at-1",
      atExp: now + 1800,
      rt: "rt-1",
      admin: profile,
      iat: now,
      sid: "sid-1",
    };
    const cookie = (await sealSession(env, session)).split(";")[0];
    const response = await handleApi(
      new Request("https://admin.test/bff/api/admin/profile", {
        headers: { Cookie: cookie },
      }),
      ctx,
    );
    expect(response.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.headers.get("Authorization")).toBe("Bearer at-1");
    expect(calls[0]?.headers.get("Cookie")).toBeNull();
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });
  it("never refreshes itself: backend 401 or an expired token is TOKEN_EXPIRED and keeps the cookie", async () => {
    const fakeFetch = vi.fn(
      async () =>
        new Response("{}", {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fakeFetch);
    const now = Math.floor(Date.now() / 1000);
    const live = (
      await sealSession(env, {
        v: 1,
        at: "at",
        atExp: now + 1800,
        rt: "rt",
        admin: profile,
        iat: now,
        sid: "s",
      })
    ).split(";")[0];
    const r1 = await handleApi(
      new Request("https://admin.test/bff/api/admin/profile", {
        headers: { Cookie: live },
      }),
      ctx,
    );
    expect(r1.status).toBe(401);
    expect(((await r1.json()) as { errorCode: string }).errorCode).toBe(
      "TOKEN_EXPIRED",
    );
    expect(r1.headers.get("Set-Cookie")).toBeNull();
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const expired = (
      await sealSession(env, {
        v: 1,
        at: "at",
        atExp: now - 5,
        rt: "rt",
        admin: profile,
        iat: now,
        sid: "s",
      })
    ).split(";")[0];
    const r2 = await handleApi(
      new Request("https://admin.test/bff/api/admin/profile", {
        headers: { Cookie: expired },
      }),
      ctx,
    );
    expect(r2.status).toBe(401);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });
  it("allows loan ops paths and forwards a valid idempotency key only", async () => {
    const calls: Headers[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(new Headers(init?.headers));
        return new Response('{"success":true,"data":[]}', {
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    const now = Math.floor(Date.now() / 1000);
    const cookie = (
      await sealSession(env, {
        v: 1,
        at: "at",
        atExp: now + 1800,
        rt: "rt",
        admin: profile,
        iat: now,
        sid: "s",
      })
    ).split(";")[0];
    expect(
      (
        await handleApi(
          new Request("https://admin.test/bff/api/loans/ops-pending", {
            headers: { Cookie: cookie },
          }),
          ctx,
        )
      ).status,
    ).toBe(200);
    const post = (key: string) =>
      new Request("https://admin.test/bff/api/admin/broadcast", {
        method: "POST",
        body: "{}",
        headers: {
          Cookie: cookie,
          Origin: "https://admin.test",
          "X-SX-CSRF": "1",
          "Content-Type": "application/json",
          "X-Idempotency-Key": key,
        },
      });
    expect((await handleApi(post("idem-key-12345"), ctx)).status).toBe(200);
    expect(calls.at(-1)?.get("X-Idempotency-Key")).toBe("idem-key-12345");
    expect((await handleApi(post("bad key!"), ctx)).status).toBe(400);
    expect(
      (
        await handleApi(
          new Request("https://admin.test/bff/api/loans/x/delete", {
            headers: { Cookie: cookie },
          }),
          ctx,
        )
      ).status,
    ).toBe(404);
  });
  it("rejects non-JSON backend responses and unknown routes", async () => {
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
    const cookie = (await sealSession(env, session)).split(";")[0];
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("html", { headers: { "Content-Type": "text/html" } }),
      ),
    );
    const req = (path: string) =>
      new Request(`https://admin.test${path}`, { headers: { Cookie: cookie } });
    expect((await handleApi(req("/bff/api/admin/profile"), ctx)).status).toBe(
      502,
    );
    expect((await handleApi(req("/bff/api/nope"), ctx)).status).toBe(404);
  });
});
