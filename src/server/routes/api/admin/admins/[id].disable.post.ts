import { defineEventHandler, getRouterParam } from "h3";
import { assertUuid } from "../../../../utils/validate";
import { callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "adminId");
  return callBackend(event, `/admin/admins/${id}/disable`, {
    method: "POST",
  });
});
