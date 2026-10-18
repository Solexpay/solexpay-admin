import { defineEventHandler, readBody } from "h3";
import { assertNonEmptyString } from "../../../../utils/validate";
import { callBackend } from "../../../../utils/envelope";
import { handleAuthResponse } from "../../../../utils/auth-cookie";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const enrollmentToken = assertNonEmptyString(
    body?.enrollmentToken,
    "enrollmentToken",
    512,
  );
  const code = assertNonEmptyString(body?.code, "code", 16);

  const res = await callBackend<Record<string, unknown>>(
    event,
    "/auth/admin/totp/confirm",
    {
      method: "POST",
      body: JSON.stringify({ enrollmentToken, code }),
    },
  );

  return handleAuthResponse(event, res);
});
