import { createError, defineEventHandler, readBody } from "h3";
import { assertEmail, assertPassword } from "../../../utils/validate";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body?.token;
  const email = assertEmail(body?.email);
  const password = assertPassword(body?.newPassword);

  if (!token || typeof token !== "string" || token.trim().length === 0)
    throw createError({ statusCode: 400, message: "Reset token is required" });

  const res = await fetch(`${process.env["API_URL"]}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, email, newPassword: password }),
  });

  if (!res.ok)
    throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
