import type { Env } from "./env";
import {
  gatewayFetch,
  readLimitedBody,
  refreshTokenFromHeaders,
} from "./gateway";
import {
  clearSessionCookie,
  openSession,
  type SessionPayload,
  sealSession,
} from "./session";
import {
  confirmSchema,
  csrfAllowed,
  enrollSchema,
  loginSchema,
  readJsonBody,
  validationResponse,
} from "./validate";

/** BFF auth request context. */
export interface AuthContext {
  env: Env;
  requestId: string;
}

function jsonError(
  status: number,
  errorCode: string,
  message: string,
  cookie?: string,
): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (cookie) headers.append("Set-Cookie", cookie);
  return Response.json(
    { success: false, errorCode, message },
    { status, headers },
  );
}

function sessionFromRequest(
  request: Request,
  env: Env,
): Promise<SessionPayload | null> {
  return openSession(env, request.headers.get("Cookie"));
}

async function boundedBackend(
  response: Response,
  max: number,
): Promise<{ body: unknown; text: string } | null> {
  const bytes = await readLimitedBody(response, max);
  if (!bytes) return null;
  const text = new TextDecoder().decode(bytes);
  try {
    return { body: JSON.parse(text) as unknown, text };
  } catch {
    return null;
  }
}

function dataOf(body: unknown): Record<string, unknown> | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("success" in body) ||
    body.success !== true ||
    !("data" in body) ||
    typeof body.data !== "object" ||
    body.data === null
  )
    return null;
  return body.data as Record<string, unknown>;
}

function isLoginSuccess(data: Record<string, unknown> | null): data is Record<
  string,
  unknown
> & {
  token: string;
  expiresIn: number;
  admin: SessionPayload["admin"];
} {
  return (
    !!data &&
    typeof data.token === "string" &&
    typeof data.expiresIn === "number" &&
    typeof data.admin === "object" &&
    data.admin !== null
  );
}

async function sessionCookie(
  env: Env,
  data: Record<string, unknown>,
  rt: string,
  sid?: string,
): Promise<string | null> {
  if (!isLoginSuccess(data)) return null;
  const now = Math.floor(Date.now() / 1000);
  const cookie = await sealSession(env, {
    v: 1,
    at: data.token,
    atExp: now + data.expiresIn,
    rt,
    admin: data.admin,
    iat: now,
    sid: sid || crypto.randomUUID(),
  });
  return cookie;
}

