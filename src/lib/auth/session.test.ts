import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "../../mocks/server";
import {
  __resetSessionForTests,
  initialize,
  logout,
  useAdminSession,
} from "./session";

describe("admin session", () => {
  afterEach(async () => {
    await logout();
    __resetSessionForTests();
  });

  it("authenticates from /bff/auth/session on initialize", async () => {
    server.use(
      http.get("*/bff/auth/session", () =>
        HttpResponse.json({
          expiresIn: 1800,
          admin: {
            id: "admin-init",
            email: "init@solexpay.com",
            firstName: "Init",
            lastName: "Admin",
            role: "SUPER_ADMIN",
          },
        }),
      ),
    );
    const { result } = renderHook(() => useAdminSession());
    await act(async () => {
      await initialize(true);
    });
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.admin?.email).toBe("init@solexpay.com");
  });

  it("becomes anonymous when /bff/auth/session returns 401", async () => {
    server.use(
      http.get(
        "*/bff/auth/session",
        () => new HttpResponse(null, { status: 401 }),
      ),
    );
    const { result } = renderHook(() => useAdminSession());
    await act(async () => {
      await initialize(true);
    });
    await waitFor(() => expect(result.current.status).toBe("anonymous"));
    expect(result.current.admin).toBeNull();
  });

  it("login sets admin and response object has no token key", async () => {
    const { result } = renderHook(() => useAdminSession());
    const response = await act(() =>
      result.current.login("person@solexpay.com", "password"),
    );
    expect("admin" in response).toBe(true);
    expect("token" in response).toBe(false);
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.admin?.email).toBe("person@solexpay.com");
  });

  it("logout sends X-SX-CSRF: 1 and sets status to anonymous", async () => {
    let logoutCsrf: string | null = null;
    server.use(
      http.post("*/bff/auth/logout", ({ request }) => {
        logoutCsrf = request.headers.get("x-sx-csrf");
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHook(() => useAdminSession());
    await act(() => result.current.login("person@solexpay.com", "password"));
    expect(result.current.status).toBe("authenticated");

    await act(() => result.current.logout());
    expect(logoutCsrf).toBe("1");
    expect(result.current.status).toBe("anonymous");
    expect(result.current.admin).toBeNull();
  });

  it("clears local session when BroadcastChannel receives logout from another tab", async () => {
    const { result } = renderHook(() => useAdminSession());
    await act(() => result.current.login("person@solexpay.com", "password"));
    await waitFor(() => expect(result.current.status).toBe("authenticated"));

    const otherTab = new BroadcastChannel("sx-admin-session");
    act(() => {
      otherTab.postMessage("logout");
    });

    await waitFor(() => expect(result.current.status).toBe("anonymous"));
    expect(result.current.admin).toBeNull();
    otherTab.close();
  });

  it("preserves enrollment-required response", async () => {
    const { result } = renderHook(() => useAdminSession());
    const response = await act(() =>
      result.current.login("totp-enroll@solexpay.com", "password"),
    );
    expect(response).toEqual({
      enrollmentRequired: true,
      enrollmentToken: "mock-enrollment-token-12345",
    });
  });

  it("applies section access by role", async () => {
    const { result } = renderHook(() => useAdminSession());
    await act(() => result.current.login("person@solexpay.com", "password"));
    expect(result.current.canAccess("kyc")).toBe(true);

    server.use(
      http.post("*/bff/auth/login", () =>
        HttpResponse.json({
          expiresIn: 1800,
          admin: {
            id: "s",
            email: "support@solexpay.com",
            firstName: "Support",
            lastName: "Agent",
            role: "SUPPORT",
          },
        }),
      ),
    );
    await act(() => result.current.login("support@solexpay.com", "password"));
    expect(result.current.canAccess("kyc")).toBe(false);
    expect(result.current.canAccess("users")).toBe(true);
  });
});
