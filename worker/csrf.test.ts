import { describe, expect, it } from "vitest";
import { csrfAllowed } from "./validate";

describe("CSRF gate", () => {
  it("requires same origin, fetch metadata, and the explicit token for mutations", () => {
    expect(
      csrfAllowed(
        new Request("https://admin.test/bff/api/admin/users", {
          method: "POST",
        }),
      ),
    ).toBe(false);
    expect(
      csrfAllowed(
        new Request("https://admin.test/bff/api/admin/users", {
          method: "POST",
          headers: {
            Origin: "https://admin.test",
            "X-SX-CSRF": "1",
            "Sec-Fetch-Site": "cross-site",
          },
        }),
      ),
    ).toBe(false);
    expect(
      csrfAllowed(
        new Request("https://admin.test/bff/api/admin/users", {
          method: "POST",
          headers: {
            Origin: "https://admin.test",
            "X-SX-CSRF": "1",
            "Sec-Fetch-Site": "same-origin",
          },
        }),
      ),
    ).toBe(true);
  });
});
