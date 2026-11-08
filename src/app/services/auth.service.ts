import { Injectable, signal, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import {
  Observable,
  tap,
  finalize,
  share,
  throwError,
  of,
  catchError,
  map,
} from "rxjs";
import { API_BASE, ADMIN_AUTH } from "../core/api";

export interface LoginRequest {
  email: string;
  password: string;
  totpCode?: string;
}

export interface AdminSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPPORT" | "OPS" | "COMPLIANCE" | "SUPER_ADMIN" | string;
}

export interface ShellUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface LoginSuccessResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  admin: AdminSummary;
  user: ShellUser;
}

export interface EnrollmentRequiredResponse {
  enrollmentRequired: true;
  enrollmentToken: string;
}

export type LoginResponse = LoginSuccessResponse | EnrollmentRequiredResponse;

export interface TOTPEnrollResponse {
  secret: string;
  otpauthUrl: string;
}

/** Backward compatibility for legacy tests */
export interface AuthResponse {
  token: string;
  user: ShellUser;
}

const ADMIN_DATA_KEY = "solexpay_admin_info";

@Injectable({ providedIn: "root" })
export class AuthService {
  // JWT access token stored strictly in memory
  private token = signal<string | null>(null);
  private adminData = signal<AdminSummary | null>(null);
  private currentUser = signal<ShellUser | null>(null);

  // Single-flight refresh observable
  private refreshInFlight$: Observable<LoginSuccessResponse> | null = null;
  private initialRefreshAttempted = false;
  private initialRefresh$: Observable<boolean> | null = null;

  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const storedAdmin = localStorage.getItem(ADMIN_DATA_KEY);
        if (storedAdmin) {
          const parsed = JSON.parse(storedAdmin);
          this.adminData.set(parsed);
          this.currentUser.set({
            id: parsed.id,
            email: parsed.email,
            role: "ADMIN",
            firstName: parsed.firstName,
            lastName: parsed.lastName,
          });
        }
      } catch {
        // ignore parse/storage errors
      }
    }
  }

  setSession(data: LoginSuccessResponse) {
    this.token.set(data.token);
    this.adminData.set(data.admin);
    this.currentUser.set(data.user);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        if (data.admin) {
          localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data.admin));
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  login(
    credentials: LoginRequest,
    role: "ADMIN" | "SCHOOL" = "ADMIN",
  ): Observable<LoginResponse> {
    const endpoint =
      role === "ADMIN"
        ? `${ADMIN_AUTH}/login`
        : `${API_BASE}/auth/school/login`;

    return this.http.post<LoginResponse>(endpoint, credentials).pipe(
      tap((response) => {
        if ("token" in response && response.token) {
          this.setSession(response as LoginSuccessResponse);
        }
      }),
    );
  }

  enrollTotp(enrollmentToken: string): Observable<TOTPEnrollResponse> {
    return this.http.post<TOTPEnrollResponse>(`${ADMIN_AUTH}/totp/enroll`, {
      enrollmentToken,
    });
  }

  confirmTotp(
    enrollmentToken: string,
    code: string,
  ): Observable<LoginSuccessResponse> {
    return this.http
      .post<LoginSuccessResponse>(`${ADMIN_AUTH}/totp/confirm`, {
        enrollmentToken,
        code,
      })
      .pipe(
        tap((response) => {
          this.setSession(response);
        }),
      );
  }

  /**
   * Single-flight token refresh. If a refresh is already in progress,
   * subsequent callers share the existing HTTP request.
   */
  refreshToken(): Observable<LoginSuccessResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.http
      .post<LoginSuccessResponse>(`${ADMIN_AUTH}/refresh`, {})
      .pipe(
        tap((res) => {
          this.setSession(res);
        }),
        catchError((err) => {
          this.clearSession();
          return throwError(() => err);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        share(),
      );

    return this.refreshInFlight$;
  }

  /**
   * Attempts one silent refresh on app start if there is no access token in memory,
   * before treating the user as logged out. The auth guard waits for this.
   */
  ensureInitialized(): Observable<boolean> {
    if (this.token()) {
      return of(true);
    }
    if (this.initialRefreshAttempted) {
      return of(this.isAuthenticated());
    }
    if (this.initialRefresh$) {
      return this.initialRefresh$;
    }

    this.initialRefresh$ = this.refreshToken().pipe(
      map(() => true),
      catchError(() => of(false)),
      finalize(() => {
        this.initialRefreshAttempted = true;
        this.initialRefresh$ = null;
      }),
      share(),
    );

    return this.initialRefresh$;
  }

  /**
   * Ends the session. `reason` tells the login page what to say:
   * "expired" when the session could not be refreshed.
   */
  logout(reason: "signed-out" | "expired" = "signed-out") {
    this.http
      .post(`${ADMIN_AUTH}/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();

    this.initialRefreshAttempted = true;
    this.clearSession();
    this.router.navigate(["/login"], { queryParams: { reason } });
  }

  clearSession() {
    this.token.set(null);
    this.adminData.set(null);
    this.currentUser.set(null);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.removeItem(ADMIN_DATA_KEY);
      } catch {
        // ignore
      }
    }
  }

  getToken(): string | null {
    return this.token();
  }

  /**
   * Refresh tokens are stored in HttpOnly cookies and never reach browser JS.
   * Retained for backward-compatibility only; always returns null.
   */
  getRefreshToken(): string | null {
    return null;
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  getCurrentUser(): ShellUser | null {
    return this.currentUser();
  }

  getAdmin(): AdminSummary | null {
    return this.adminData();
  }

  getAdminRole(): string | null {
    return this.adminData()?.role || null;
  }

  /**
   * Role-based access check. SUPER_ADMIN passes every check!
   */
  canAccess(allowedRoles: string[]): boolean {
    const role = this.getAdminRole();
    if (!role) return false;
    if (role === "SUPER_ADMIN") return true;
    return allowedRoles.includes(role);
  }

  hasRole(role: string): boolean {
    if (this.getAdminRole() === "SUPER_ADMIN") return true;
    return this.currentUser()?.role === role || this.getAdminRole() === role;
  }
}
