import type { Env } from "./env";
import { gatewayFetch, readLimitedBody } from "./gateway";
import { clearSessionCookie, openSession } from "./session";
import {
  csrfAllowed,
  idempotencyKey,
  readJsonBody,
  sanitizeQuery,
  validApiPath,
  validationResponse,
} from "./validate";

/** BFF API request context. */
export interface ApiContext {
  env: Env;
  requestId: string;
}

function errorResponse(
  status: number,
  errorCode: string,
  message: string,
  requestId: string,
  cookie?: string,
): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Request-Id": requestId,
  });
  if (cookie) headers.append("Set-Cookie", cookie);
  return Response.json(
    { success: false, errorCode, message },
    { status, headers },
  );
}

async function backendResponse(
  response: Response,
  requestId: string,
  cookie?: string,
): Promise<Response> {
  if (response.status === 504)
    return errorResponse(
      504,
      "GATEWAY_TIMEOUT",
      "Backend request timed out.",
      requestId,
      cookie,
    );
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json"))
    return errorResponse(
      502,
      "BACKEND_ERROR",
      "Backend response unavailable.",
      requestId,
      cookie,
    );
  const body = await readLimitedBody(response, 5 * 1024 * 1024);
  if (!body)
    return errorResponse(
      502,
      "BACKEND_ERROR",
      "Backend response unavailable.",
      requestId,
      cookie,
    );
  const headers = new Headers({
    "Content-Type": contentType,
    "X-Request-Id": requestId,
  });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(body, { status: response.status, headers });
}

/** Handles authenticated admin data API requests. */
export async function handleApi(
  request: Request,
  context: ApiContext,
): Promise<Response> {
  const url = new URL(request.url);
  if (!csrfAllowed(request))
    return errorResponse(
      403,
      "CSRF_REJECTED",
      "Request blocked.",
      context.requestId,
    );
  const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
  if (!methods.has(request.method))
    return errorResponse(
      405,
      "METHOD_NOT_ALLOWED",
      "Method not allowed.",
      context.requestId,
    );
  const apiPath = url.pathname.slice("/bff/api".length);
  if (!validApiPath(apiPath))
    return errorResponse(404, "NOT_FOUND", "Not found.", context.requestId);
  let query: string;
  try {
    query = sanitizeQuery(url.search.slice(1));
  } catch {
    return validationResponse();
  }
  const session = await openSession(context.env, request.headers.get("Cookie"));
  if (!session)
    return errorResponse(
      401,
      "UNAUTHENTICATED",
      "Sign in to continue.",
      context.requestId,
      request.headers.has("Cookie") ? clearSessionCookie() : undefined,
    );
  if (
    context.env.API_LIMITER &&
    !(await context.env.API_LIMITER.limit({ key: `api:${session.sid}` }))
      .success
  )
    return errorResponse(
      429,
      "RATE_LIMITED",
      "Too many requests.",
      context.requestId,
    );
  // Refresh tokens rotate with reuse detection on the backend, so concurrent
  // refreshes from parallel requests would revoke the session family. Only the
  // browser refreshes (POST /bff/auth/refresh, serialised with a Web Lock);
  // here an expired access token is reported as TOKEN_EXPIRED.
  if (session.atExp - Math.floor(Date.now() / 1000) < 15)
    return errorResponse(
      401,
      "TOKEN_EXPIRED",
      "Session needs refreshing.",
      context.requestId,
    );
  let idemKey: string | undefined;
  try {
    idemKey = idempotencyKey(request.headers.get("X-Idempotency-Key"));
  } catch {
    return validationResponse();
  }
  let body: string | undefined;
  if (request.method !== "GET") {
    try {
      const cap = apiPath === "/admin/client-events" ? 32 * 1024 : 64 * 1024;
      body = JSON.stringify(await readJsonBody(request, cap));
    } catch (error) {
      if (error instanceof TypeError && error.message === "unsupported")
        return new Response(null, { status: 415 });
      if (error instanceof RangeError)
        return new Response(null, { status: 413 });
      return validationResponse();
    }
  }
  const pathWithQuery = `/api/v1${apiPath}${query ? `?${query}` : ""}`;
  const response = await gatewayFetch({
    request,
    env: context.env,
    requestId: context.requestId,
    pathWithQuery,
    method: request.method,
    body,
    accessToken: session.at,
    purpose: request.headers.get("X-Admin-Purpose"),
    idempotencyKey: idemKey,
  });
  if (response.status === 401)
    return errorResponse(
      401,
      "TOKEN_EXPIRED",
      "Session needs refreshing.",
      context.requestId,
    );
  return backendResponse(response, context.requestId);
}
