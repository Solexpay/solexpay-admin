import "../../test";
import { TestBed } from "@angular/core/testing";
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";
import { Observable, of } from "rxjs";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { authGuard, adminGuard } from "./auth.guard";
import { AuthService } from "../services/auth.service";

describe("authGuard & adminGuard", () => {
  let authServiceMock: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasRole: ReturnType<typeof vi.fn>;
    ensureInitialized: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    parseUrl: ReturnType<typeof vi.fn>;
  };
  const mockLoginUrlTree = new UrlTree();
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn(),
      hasRole: vi.fn(),
      ensureInitialized: vi.fn(),
    };
    routerMock = {
      parseUrl: vi.fn(() => mockLoginUrlTree),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  describe("authGuard", () => {
    it("returns true immediately when user is already authenticated", () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState),
      );
      expect(result).toBe(true);
      expect(authServiceMock.ensureInitialized).not.toHaveBeenCalled();
    });

    it("waits for silent refresh when unauthenticated and allows access on success", () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      authServiceMock.ensureInitialized.mockReturnValue(of(true));

      const obs = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState),
      ) as Observable<boolean | UrlTree>;
      let outcome: boolean | UrlTree | undefined;
      obs.subscribe((val) => (outcome = val));

      expect(authServiceMock.ensureInitialized).toHaveBeenCalled();
      expect(outcome).toBe(true);
    });

    it("redirects to /login when silent refresh fails", () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      authServiceMock.ensureInitialized.mockReturnValue(of(false));

      const obs = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState),
      ) as Observable<boolean | UrlTree>;
      let outcome: boolean | UrlTree | undefined;
      obs.subscribe((val) => (outcome = val));

      expect(authServiceMock.ensureInitialized).toHaveBeenCalled();
      expect(outcome).toBe(mockLoginUrlTree);
      expect(routerMock.parseUrl).toHaveBeenCalledWith("/login");
    });
  });

  describe("adminGuard", () => {
    it("returns true when authenticated and has ADMIN role", () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      authServiceMock.hasRole.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard(mockRoute, mockState),
      );
      expect(result).toBe(true);
    });

    it("redirects when authenticated but lacks ADMIN role", () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);
      authServiceMock.hasRole.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard(mockRoute, mockState),
      );
      expect(result).toBe(mockLoginUrlTree);
    });

    it("waits for silent refresh when not yet authenticated and checks ADMIN role", () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      authServiceMock.ensureInitialized.mockReturnValue(of(true));
      authServiceMock.hasRole.mockReturnValue(true);

      const obs = TestBed.runInInjectionContext(() =>
        adminGuard(mockRoute, mockState),
      ) as Observable<boolean | UrlTree>;
      let outcome: boolean | UrlTree | undefined;
      obs.subscribe((val) => (outcome = val));

      expect(outcome).toBe(true);
    });
  });
});
