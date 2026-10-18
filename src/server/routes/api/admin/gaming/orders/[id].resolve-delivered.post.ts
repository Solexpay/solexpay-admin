import { defineEventHandler, getRouterParam, readBody } from "h3";
import {
  assertUuid,
  assertNonEmptyString,
} from "../../../../../utils/validate";
import { callBackend } from "../../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "orderId");
  const body = await readBody(event);
  const note = assertNonEmptyString(body?.note, "note", 1024);
  const codes = Array.isArray(body?.codes) ? body.codes : undefined;

  return callBackend(event, `/admin/gaming/orders/${id}/resolve-delivered`, {
    method: "POST",
    body: JSON.stringify({
      note,
      ...(codes ? { codes } : {}),
    }),
  });
});
