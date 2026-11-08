import { describe, expect, it } from "vitest";
import type { Env } from "./env";
import {
  clearSessionCookie,
  openSession,
  type SessionPayload,
  sealSession,
} from "./session";

const key = btoa(String.fromCharCode(...new Uint8Array(32)));
const env = { SESSION_KEY: key } as Env;
const profile = {
  id: "a1",
  email: "a@example.com",
  firstName: "A",
  lastName: "Admin",
  role: "SUPER_ADMIN",
};
const payload: SessionPayload = {
  v: 1,
  at: "access",
  atExp: 2000000000,
  rt: "refresh",
  admin: profile,
  iat: Math.floor(Date.now() / 1000),
  sid: "sid",
};

describe("session cookie crypto", () => {
  it("round trips a sealed session", async () => {
    const cookie = await sealSession(env, payload);
    expect(await openSession(env, cookie)).toEqual(payload);
    expect(cookie).toContain("HttpOnly; SameSite=Strict; Max-Age=43200");
  });
  it("rejects tampering, wrong keys, expiry, and oversized cookies", async () => {
    const cookie = await sealSession(env, payload);
    const value = cookie.split("=")[1].split(";")[0];
    expect(
      await openSession(env, `__Host-sx_admin=${value.slice(0, -1)}x`),
    ).toBeNull();
    const other = {
      SESSION_KEY: btoa(String.fromCharCode(...new Uint8Array(32).fill(1))),
    } as Env;
    expect(await openSession(other, cookie)).toBeNull();
    const expired = await sealSession(env, { ...payload, iat: 1 });
    expect(await openSession(env, expired)).toBeNull();
    expect(
      await openSession(env, `__Host-sx_admin=${"a".repeat(3801)}`),
    ).toBeNull();
    expect(clearSessionCookie()).toContain("Max-Age=0");
  });
});
