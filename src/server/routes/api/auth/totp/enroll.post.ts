import { defineEventHandler, readBody } from "h3";
import { assertNonEmptyString } from "../../../../utils/validate";
import { callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const enrollmentToken = assertNonEmptyString(
    body?.enrollmentToken,
    "enrollmentToken",
    512,
  );

  return callBackend(event, "/auth/admin/totp/enroll", {
    method: "POST",
    body: JSON.stringify({ enrollmentToken }),
  });
});
