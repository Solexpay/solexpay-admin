import { defineEventHandler, getRouterParam, getQuery, readBody } from "h3";
import { assertUuid } from "../../../../utils/validate";
import { callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "userId");
  const body = await readBody(event).catch(() => ({}));
  const query = getQuery(event);

  const reason =
    body?.reason || query["reason"] || "Suspended by administrator";

  return callBackend(event, `/admin/users/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason: String(reason).trim() }),
  });
});
