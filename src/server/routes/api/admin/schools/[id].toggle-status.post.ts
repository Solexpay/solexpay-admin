import { defineEventHandler, getRouterParam, readBody } from "h3";
import { assertUuid, assertNonEmptyString } from "../../../../utils/validate";
import { callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "schoolId");
  const body = await readBody(event);
  const status = assertNonEmptyString(body?.status, "status", 32);

  return callBackend(event, `/admin/schools/${id}/toggle-status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
});
