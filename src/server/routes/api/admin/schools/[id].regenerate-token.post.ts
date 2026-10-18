import { defineEventHandler, getRouterParam } from "h3";
import { assertUuid } from "../../../../utils/validate";
import { callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "schoolId");

  return callBackend(event, `/admin/schools/${id}/regenerate-token`, {
    method: "POST",
  });
});
