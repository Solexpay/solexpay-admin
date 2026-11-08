import { verifyAccess } from "./access";
import { handleApi } from "./bff-api";
import { handleAuth } from "./bff-auth";
import { nonceHtml } from "./csp";
import type { Env } from "./env";
import { applySecurityHeaders } from "./headers";
import { type EdgeLog, writeLog } from "./log";
import { clearSessionCookie, openSession, validateSessionKey } from "./session";

const ALLOWED_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);
const BAD_PATH =
  /\.\.|\/\/|%2e|%2f|%5c|%0[0-9a-f]|%1[0-9a-f]|%7f|\\|\x00|[\x01-\x1f\x7f]/i;

function json(status: number, code: string, message: string): Response {
  return Response.json(
    { success: false, errorCode: code, message },
    { status },
  );
}

function routeFor(path: string): EdgeLog["route"] {
  if (path.startsWith("/bff/auth/")) return "bff_auth";
  if (path.startsWith("/bff/api/")) return "bff_api";
  if (path === "/bff/csp-report") return "csp_report";
  if (path.startsWith("/bff/")) return "blocked";
  return "asset";
}

function isHidden(path: string): boolean {
  return (
    path === "/mockServiceWorker.js" ||
    path.endsWith(".map") ||
    (path.startsWith("/.well-known/") && path !== "/.well-known/security.txt")
  );
}

async function cspReport(
  request: Request,
): Promise<{ response: Response; report?: unknown }> {
  const declared = request.headers.get("Content-Length");
  if (declared && Number(declared) > 8192)
    return { response: new Response(null, { status: 413 }) };
  const bytes = await readCspBody(request);
  if (!bytes) return { response: new Response(null, { status: 413 }) };
  const text = new TextDecoder().decode(bytes);
  try {
    const parsed: unknown = JSON.parse(text);
    const report = truncateStrings(parsed);
    return { response: new Response(null, { status: 204 }), report };
  } catch {
    return { response: new Response(null, { status: 204 }) };
  }
}

function truncateStrings(value: unknown, depth = 0): unknown {
  if (depth > 8) return undefined;
  if (typeof value === "string") return redact(value).slice(0, 500);
  if (Array.isArray(value))
    return value.slice(0, 100).map((item) => truncateStrings(item, depth + 1));
  if (typeof value === "object" && value !== null) {
    const clean: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >;
    for (const [key, item] of Object.entries(value).slice(0, 100)) {
      clean[key] = /token|authorization|cookie|secret/i.test(key)
        ? "[redacted]"
        : truncateStrings(item, depth + 1);
    }
    return clean;
  }
  return value;
}

async function readCspBody(request: Request): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > 8192) {
      await reader.cancel();
      return null;
    }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function redact(value: string): string {
  return value
    .split("?")[0]
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(
      /(token|authorization|cookie|secret)[=: ]+[^\s,;]+/gi,
      "$1=[redacted]",
    )
    .replace(
      /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
      "[redacted]",
    );
}

