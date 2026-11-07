import { defineEventHandler, getHeader, getQuery, createError } from "h3";

export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, "authorization");
  if (!authorization)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const rawDays = getQuery(event)["days"] ?? "30";
  const days = Number(rawDays);
  if (days !== 7 && days !== 30 && days !== 90)
    throw createError({ statusCode: 400, message: "Invalid analytics window" });

  const apiUrl = process.env["API_URL"];
  if (!apiUrl)
    throw createError({
      statusCode: 503,
      message: "Analytics API is unavailable",
    });

  const response = await fetch(`${apiUrl}/admin/analytics/usage?days=${days}`, {
    headers: { Authorization: authorization },
  });
  if (!response.ok)
    throw createError({
      statusCode: response.status,
      message: "Unable to load product usage analytics",
    });
  return response.json();
});
