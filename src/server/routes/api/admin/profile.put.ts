import { defineEventHandler, readBody } from "h3";
import { callBackend } from "../../../utils/envelope";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return callBackend(event, "/admin/profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });
});