/** Handles static assets and the same-origin admin BFF. */
async function fetchHandler(request: Request, env: Env): Promise<Response> {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;
  let route = routeFor(path);
  let accessEmail: string | undefined;
  let adminId: string | undefined;
  let level: EdgeLog["level"] = "info";
  let errorInfo: EdgeLog["error"];
  let report: unknown;
  let accessDisabled = false;
  let response: Response;
  try {
    if (!ALLOWED_METHODS.has(request.method)) {
      route = "blocked";
      response = new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS" },
      });
    } else if (request.method === "OPTIONS") {
      response = new Response(null, { status: 204 });
    } else if (
      path.length > 512 ||
      request.url.length > 4096 ||
      BAD_PATH.test(path)
    ) {
      route = "blocked";
      response = json(400, "INVALID_URL", "Invalid request.");
    } else {
      const access = await verifyAccess(request, env, () => {
        accessDisabled = true;
      });
      if (access.allowed) await validateSessionKey(env);
      accessEmail = access.email;
      if (!access.allowed) {
        route = "blocked";
        response = access.unavailable
          ? new Response("Gateway not configured", { status: 503 })
          : new Response("Forbidden", { status: 403 });
      } else if (
        isHidden(path) ||
        (path.startsWith("/bff/") &&
          ![
            "/bff/auth/login",
            "/bff/auth/totp/enroll",
            "/bff/auth/totp/confirm",
            "/bff/auth/session",
            "/bff/auth/refresh",
            "/bff/auth/logout",
            "/bff/csp-report",
          ].includes(path) &&
          !path.startsWith("/bff/api/"))
      ) {
        route = "blocked";
        response = new Response("Not Found", { status: 404 });
      } else if (path.startsWith("/bff/auth/")) {
        route = "bff_auth";
        const session = await openSession(env, request.headers.get("Cookie"));
        adminId = session?.admin.id;
        response = await handleAuth(request, { env, requestId });
        if (
          !session &&
          hasSessionCookie(request.headers.get("Cookie")) &&
          !response.headers.get("Set-Cookie")?.includes("Max-Age=43200")
        )
          response = appendSetCookie(response, clearSessionCookie());
      } else if (path.startsWith("/bff/api/")) {
        route = "bff_api";
        const session = await openSession(env, request.headers.get("Cookie"));
        adminId = session?.admin.id;
        response = await handleApi(request, { env, requestId });
      } else if (path === "/bff/csp-report") {
        route = "csp_report";
        if (request.method !== "POST")
          response = new Response(null, {
            status: 405,
            headers: { Allow: "POST" },
          });
        else {
          const result = await cspReport(request);
          response = result.response;
          report = result.report;
        }
      } else if (
        path === "/robots.txt" &&
        (request.method === "GET" || request.method === "HEAD")
      ) {
        response = new Response(
          request.method === "HEAD" ? null : "User-agent: *\nDisallow: /\n",
          { headers: { "Content-Type": "text/plain; charset=utf-8" } },
        );
      } else if (request.method !== "GET" && request.method !== "HEAD") {
        route = "blocked";
        response = new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      } else {
        response = await env.ASSETS.fetch(request);
      }
    }
  } catch (error) {
    route = route === "asset" ? "blocked" : route;
    level = "error";
    errorInfo = {
      name: error instanceof Error ? error.name : "Error",
      message: safeErrorMessage(error),
    };
    response = json(500, "EDGE_ERROR", "Something went wrong.");
  }

  let nonce: string | undefined;
  const isHtml =
    response.headers
      .get("Content-Type")
      ?.toLowerCase()
      .includes("text/html") === true;
  try {
    if (isHtml) {
      const transformed = nonceHtml(response);
      response = transformed.response;
      nonce = transformed.nonce;
    }
    response = applySecurityHeaders(response, { nonce, isHtml, path });
    if (!response.headers.has("X-Request-Id")) {
      const headers = new Headers(response.headers);
      headers.set("X-Request-Id", requestId);
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
  } catch (error) {
    level = "error";
    errorInfo = {
      name: error instanceof Error ? error.name : "Error",
      message: safeErrorMessage(error),
    };
    response = applySecurityHeaders(
      json(500, "EDGE_ERROR", "Something went wrong."),
      { isHtml: false, path },
    );
  }
  if (accessDisabled && !errorInfo) level = "warn";
  writeLog({
    level,
    msg: "admin_edge",
    request_id: requestId,
    ray: request.headers.get("CF-Ray"),
    method: request.method,
    path,
    status: response.status,
    dur_ms: Date.now() - started,
    ip: request.headers.get("CF-Connecting-IP"),
    country:
      typeof request.cf?.country === "string" ? request.cf.country : undefined,
    access_email: accessEmail,
    admin_id: adminId,
    route,
    ua: (request.headers.get("User-Agent") || "").slice(0, 200),
    error: errorInfo,
    report,
    event: accessDisabled ? "access_disabled" : undefined,
  });
  return response;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return redact(message).slice(0, 500);
}

function hasSessionCookie(cookieHeader: string | null): boolean {
  return (
    cookieHeader
      ?.split(";")
      .some((part) => part.trim().startsWith("__Host-sx_admin=")) === true
  );
}

function appendSetCookie(response: Response, cookie: string): Response {
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default { fetch: fetchHandler } satisfies ExportedHandler<Env>;
