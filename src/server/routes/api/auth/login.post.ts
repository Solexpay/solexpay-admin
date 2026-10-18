import { defineEventHandler, readBody } from "h3";
import { assertEmail, assertPassword } from "../../../utils/validate";
import { callBackend } from "../../../utils/envelope";
import { handleAuthResponse } from "../../../utils/auth-cookie";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const email = assertEmail(body?.email);
  const password = assertPassword(body?.password);
  const totpCode = body?.totpCode ? String(body.totpCode).trim() : undefined;

  const res = await callBackend<Record<string, unknown>>(
    event,
    "/auth/admin/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        ...(totpCode ? { totpCode } : {}),
      }),
    },
  );

  return handleAuthResponse(event, res);
});
