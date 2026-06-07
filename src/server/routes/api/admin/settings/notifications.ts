import { defineEventHandler, getHeaders, createError } from "h3";

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const res = await fetch(
    `${process.env["API_URL"]}/admin/settings/notifications`,
    {
      headers: { Authorization: authorization },
    },
  );

  if (!res.ok)
    throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
