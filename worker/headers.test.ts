import { describe, expect, it } from "vitest";
import { applySecurityHeaders } from "./headers";

describe("security headers", () => {
  it("sets headers for assets and BFF replies while retaining worker cookies", () => {
    const asset = applySecurityHeaders(new Response("ok"), {
      isHtml: false,
      path: "/_next/static/a.js",
    });
    expect(asset.headers.get("Strict-Transport-Security")).toContain(
      "max-age=63072000",
    );
    expect(asset.headers.get("X-Frame-Options")).toBe("DENY");
    expect(asset.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(asset.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    const bff = applySecurityHeaders(
      new Response("ok", {
        headers: { "Set-Cookie": "__Host-sx_admin=sealed; HttpOnly" },
      }),
      { isHtml: false, path: "/bff/api/admin/profile" },
    );
    expect(bff.headers.get("Cache-Control")).toBe("no-store");
    expect(bff.headers.get("Strict-Transport-Security")).toContain(
      "max-age=63072000",
    );
    expect(bff.headers.get("X-Frame-Options")).toBe("DENY");
    expect(bff.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(bff.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(bff.headers.get("Set-Cookie")).toContain("HttpOnly");
  });
});
