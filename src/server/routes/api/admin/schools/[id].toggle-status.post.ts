import {
  defineEventHandler,
  getHeaders,
  getRouterParam,
  readBody,
  createError,
} from "h3";
import { assertUuid } from "../../../../utils/validate";

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const id = assertUuid(getRouterParam(event, "id"));
  const body = await readBody(event);

  const res = await fetch(
    `${process.env["API_URL"]}/admin/schools/${id}/toggle-status`,
    {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok)
    throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
