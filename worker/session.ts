import type { AdminProfile, Env } from "./env";

const COOKIE_NAME = "__Host-sx_admin";
const SESSION_AGE = 12 * 60 * 60;
const AAD = new TextEncoder().encode("sx-admin-session-v1");

/** Encrypted server-side auth state carried only in an HttpOnly cookie. */
export interface SessionPayload {
  v: 1;
  at: string;
  atExp: number;
  rt: string;
  admin: AdminProfile;
  iat: number;
  sid: string;
}

function decodeKey(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const raw = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    raw[index] = binary.charCodeAt(index);
  if (raw.byteLength !== 32)
    throw new Error("SESSION_KEY must decode to 32 bytes");
  return raw;
}

async function cryptoKey(env: Env, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    decodeKey(env.SESSION_KEY),
    "AES-GCM",
    false,
    usage,
  );
}

/** Validates and imports the configured session key. */
export async function validateSessionKey(env: Env): Promise<void> {
  await cryptoKey(env, ["encrypt", "decrypt"]);
}

function b64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(value: string): Uint8Array {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

/** Encrypts the session payload into the host-only cookie value. */
export async function sealSession(
  env: Env,
  payload: SessionPayload,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await cryptoKey(env, ["encrypt"]);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: AAD },
      key,
      plaintext,
    ),
  );
  const packed = new Uint8Array(iv.length + ciphertext.length);
  packed.set(iv);
  packed.set(ciphertext, iv.length);
  const value = b64url(packed);
  if (value.length > 3800) throw new Error("Session cookie exceeds size limit");
  return `${COOKIE_NAME}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${SESSION_AGE}`;
}

/** Opens and validates the encrypted session cookie, returning null on invalid input. */
export async function openSession(
  env: Env,
  cookieHeader: string | null,
): Promise<SessionPayload | null> {
  const key = await cryptoKey(env, ["decrypt"]);
  const value = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!value || value.length > 3800) return null;
  try {
    const packed = fromB64url(value);
    if (packed.length < 29) return null;
    const iv = packed.slice(0, 12);
    const ciphertext = packed.slice(12);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: AAD },
      key,
      ciphertext,
    );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    if (typeof parsed !== "object" || parsed === null) return null;
    const valueObject = parsed as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (
      valueObject.v !== 1 ||
      typeof valueObject.at !== "string" ||
      typeof valueObject.rt !== "string" ||
      typeof valueObject.sid !== "string" ||
      typeof valueObject.atExp !== "number" ||
      typeof valueObject.iat !== "number" ||
      typeof valueObject.admin !== "object" ||
      valueObject.admin === null ||
      valueObject.iat < now - SESSION_AGE
    )
      return null;
    return valueObject as SessionPayload;
  } catch {
    return null;
  }
}

/** Returns a cookie header that immediately expires the admin session. */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;
}

/** Returns the encrypted session cookie name for internal cookie extraction. */
export function sessionCookieName(): string {
  return COOKIE_NAME;
}
