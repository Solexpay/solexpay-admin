import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Env } from "./env";

const jwksByDomain = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
let accessDisabledLogged = false;

/** Validates Cloudflare Access and returns its verified email claim. */
export async function verifyAccess(
  request: Request,
  env: Env,
  warn: (message: string) => void,
): Promise<{ allowed: boolean; email?: string; unavailable?: boolean }> {
  if (!env.ACCESS_AUD) {
    if (env.ENVIRONMENT === "production")
      return { allowed: false, unavailable: true };
    if (!accessDisabledLogged) {
      accessDisabledLogged = true;
      warn("access_disabled");
    }
    return { allowed: true };
  }
  if (!env.ACCESS_TEAM_DOMAIN) return { allowed: false };
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!assertion) return { allowed: false };
  try {
    let jwks = jwksByDomain.get(env.ACCESS_TEAM_DOMAIN);
    if (!jwks) {
      jwks = createRemoteJWKSet(
        new URL(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`),
      );
      jwksByDomain.set(env.ACCESS_TEAM_DOMAIN, jwks);
    }
    const { payload } = await jwtVerify(assertion, jwks, {
      audience: env.ACCESS_AUD,
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
      algorithms: ["RS256"],
      clockTolerance: 30,
    });
    return {
      allowed: true,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return { allowed: false };
  }
}
