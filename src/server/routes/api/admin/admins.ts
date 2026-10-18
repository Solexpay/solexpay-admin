import { defineEventHandler, getQuery, readBody } from "h3";
import { assertEmail, assertNonEmptyString } from "../../../utils/validate";
import { buildQueryString, callBackend } from "../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "POST") {
    const body = await readBody(event);
    const email = assertEmail(body?.email);
    const firstName = assertNonEmptyString(body?.firstName, "firstName", 128);
    const lastName = assertNonEmptyString(body?.lastName, "lastName", 128);
    const role = assertNonEmptyString(body?.role, "role", 32);
    const phone = body?.phone ? String(body.phone).trim() : undefined;

    return callBackend(event, "/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email, firstName, lastName, role, phone }),
    });
  }

  // GET list
  const query = getQuery(event);
  const qs = buildQueryString(query, ["role", "status", "limit", "cursor"]);

  return callBackend(event, `/admin/admins${qs}`);
});
