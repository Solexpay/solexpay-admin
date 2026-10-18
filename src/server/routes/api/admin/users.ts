import { defineEventHandler, getQuery } from "h3";
import { buildQueryString, callBackend } from "../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const qs = buildQueryString(query, [
    "search",
    "phoneNumber",
    "status",
    "kycTier",
    "limit",
    "cursor",
  ]);

  return callBackend(event, `/admin/users${qs}`);
});
