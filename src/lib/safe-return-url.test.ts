import { describe, expect, it } from "vitest";
import { safeReturnUrl } from "./safe-return-url";

describe("safeReturnUrl", () => {
  it("keeps same-origin paths with query and hash", () => {
    expect(safeReturnUrl("/users?status=ACTIVE#top")).toBe(
      "/users?status=ACTIVE#top",
    );
  });
  it.each([
    null,
    "",
    "users",
    "//evil.com",
    "/\\evil.com",
    "/\\/evil.com",
    "https://evil.com/x",
    "javascript:alert(1)",
    "/login?returnUrl=/users",
  ])("falls back to the dashboard for %s", (target) => {
    expect(safeReturnUrl(target)).toBe("/dashboard");
  });
});
