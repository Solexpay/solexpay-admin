import {
  defineEventHandler,
  getHeaders,
  getRouterParam,
  readBody,
  createError,
} from "h3";
import { assertUuid, assertNonEmptyString } from "../../../utils/validate";

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const id = assertUuid(getRouterParam(event, "id"));
  const body = await readBody(event);

  const safeNote = body?.note
    ? assertNonEmptyString(body.note, "note", 512)
    : undefined;

  const res = await fetch(`${process.env["API_URL"]}/loans/${id}/ops-approve`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reviewedBy: "OPS",
      ...(safeNote ? { note: safeNote } : {}),
    }),
  });

  if (!res.ok)
    throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
