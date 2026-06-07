import { defineEventHandler, readBody, createError } from "h3";
import { assertEmail, assertPassword } from "../../../utils/validate";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const email = assertEmail(body?.email);
  const password = assertPassword(body?.password);

  const res = await fetch(`${process.env["API_URL"]}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok)
    throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
