import { ApplicationConfig, inject, ErrorHandler } from "@angular/core";
import { TitleStrategy, provideRouter } from "@angular/router";
import {
  provideHttpClient,
  withInterceptors,
  HttpHandlerFn,
  HttpRequest,
  HttpErrorResponse,
  withXhr,
} from "@angular/common/http";
import {
  provideAngularQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { provideLucideConfig } from "@lucide/angular";
import { catchError, switchMap, throwError } from "rxjs";
import { routes } from "./app.routes";
import { AuthService } from "./services/auth.service";
import { GlobalErrorHandler } from "./core/global-error-handler";
import { apiInterceptor } from "./core/api.interceptor";
import { PageTitleStrategy } from "./core/page-title.strategy";

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
        !req.url.includes("/auth/admin/login") &&
        !req.url.includes("/auth/admin/refresh") &&
        !req.url.includes("/auth/admin/logout") &&
        !req.url.includes("/auth/admin/totp/") &&
        !req.url.includes("/auth/school/")
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
            authService.logout("expired");
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
    // Scrolling is reset by the admin layout: pages scroll inside <main>,
    // which the router's window-based scroll restoration never touches.
    provideRouter(routes),
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    provideHttpClient(
      withXhr(),
      withInterceptors([apiInterceptor, authInterceptor]),
    ),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Thin strokes like the rest of the console.
    provideLucideConfig({ strokeWidth: 1.75 }),
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
