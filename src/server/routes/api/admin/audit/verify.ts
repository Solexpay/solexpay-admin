import { defineEventHandler, getQuery } from "h3";
import { buildQueryString, callBackend } from "../../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const qs = buildQueryString(query, ["fromSeq", "toSeq"]);

  return callBackend(event, `/admin/audit/verify${qs}`);
});
