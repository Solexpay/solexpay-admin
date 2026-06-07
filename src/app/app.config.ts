import { ApplicationConfig, inject, ErrorHandler } from "@angular/core";
import { provideRouter } from "@angular/router";
import {
  provideHttpClient,
  withInterceptors,
  HttpHandlerFn,
  HttpRequest,
} from "@angular/common/http";
import {
  provideAngularQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { routes } from "./app.routes";
import { AuthService } from "./services/auth.service";
import { GlobalErrorHandler } from "./core/global-error-handler";

// Auth interceptor to add JWT token
function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
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
