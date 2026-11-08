import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "../mocks/server";
import { API_BASE } from "./api-base";
import { getAccessToken, logout, refreshSession } from "./auth/session";
import { apiGet, apiPost } from "./http";

describe("HTTP client", () => {
  afterEach(async () => {
    await logout();
  });

  it("adds the in-memory bearer token", async () => {
    server.use(
      http.get(`${API_BASE}/private`, ({ request }) =>
        HttpResponse.json({
          authorization: request.headers.get("authorization"),
        }),
      ),
    );
    await refreshSession();
    const result = await apiGet<{ authorization: string }>("/private");
    expect(result.authorization).toBe(`Bearer ${getAccessToken()}`);
  });

  it("shares one refresh across three concurrent 401 responses and retries", async () => {
    let refreshes = 0;
    let calls = 0;
    server.use(
      http.post(`${API_BASE}/auth/admin/refresh`, () => {
        refreshes += 1;
        return HttpResponse.json({
          token: "refreshed-token",
          expiresIn: 900,
          admin: {
            id: "a",
            email: "a@x",
            firstName: "A",
            lastName: "B",
            role: "SUPER_ADMIN",
          },
          user: {
            id: "a",
            email: "a@x",
            firstName: "A",
            lastName: "B",
            role: "ADMIN",
          },
        });
      }),
      http.get(`${API_BASE}/parallel`, ({ request }) => {
        calls += 1;
        return request.headers.get("authorization") === "Bearer refreshed-token"
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 });
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

  it("logs out and throws after a second 401", async () => {
    server.use(
      http.get(
        `${API_BASE}/denied`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    );
    await expect(apiGet("/denied")).rejects.toMatchObject({ status: 401 });
    expect(getAccessToken()).toBeNull();
  });

  it("drops undefined and null params", async () => {
    server.use(
      http.get(`${API_BASE}/params`, ({ request }) =>
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
      http.post(`${API_BASE}/keyed`, ({ request }) => {
        inspect(request.headers.get("X-Idempotency-Key"));
        return HttpResponse.json({ ok: true });
      }),
    );
    await apiPost("/keyed", {}, { idempotencyKey: "key-123" });
    expect(inspect).toHaveBeenCalledWith("key-123");
  });
});
