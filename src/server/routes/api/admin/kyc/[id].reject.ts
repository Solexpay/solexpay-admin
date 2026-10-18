import { defineEventHandler, getRouterParam, readBody } from "h3";
import { assertUuid, assertNonEmptyString } from "../../../../utils/validate";
import { callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "kycId");
  const body = await readBody(event);
  const reason = assertNonEmptyString(body?.reason, "reason", 500);

  return callBackend(event, `/admin/kyc/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
});
