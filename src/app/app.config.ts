import { ApplicationConfig, inject, ErrorHandler } from "@angular/core";
import { provideRouter } from "@angular/router";
import {
  provideHttpClient,
  withInterceptors,
  HttpHandlerFn,
  HttpRequest,
  HttpErrorResponse,
} from "@angular/common/http";
import {
  provideAngularQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { catchError, switchMap, throwError } from "rxjs";
import { routes } from "./app.routes";
import { AuthService } from "./services/auth.service";
import { GlobalErrorHandler } from "./core/global-error-handler";

/**
 * Auth interceptor:
 * - Attaches Bearer JWT access token to requests.
 * - On 401 (except for auth endpoints), triggers a single-flight token refresh once and retries.
 * - On refresh failure, logs out and redirects to login.
 */
export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (
        err.status === 401 &&
        !req.url.includes("/api/auth/login") &&
        !req.url.includes("/api/auth/refresh") &&
        !req.url.includes("/api/auth/logout") &&
        !req.url.includes("/api/auth/totp/")
      ) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            const retriedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.token}`,
              },
            });
            return next(retriedReq);
          }),
          catchError((refreshErr) => {
            authService.logout();
            return throwError(() => refreshErr);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
    ),
  ],
};
