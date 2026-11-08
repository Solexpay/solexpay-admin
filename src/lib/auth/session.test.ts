import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "../../mocks/server";
import { ADMIN_AUTH } from "../api-base";
import { getAccessToken, logout, useAdminSession } from "./session";

describe("admin session", () => {
  afterEach(async () => {
    await logout();
  });

  it("sets the admin and authenticated status after login", async () => {
    const { result } = renderHook(() => useAdminSession());
    const response = await act(() =>
      result.current.login("person@solexpay.com", "password"),
    );
    expect("token" in response).toBe(true);
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.admin?.email).toBe("person@solexpay.com");
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

  it("logout clears the in-memory session", async () => {
    const { result } = renderHook(() => useAdminSession());
    await act(() => result.current.login("person@solexpay.com", "password"));
    await act(() => result.current.logout());
    expect(result.current.status).toBe("anonymous");
    expect(getAccessToken()).toBeNull();
  });

  it("applies section access by role", async () => {
    const { result } = renderHook(() => useAdminSession());
    await act(() => result.current.login("person@solexpay.com", "password"));
    expect(result.current.canAccess("kyc")).toBe(true);
    server.use(
      http.post(`${ADMIN_AUTH}/login`, () =>
        HttpResponse.json({
          token: "support-token",
          expiresIn: 900,
          admin: {
            id: "s",
            email: "support@solexpay.com",
            firstName: "Support",
            lastName: "Agent",
            role: "SUPPORT",
          },
          user: {
            id: "s",
            email: "support@solexpay.com",
            firstName: "Support",
            lastName: "Agent",
            role: "ADMIN",
          },
        }),
      ),
    );
    await act(() => result.current.login("support@solexpay.com", "password"));
    expect(result.current.canAccess("kyc")).toBe(false);
    expect(result.current.canAccess("users")).toBe(true);
  });
});
