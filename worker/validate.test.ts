import { describe, expect, it } from "vitest";
import {
  confirmSchema,
  loginSchema,
  sanitize,
  sanitizeQuery,
  validApiPath,
} from "./validate";

describe("request validation", () => {
  it("removes bidi, zero-width, and control characters", () => {
    expect(sanitize(" a\u0001b\u200Bc\u202Ed ")).toBe("abcd");
  });
  it("rejects dangerous keys and structural overflows", () => {
    expect(() =>
      sanitize(JSON.parse('{"__proto__":{"polluted":true}}') as unknown),
    ).toThrow();
    let deep: unknown = "x";
    for (let index = 0; index < 9; index += 1) deep = [deep];
    expect(() => sanitize(deep)).toThrow();
    expect(() => sanitize(new Array(1001).fill(0))).toThrow();
    expect(() => sanitize("x".repeat(10001))).toThrow();
  });
  it("rejects invalid query keys and path traversal", () => {
    expect(() => sanitizeQuery("bad-key=x")).toThrow();
    expect(validApiPath("/admin/users/../profile")).toBe(false);
    expect(validApiPath("/admin/users/list")).toBe(true);
  });
  it("normalizes login email and rejects non-six-digit codes", () => {
    expect(
      loginSchema.parse({ email: "ADMIN@EXAMPLE.COM", password: "pw" }).email,
    ).toBe("admin@example.com");
    expect(
      confirmSchema.safeParse({
        enrollmentToken: "abcdefghijklmnop",
        code: "1234567",
      }).success,
    ).toBe(false);
  });
  it("passes password fields through verbatim but still caps them", () => {
    const out = sanitize({
      password: "  pä\u200Bss  ",
      note: "  hi\u200B ",
    }) as Record<string, string>;
    expect(out.password).toBe("  pä\u200Bss  ");
    expect(out.note).toBe("hi");
    expect(() => sanitize({ password: "x".repeat(257) })).toThrow();
  });
});
