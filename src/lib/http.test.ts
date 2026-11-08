import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "../mocks/server";
import { API_BASE } from "./api-base";
import { isAuthenticated, logout } from "./auth/session";
import { ApiError, apiGet, apiPost } from "./http";

const mockAdmin = {
  id: "a1",
  email: "a@x.com",
  firstName: "A",
  lastName: "B",
  role: "SUPER_ADMIN",
};

describe("HTTP client", () => {
  afterEach(async () => {
    await logout();
  });

  it("never sends an Authorization header", async () => {
    let getAuth: string | null = "initial";
    let postAuth: string | null = "initial";

    server.use(
      http.get(`*${API_BASE}/auth-check`, ({ request }) => {
        getAuth = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
      http.post(`*${API_BASE}/auth-check`, ({ request }) => {
        postAuth = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiGet("/auth-check");
    await apiPost("/auth-check", { test: true });

    expect(getAuth).toBeNull();
    expect(postAuth).toBeNull();
  });

  it("sends X-SX-CSRF: 1 on non-GET and omits it on GET", async () => {
    let getCsrf: string | null = "initial";
    let postCsrf: string | null = "initial";

    server.use(
      http.get(`*${API_BASE}/csrf-check`, ({ request }) => {
        getCsrf = request.headers.get("x-sx-csrf");
        return HttpResponse.json({ ok: true });
      }),
      http.post(`*${API_BASE}/csrf-check`, ({ request }) => {
        postCsrf = request.headers.get("x-sx-csrf");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiGet("/csrf-check");
    await apiPost("/csrf-check", { data: 1 });

    expect(getCsrf).toBeNull();
    expect(postCsrf).toBe("1");
  });

  it("sends X-Admin-Purpose header when purpose is export", async () => {
    let purposeHeader: string | null = null;

    server.use(
      http.get(`*${API_BASE}/export-check`, ({ request }) => {
        purposeHeader = request.headers.get("x-admin-purpose");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiGet("/export-check", undefined, { purpose: "export" });
    expect(purposeHeader).toBe("export");
  });

  it("retries request after 401 when refresh succeeds", async () => {
    let refreshes = 0;
    let calls = 0;

    server.use(
      http.get("*/bff/auth/session", () =>
        HttpResponse.json({
          success: true,
          data: { admin: mockAdmin, expiresIn: 0 },
        }),
      ),
      http.post("*/bff/auth/refresh", () => {
        refreshes += 1;
        return HttpResponse.json({
          expiresIn: 1800,
          admin: {
            id: "a1",
            email: "a@x.com",
            firstName: "A",
            lastName: "B",
            role: "SUPER_ADMIN",
          },
        });
      }),
      http.get(`*${API_BASE}/retry-test`, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { success: false, errorCode: "TOKEN_EXPIRED" },
            { status: 401 },
          );
        }
        return HttpResponse.json({ ok: true, data: "success" });
      }),
    );

    const result = await apiGet<{ ok: boolean; data: string }>("/retry-test");
    expect(result).toEqual({ ok: true, data: "success" });
    expect(refreshes).toBe(1);
    expect(calls).toBe(2);
  });

  it("shares one refresh across three concurrent 401 responses and retries", async () => {
    let refreshes = 0;
    let calls = 0;
    server.use(
      http.get("*/bff/auth/session", () =>
        HttpResponse.json({
          success: true,
          data: { admin: mockAdmin, expiresIn: 0 },
        }),
      ),
      http.post("*/bff/auth/refresh", () => {
        refreshes += 1;
        return HttpResponse.json({
          expiresIn: 1800,
          admin: {
            id: "a",
            email: "a@x",
            firstName: "A",
            lastName: "B",
            role: "SUPER_ADMIN",
          },
        });
      }),
      http.get(`*${API_BASE}/parallel`, () => {
        calls += 1;
        return calls > 3
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json(
              { success: false, errorCode: "TOKEN_EXPIRED" },
              { status: 401 },
            );
      }),
    );
    const values = await Promise.all([
      apiGet<{ ok: boolean }>("/parallel"),
      apiGet<{ ok: boolean }>("/parallel"),
      apiGet<{ ok: boolean }>("/parallel"),
    ]);
    expect(values).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshes).toBe(1);
    expect(calls).toBe(6);
  });

  it("throws ApiError 401 and clears session when refresh fails on 401", async () => {
    server.use(
      http.get(`*${API_BASE}/denied`, () =>
        HttpResponse.json(
          { success: false, errorCode: "TOKEN_EXPIRED" },
          { status: 401 },
        ),
      ),
      http.post(
        "*/bff/auth/refresh",
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    await expect(apiGet("/denied")).rejects.toThrow(ApiError);
    await expect(apiGet("/denied")).rejects.toMatchObject({
      status: 401,
      message: "Your session has ended. Sign in again.",
    });
    expect(isAuthenticated()).toBe(false);
  });

  it("throws ApiError 502 when 200 response is not application/json", async () => {
    server.use(
      http.get(
        `*${API_BASE}/bad-gateway`,
        () =>
          new HttpResponse("<html><body>Error</body></html>", {
            status: 200,
            headers: { "Content-Type": "text/html" },
          }),
      ),
    );

    await expect(apiGet("/bad-gateway")).rejects.toThrow(ApiError);
    await expect(apiGet("/bad-gateway")).rejects.toMatchObject({
      status: 502,
      message: "Unexpected response from server.",
    });
  });

  it("drops undefined and null params", async () => {
    server.use(
      http.get(`*${API_BASE}/params`, ({ request }) =>
        HttpResponse.json(new URL(request.url).searchParams.toString()),
      ),
    );
    const query = await apiGet<string>("/params", {
      kept: 4,
      no: undefined,
      nil: null,
    });
    expect(query).toBe("kept=4");
  });

  it("sends an idempotency key", async () => {
    const inspect = vi.fn();
    server.use(
      http.post(`*${API_BASE}/keyed`, ({ request }) => {
        inspect(request.headers.get("X-Idempotency-Key"));
        return HttpResponse.json({ ok: true });
      }),
    );
    await apiPost("/keyed", {}, { idempotencyKey: "key-123" });
    expect(inspect).toHaveBeenCalledWith("key-123");
  });
});
