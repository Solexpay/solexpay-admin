import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { createEvent, H3Event } from "h3";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import loginHandler from "./login.post";
import refreshHandler from "./refresh.post";
import logoutHandler from "./logout.post";
import totpConfirmHandler from "./totp/confirm.post";
import { AUTH_COOKIE_NAME } from "../../../utils/auth-cookie";

function makeMockEvent(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): { event: H3Event; req: IncomingMessage; res: ServerResponse } {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.method = options.method || "POST";
  req.url = options.url || "/";
  req.headers = Object.fromEntries(
    Object.entries(options.headers || {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  if (options.body !== undefined) {
    (event as unknown as { _requestBody?: unknown })._requestBody =
      options.body;
  }
  return { event, req, res };
}

describe("BFF Auth Routes - Cookie & Token Hardening", () => {
  const originalEnv = process.env["NODE_ENV"];
  let fetchSpy: MockInstance;

  beforeEach(() => {
    process.env["API_URL"] = "http://backend.internal";
    process.env["NODE_ENV"] = "production";
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    process.env["NODE_ENV"] = originalEnv;
    vi.restoreAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("sets HttpOnly cookie and strips refreshToken from response body", async () => {
      const mockBackendData = {
        token: "access-token-123",
        refreshToken: "refresh-secret-jwt-999",
        expiresIn: 900,
        admin: {
          id: "adm-1",
          email: "admin@solexpay.com",
          firstName: "Admin",
          lastName: "User",
          role: "SUPER_ADMIN",
        },
        user: {
          id: "adm-1",
          email: "admin@solexpay.com",
          role: "ADMIN",
          firstName: "Admin",
          lastName: "User",
        },
      };

      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: mockBackendData,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { event, res } = makeMockEvent({
        body: {
          email: "admin@solexpay.com",
          password: "SuperSecretPassword123!",
        },
      });

      const body = await loginHandler(event);

      // Verify refreshToken is removed from JSON returned to browser
      expect(body).toBeDefined();
      const authBody = body as { token?: string; refreshToken?: string };
      expect("token" in authBody).toBe(true);
      expect(authBody.token).toBe("access-token-123");
      expect(authBody.refreshToken).toBeUndefined();
      expect("refreshToken" in authBody).toBe(false);

      // Verify sx_admin_rt HttpOnly cookie is set with strict security attributes
      const setCookieHeader = res.getHeader("set-cookie");
      expect(setCookieHeader).toBeDefined();
      const cookieStr = Array.isArray(setCookieHeader)
        ? setCookieHeader.join("; ")
        : String(setCookieHeader);

      expect(cookieStr).toContain(`${AUTH_COOKIE_NAME}=refresh-secret-jwt-999`);
      expect(cookieStr).toContain("HttpOnly");
      expect(cookieStr).toContain("SameSite=Strict");
      expect(cookieStr).toContain("Path=/api/auth");
      expect(cookieStr).toContain("Max-Age=43200");
      expect(cookieStr).toContain("Secure");
    });

    it("does not set Secure cookie attribute in development mode", async () => {
      process.env["NODE_ENV"] = "development";

      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              token: "access-token-123",
              refreshToken: "refresh-secret-jwt-999",
              expiresIn: 900,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { event, res } = makeMockEvent({
        body: {
          email: "admin@solexpay.com",
          password: "SuperSecretPassword123!",
        },
      });

      await loginHandler(event);

      const setCookieHeader = res.getHeader("set-cookie");
      const cookieStr = Array.isArray(setCookieHeader)
        ? setCookieHeader.join("; ")
        : String(setCookieHeader);

      expect(cookieStr).toContain(`${AUTH_COOKIE_NAME}=refresh-secret-jwt-999`);
      expect(cookieStr).toContain("HttpOnly");
      expect(cookieStr).not.toContain("Secure");
    });
  });

  describe("POST /api/auth/totp/confirm", () => {
    it("sets HttpOnly cookie and strips refreshToken from response body", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              token: "totp-access-token",
              refreshToken: "totp-refresh-secret",
              expiresIn: 900,
              admin: { id: "adm-1", role: "OPS" },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { event, res } = makeMockEvent({
        body: {
          enrollmentToken: "enr-tok-123",
          code: "123456",
        },
      });

      const body = await totpConfirmHandler(event);
      const confirmBody = body as { token?: string; refreshToken?: string };

      expect(confirmBody.token).toBe("totp-access-token");
      expect(confirmBody.refreshToken).toBeUndefined();

      const setCookieHeader = res.getHeader("set-cookie");
      const cookieStr = String(setCookieHeader);
      expect(cookieStr).toContain(`${AUTH_COOKIE_NAME}=totp-refresh-secret`);
      expect(cookieStr).toContain("HttpOnly");
      expect(cookieStr).toContain("Path=/api/auth");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("returns 401 without calling backend when sx_admin_rt cookie is absent", async () => {
      const { event } = makeMockEvent({
        headers: {}, // No cookie
        body: { refreshToken: "attacker-supplied-body-token" },
      });

      await expect(refreshHandler(event)).rejects.toMatchObject({
        statusCode: 401,
      });

      // Crucial: Backend must NOT have been called!
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("rotates refresh token cookie and strips it from body on successful refresh", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              token: "new-access-token-888",
              refreshToken: "rotated-refresh-token-999",
              expiresIn: 900,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { event, res } = makeMockEvent({
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=old-valid-refresh-token`,
        },
      });

      const body = await refreshHandler(event);

      // Verify backend was called with the cookie value
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/auth/admin/refresh"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ refreshToken: "old-valid-refresh-token" }),
        }),
      );

      // Body returned to browser has refreshToken stripped
      const refreshBody = body as { token?: string; refreshToken?: string };
      expect(refreshBody.token).toBe("new-access-token-888");
      expect(refreshBody.refreshToken).toBeUndefined();

      // Cookie updated with rotated token
      const setCookieHeader = String(res.getHeader("set-cookie"));
      expect(setCookieHeader).toContain(
        `${AUTH_COOKIE_NAME}=rotated-refresh-token-999`,
      );
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("Path=/api/auth");
    });

    it("deletes cookie and passes 401 through when backend returns 401", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            errorCode: "UNAUTHORIZED",
            message: "Invalid refresh token.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      );

      const { event, res } = makeMockEvent({
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=expired-or-revoked-token`,
        },
      });

      await expect(refreshHandler(event)).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid refresh token.",
      });

      // Verify cookie is cleared on 401
      const setCookieHeader = String(res.getHeader("set-cookie"));
      expect(setCookieHeader).toContain(`${AUTH_COOKIE_NAME}=;`);
      expect(setCookieHeader).toContain("Max-Age=0");
      expect(setCookieHeader).toContain("Path=/api/auth");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("calls backend logout with cookie token, deletes cookie, and returns 204", async () => {
      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));

      const { event, res } = makeMockEvent({
        headers: {
          cookie: `${AUTH_COOKIE_NAME}=active-session-refresh-token`,
        },
      });

      const result = await logoutHandler(event);

      // Verify backend was called with cookie's refresh token
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/auth/admin/logout"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            refreshToken: "active-session-refresh-token",
          }),
        }),
      );

      // Verify cookie is deleted
      const setCookieHeader = String(res.getHeader("set-cookie"));
      expect(setCookieHeader).toContain(`${AUTH_COOKIE_NAME}=;`);
      expect(setCookieHeader).toContain("Max-Age=0");
      expect(setCookieHeader).toContain("Path=/api/auth");

      // Verify 204 status returned
      expect(res.statusCode).toBe(204);
      expect(result).toBeNull();
    });

    it("clears cookie and returns 204 even when cookie was not present", async () => {
      const { event, res } = makeMockEvent({
        headers: {},
      });

      const result = await logoutHandler(event);

      // Backend not called if no token
      expect(fetchSpy).not.toHaveBeenCalled();

      // Cookie still deleted
      const setCookieHeader = String(res.getHeader("set-cookie"));
      expect(setCookieHeader).toContain(`${AUTH_COOKIE_NAME}=;`);
      expect(setCookieHeader).toContain("Max-Age=0");
      expect(res.statusCode).toBe(204);
      expect(result).toBeNull();
    });
  });
});