async function authForward(
  request: Request,
  context: AuthContext,
  path: string,
  body: unknown,
): Promise<Response> {
  return gatewayFetch({
    request,
    env: context.env,
    requestId: context.requestId,
    pathWithQuery: `/api/v1/auth/admin${path}`,
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function limited(request: Request, env: Env): Promise<boolean> {
  if (!env.LOGIN_LIMITER) return false;
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  return !(await env.LOGIN_LIMITER.limit({ key: `login:${ip}` })).success;
}

async function refresh(
  request: Request,
  context: AuthContext,
  current: SessionPayload,
): Promise<{ session: SessionPayload; cookie: string } | null> {
  const response = await gatewayFetch({
    request,
    env: context.env,
    requestId: context.requestId,
    pathWithQuery: "/api/v1/auth/admin/refresh",
    method: "POST",
    body: "{}",
    refreshToken: current.rt,
  });
  const parsed = await boundedBackend(response, 8192);
  const data = dataOf(parsed?.body);
  if (!response.ok || !isLoginSuccess(data)) return null;
  const rotated = refreshTokenFromHeaders(response.headers) || current.rt;
  const cookie = await sessionCookie(context.env, data, rotated, current.sid);
  if (!cookie) return null;
  const now = Math.floor(Date.now() / 1000);
  return {
    session: {
      v: 1,
      at: data.token,
      atExp: now + data.expiresIn,
      rt: rotated,
      admin: data.admin,
      iat: now,
      sid: current.sid,
    },
    cookie,
  };
}

/** Handles the private admin authentication endpoints. */
export async function handleAuth(
  request: Request,
  context: AuthContext,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (method === "GET" && path === "/bff/auth/session") {
    if (!csrfAllowed(request))
      return jsonError(403, "CSRF_REJECTED", "Request blocked.");
    const current = await sessionFromRequest(request, context.env);
    if (!current)
      return jsonError(
        401,
        "UNAUTHENTICATED",
        "Sign in to continue.",
        request.headers.has("Cookie") ? clearSessionCookie() : undefined,
      );
    // Never refresh here: tabs load concurrently and the backend revokes the
    // session family on refresh-token reuse. expiresIn may be <= 0; the
    // browser then calls POST /bff/auth/refresh under a Web Lock.
    const now = Math.floor(Date.now() / 1000);
    return Response.json(
      {
        success: true,
        data: { admin: current.admin, expiresIn: current.atExp - now },
      },
      { headers: { "X-Request-Id": context.requestId } },
    );
  }
  if (!path.startsWith("/bff/auth/") || !["POST"].includes(method))
    return jsonError(404, "NOT_FOUND", "Not found.");
  const routes: Record<string, string> = {
    "/bff/auth/login": "/login",
    "/bff/auth/totp/enroll": "/totp/enroll",
    "/bff/auth/totp/confirm": "/totp/confirm",
  };
  if (path === "/bff/auth/logout" || path === "/bff/auth/refresh") {
    if (!csrfAllowed(request))
      return jsonError(403, "CSRF_REJECTED", "Request blocked.");
    const current = await sessionFromRequest(request, context.env);
    if (path.endsWith("logout")) {
      if (current)
        await gatewayFetch({
          request,
          env: context.env,
          requestId: context.requestId,
          pathWithQuery: "/api/v1/auth/admin/logout",
          method: "POST",
          body: "{}",
          refreshToken: current.rt,
        }).catch(() => undefined);
      return new Response(null, {
        status: 204,
        headers: {
          "Set-Cookie": clearSessionCookie(),
          "X-Request-Id": context.requestId,
        },
      });
    }
    if (!current)
      return jsonError(
        401,
        "UNAUTHENTICATED",
        "Sign in to continue.",
        request.headers.has("Cookie") ? clearSessionCookie() : undefined,
      );
    const updated = await refresh(request, context, current);
    if (!updated)
      return jsonError(
        401,
        "UNAUTHENTICATED",
        "Sign in to continue.",
        clearSessionCookie(),
      );
    const headers = new Headers({ "X-Request-Id": context.requestId });
    headers.append("Set-Cookie", updated.cookie);
    return Response.json(
      {
        success: true,
        data: {
          admin: updated.session.admin,
          expiresIn: updated.session.atExp - Math.floor(Date.now() / 1000),
        },
      },
      { headers },
    );
  }
  const backendPath = routes[path];
  if (!backendPath) return jsonError(404, "NOT_FOUND", "Not found.");
  if (!csrfAllowed(request))
    return jsonError(403, "CSRF_REJECTED", "Request blocked.");
  if (await limited(request, context.env))
    return jsonError(
      429,
      "RATE_LIMITED",
      "Too many attempts. Try again in a minute.",
    );
  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(request, 4096);
  } catch (error) {
    if (error instanceof TypeError && error.message === "unsupported")
      return new Response(null, { status: 415 });
    if (error instanceof RangeError) return new Response(null, { status: 413 });
    return validationResponse();
  }
  const schema = path.endsWith("/login")
    ? loginSchema
    : path.endsWith("/enroll")
      ? enrollSchema
      : confirmSchema;
  const result = schema.safeParse(body);
  if (!result.success) return validationResponse();
  const response = await authForward(
    request,
    context,
    backendPath,
    result.data,
  );
  if (response.status === 504)
    return jsonError(504, "GATEWAY_TIMEOUT", "Backend request timed out.");
  const parsed = await boundedBackend(response, 8192);
  if (!parsed)
    return jsonError(502, "BACKEND_ERROR", "Backend response unavailable.");
  const data = dataOf(parsed.body);
  if (
    response.ok &&
    path.endsWith("/login") &&
    data?.enrollmentRequired === true
  )
    return Response.json(parsed.body, {
      status: response.status,
      headers: { "X-Request-Id": context.requestId },
    });
  if (response.ok && path.endsWith("/enroll"))
    return new Response(parsed.text, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": context.requestId,
      },
    });
  if (response.ok && !isLoginSuccess(data))
    return jsonError(502, "BACKEND_ERROR", "Backend response unavailable.");
  if (response.ok && isLoginSuccess(data)) {
    const rt = refreshTokenFromHeaders(response.headers);
    if (!rt)
      return jsonError(502, "BACKEND_ERROR", "Backend response unavailable.");
    const cookie = await sessionCookie(context.env, data, rt);
    if (!cookie)
      return jsonError(502, "BACKEND_ERROR", "Backend response unavailable.");
    return Response.json(
      { success: true, data: { admin: data.admin, expiresIn: data.expiresIn } },
      {
        status: response.status,
        headers: { "Set-Cookie": cookie, "X-Request-Id": context.requestId },
      },
    );
  }
  return new Response(parsed.text, {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": context.requestId,
    },
  });
}
