import { defineEventHandler, readBody, getHeader, createError } from "h3";
import { assertNonEmptyString } from "../../../utils/validate";
import { callBackend } from "../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const idempotencyKey =
    getHeader(event, "x-idempotency-key") ||
    getHeader(event, "X-Idempotency-Key");

  if (!idempotencyKey) {
    throw createError({
      statusCode: 400,
      message: "X-Idempotency-Key header is required for broadcast.",
    });
  }

  const body = await readBody(event);
  const title = assertNonEmptyString(body?.title, "title", 120);
  const message = assertNonEmptyString(body?.message, "message", 1000);
  const targetAudience = body?.targetAudience || "ALL";

  return callBackend(event, "/admin/broadcast", {
    method: "POST",
    body: JSON.stringify({ title, message, targetAudience }),
  });
});
