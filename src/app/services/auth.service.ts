import { Injectable, signal, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "SCHOOL" | "USER";
    firstName: string;
    lastName: string;
  };
}

@Injectable({ providedIn: "root" })
export class AuthService {
  // JWT stored in memory — never in localStorage
  private token = signal<string | null>(null);
  private currentUser = signal<AuthResponse["user"] | null>(null);

  private http = inject(HttpClient);
  private router = inject(Router);

  login(
    credentials: LoginRequest,
    role: "ADMIN" | "SCHOOL" = "ADMIN",
  ): Observable<AuthResponse> {
    // All auth goes through the AnalogJS BFF — backend URL stays server-side
    const endpoint =
      role === "ADMIN" ? `/api/auth/login` : `/api/auth/school/login`;

    return this.http.post<AuthResponse>(endpoint, credentials).pipe(
      tap((response) => {
        this.token.set(response.token);
        this.currentUser.set(response.user);
      }),
    );
  }

  forgotPassword(email: string): Observable<{
    message: string;
    resetLink?: string;
    resetToken?: string;
    email?: string;
    expiresIn?: string;
    sentAt?: string;
    _devNote?: string;
  }> {
    return this.http.post<{
      message: string;
      resetLink?: string;
      resetToken?: string;
      email?: string;
      expiresIn?: string;
      sentAt?: string;
      _devNote?: string;
    }>(`/api/auth/forgot-password`, { email });
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(["/login"]);
  }

  getToken(): string | null {
    return this.token();
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  getCurrentUser() {
    return this.currentUser();
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.role === role;
  }
}
