import { defineEventHandler, getQuery } from "h3";
import { buildQueryString, callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const qs = buildQueryString(query, ["limit", "cursor"]);

  return callBackend(event, `/admin/loans/overdue${qs}`);
});
