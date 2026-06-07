import { defineEventHandler, getHeaders, readBody, createError } from "h3";

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const body = await readBody(event);

  const res = await fetch(`${process.env["API_URL"]}/admin/schools`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok)
    throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
