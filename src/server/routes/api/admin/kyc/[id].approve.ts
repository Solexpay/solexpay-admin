import {
  defineEventHandler,
  getHeaders,
  getRouterParam,
  createError,
} from "h3";
import { assertUuid } from "../../../../utils/validate";

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const id = assertUuid(getRouterParam(event, "id"));

  const res = await fetch(`${process.env["API_URL"]}/admin/kyc/${id}/approve`, {
    method: "POST",
    headers: { Authorization: authorization },
  });

  if (!res.ok)
    throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
