import { defineEventHandler, getRouterParam, readBody } from "h3";
import {
  assertUuid,
  assertNonEmptyString,
} from "../../../../../utils/validate";
import { callBackend } from "../../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const id = assertUuid(getRouterParam(event, "id"), "flagId");
  const body = await readBody(event);
  const note = assertNonEmptyString(body?.note, "note", 1024);

  return callBackend(event, `/admin/ops/compliance-flags/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
});
