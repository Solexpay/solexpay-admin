import "../../test";
import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { AuthService, LoginSuccessResponse } from "./auth.service";
import { Router } from "@angular/router";
import { vi } from "vitest";
import { ADMIN_AUTH } from "../core/api";

describe("Single-Flight Token Refresh", () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;

  const mockRefreshSuccess: LoginSuccessResponse = {
    token: "new.jwt.access.token",
    refreshToken: "new.rotated.refresh.token",
    expiresIn: 900,
    admin: {
      id: "admin-1",
      email: "admin@solexpay.com",
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
    },
    user: {
      id: "admin-1",
      email: "admin@solexpay.com",
      firstName: "Super",
      lastName: "Admin",
      role: "ADMIN",
    },
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });

    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    authService.setSession({
      token: "initial.access.token",
      expiresIn: 900,
      admin: mockRefreshSuccess.admin,
      user: mockRefreshSuccess.user,
    });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it("should collapse concurrent refreshToken() invocations into a single HTTP request with empty body", async () => {
    let result1: LoginSuccessResponse | undefined;
    let result2: LoginSuccessResponse | undefined;
    let result3: LoginSuccessResponse | undefined;

    // Fire 3 concurrent calls
    authService.refreshToken().subscribe((res) => (result1 = res));
    authService.refreshToken().subscribe((res) => (result2 = res));
    authService.refreshToken().subscribe((res) => (result3 = res));

    // Exactly 1 HTTP POST to the admin refresh endpoint, with an empty body
    const req = httpMock.expectOne(`${ADMIN_AUTH}/refresh`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({});

    // Respond to the single in-flight request
    req.flush(mockRefreshSuccess);

    // All 3 callers must receive the refreshed response
    expect(result1).toEqual(mockRefreshSuccess);
    expect(result2).toEqual(mockRefreshSuccess);
    expect(result3).toEqual(mockRefreshSuccess);

    // Internal state updated: access token in memory only, no refresh token in localStorage
    expect(authService.getToken()).toBe("new.jwt.access.token");
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getRefreshToken()).toBeNull();
    expect(localStorage.getItem("solexpay_refresh_token")).toBeNull();
  });

  it("should clear session and propagate error to all concurrent callers if refresh fails", async () => {
    let error1: unknown;
    let error2: unknown;

    authService.refreshToken().subscribe({
      next: () => expect.unreachable("should have failed"),
      error: (err) => (error1 = err),
    });
    authService.refreshToken().subscribe({
      next: () => expect.unreachable("should have failed"),
      error: (err) => (error2 = err),
    });

    const req = httpMock.expectOne(`${ADMIN_AUTH}/refresh`);
    expect(req.request.body).toEqual({});
    req.flush(
      { errorCode: "TOKEN_EXPIRED", message: "Refresh token expired" },
      { status: 401, statusText: "Unauthorized" },
    );

    expect(error1).toBeDefined();
    expect(error2).toBeDefined();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getToken()).toBeNull();
    expect(authService.getRefreshToken()).toBeNull();
    expect(localStorage.getItem("solexpay_refresh_token")).toBeNull();
  });

  it("should allow a new refresh request after previous in-flight request finishes", async () => {
    // First refresh cycle
    authService.refreshToken().subscribe();
    const req1 = httpMock.expectOne(`${ADMIN_AUTH}/refresh`);
    expect(req1.request.body).toEqual({});
    req1.flush(mockRefreshSuccess);

    // Second refresh cycle later
    authService.refreshToken().subscribe();
    const req2 = httpMock.expectOne(`${ADMIN_AUTH}/refresh`);
    expect(req2.request.body).toEqual({});
    req2.flush(mockRefreshSuccess);
  });

  it("should attempt silent refresh on app start via ensureInitialized when no access token in memory", async () => {
    authService.clearSession();
    expect(authService.isAuthenticated()).toBe(false);

    let authResult: boolean | undefined;
    authService.ensureInitialized().subscribe((res) => (authResult = res));

    const req = httpMock.expectOne(`${ADMIN_AUTH}/refresh`);
    expect(req.request.body).toEqual({});
    req.flush(mockRefreshSuccess);

    expect(authResult).toBe(true);
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getToken()).toBe("new.jwt.access.token");
  });

  it("should return false from ensureInitialized if silent refresh fails on start", async () => {
    authService.clearSession();
    expect(authService.isAuthenticated()).toBe(false);

    let authResult: boolean | undefined;
    authService.ensureInitialized().subscribe((res) => (authResult = res));

    const req = httpMock.expectOne(`${ADMIN_AUTH}/refresh`);
    req.flush(
      { errorCode: "UNAUTHORIZED", message: "No refresh cookie" },
      { status: 401, statusText: "Unauthorized" },
    );

    expect(authResult).toBe(false);
    expect(authService.isAuthenticated()).toBe(false);
  });
});
