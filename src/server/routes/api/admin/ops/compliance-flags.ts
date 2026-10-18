import { defineEventHandler, getQuery } from "h3";
import { buildQueryString, callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const qs = buildQueryString(query, ["status", "limit", "cursor"]);

  return callBackend(event, `/admin/ops/compliance-flags${qs}`);
});
