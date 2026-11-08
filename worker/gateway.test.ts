import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./env";
import { gatewayFetch } from "./gateway";

const env = { API_ORIGIN: "https://api.test", GATEWAY_SECRET: "secret" } as Env;

describe("gateway signing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it("signs the canonical request independently and drops browser credentials", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    const fakeFetch = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response("{}"),
    );
    vi.stubGlobal("fetch", fakeFetch);
    const request = new Request("https://admin.test/bff/api/admin/users", {
      headers: {
        Cookie: "secret-cookie",
        Authorization: "Bearer browser",
        "CF-Connecting-IP": "203.0.113.4",
        "User-Agent": "browser",
      },
    });
    await gatewayFetch({
      request,
      env,
      requestId: "rid",
      pathWithQuery: "/api/v1/admin/users?status=ACTIVE",
      method: "GET",
    });
    const init = fakeFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    const material =
      "1700000000\nGET\n/api/v1/admin/users?status=ACTIVE\n203.0.113.4";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("secret"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expected = Array.from(
      new Uint8Array(
        await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(material),
        ),
      ),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
    expect(headers.get("X-SX-Gateway-Sig")).toBe(expected);
    expect(headers.has("Cookie")).toBe(false);
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.has("X-Admin-Purpose")).toBe(false);
  });
  it("forwards purpose only when exactly export", async () => {
    const fakeFetch = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response("{}"),
    );
    vi.stubGlobal("fetch", fakeFetch);
    await gatewayFetch({
      request: new Request("https://admin.test/", {
        headers: { "X-Admin-Purpose": "export" },
      }),
      env,
      requestId: "rid",
      pathWithQuery: "/api/v1/admin/audit",
      method: "GET",
      purpose: "export",
    });
    expect(
      new Headers(fakeFetch.mock.calls[0][1]?.headers).get("X-Admin-Purpose"),
    ).toBe("export");
  });
});
