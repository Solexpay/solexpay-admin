import { defineEventHandler, getHeaders, getQuery, createError } from "h3";

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const q = getQuery(event);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q))
    if (v != null) params.set(k, String(v));

  const res = await fetch(
    `${process.env["API_URL"]}/admin/kyc?${params.toString()}`,
    {
      headers: { Authorization: authorization },
    },
  );
  if (!res.ok)
    throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
