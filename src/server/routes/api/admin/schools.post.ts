import { defineEventHandler, readBody } from "h3";
import { assertEmail, assertNonEmptyString } from "../../../utils/validate";
import { callBackend } from "../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const name = assertNonEmptyString(body?.name, "name", 255);
  const email = assertEmail(body?.email);

  return callBackend(event, "/admin/schools", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      phone: body?.phone || undefined,
      address: body?.address || undefined,
      state: body?.state || undefined,
    }),
  });
});
