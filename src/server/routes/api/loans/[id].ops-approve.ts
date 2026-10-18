import { defineEventHandler, getRouterParam, readBody } from "h3";
import { assertUuid } from "../../../utils/validate";
import { callBackend } from "../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "loanId");
  const body = await readBody(event).catch(() => ({}));

  const reviewedBy = body?.reviewedBy ? String(body.reviewedBy) : "OPS";
  const coolingOffHours =
    typeof body?.coolingOffHours === "number" ? body.coolingOffHours : 24;

  return callBackend(event, `/loans/${id}/ops-approve`, {
    method: "POST",
    body: JSON.stringify({ reviewedBy, coolingOffHours }),
  });
});
