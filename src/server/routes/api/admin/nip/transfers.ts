import { defineEventHandler, getQuery } from "h3";
import { buildQueryString, callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const qs = buildQueryString(query, ["status", "userId", "limit", "cursor"]);

  return callBackend(event, `/admin/nip/transfers${qs}`);
});
