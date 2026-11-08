import { describe, expect, it, vi } from "vitest";
import { verifyAccess } from "./access";
import type { Env } from "./env";

describe("Cloudflare Access gate", () => {
  it("fails closed in production when unconfigured", async () => {
    const result = await verifyAccess(
      new Request("https://admin.test"),
      { ENVIRONMENT: "production", ACCESS_AUD: "" } as Env,
      vi.fn(),
    );
    expect(result).toEqual({ allowed: false, unavailable: true });
  });
  it("rejects a missing assertion when audience is configured", async () => {
    const result = await verifyAccess(
      new Request("https://admin.test"),
      {
        ENVIRONMENT: "production",
        ACCESS_AUD: "aud",
        ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
      } as Env,
      vi.fn(),
    );
    expect(result.allowed).toBe(false);
  });
});
