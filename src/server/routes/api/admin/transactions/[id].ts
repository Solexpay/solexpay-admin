import { defineEventHandler, getRouterParam } from "h3";
import { assertUuid } from "../../../../utils/validate";
import { callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "transactionId");
  return callBackend(event, `/admin/transactions/${id}`);
});
