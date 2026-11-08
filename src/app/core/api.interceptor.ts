import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { map } from "rxjs";
import { API_BASE, ADMIN_AUTH } from "./api";

function isEnvelope(body: unknown): body is { success: true; data?: unknown } {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as { success?: unknown }).success === true &&
    "data" in body
  );
}

/**
 * Unwraps the backend's {success, data} envelope and sends the refresh cookie on admin auth calls.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_BASE)) {
    return next(req);
  }

  if (req.url.startsWith(ADMIN_AUTH + "/")) {
    req = req.clone({ withCredentials: true });
  }

  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && isEnvelope(event.body)) {
        return event.clone({ body: event.body.data ?? null });
      }
      return event;
    }),
  );
};
