import { defineEventHandler, getRouterParam, readBody } from "h3";
import { assertUuid, assertNonEmptyString } from "../../../utils/validate";
import { callBackend } from "../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "loanId");
  const body = await readBody(event);

  const rejectionReason = assertNonEmptyString(
    body?.rejectionReason || body?.reason,
    "rejectionReason",
    512,
  );
  const reviewedBy = body?.reviewedBy ? String(body.reviewedBy) : "OPS";

  return callBackend(event, `/loans/${id}/ops-reject`, {
    method: "POST",
    body: JSON.stringify({ reviewedBy, rejectionReason }),
  });
});
