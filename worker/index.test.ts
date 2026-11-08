import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./env";
import worker from "./index";

describe("edge routing and security headers", () => {
  afterEach(() => vi.restoreAllMocks());
  it("hides internal files, unknown BFF paths, and secures asset responses", async () => {
    const assetFetch = vi.fn(
      async () =>
        new Response("asset", { headers: { "Content-Type": "text/plain" } }),
    );
    const env = {
      ENVIRONMENT: "development",
      ACCESS_AUD: "",
      SESSION_KEY: btoa(String.fromCharCode(...new Uint8Array(32))),
      ASSETS: { fetch: assetFetch },
    } as unknown as Env;
    const hidden = await worker.fetch(
      new Request("https://admin.test/mockServiceWorker.js"),
      env,
    );
    expect(hidden.status).toBe(404);
    expect(
      (await worker.fetch(new Request("https://admin.test/app.js.map"), env))
        .status,
    ).toBe(404);
    expect(
      (await worker.fetch(new Request("https://admin.test/bff/nope"), env))
        .status,
    ).toBe(404);
    const asset = await worker.fetch(
      new Request("https://admin.test/robots.txt"),
      env,
    );
    expect(asset.headers.get("X-Frame-Options")).toBe("DENY");
    expect(asset.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
