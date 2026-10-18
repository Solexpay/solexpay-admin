import { defineEventHandler } from "h3";
import { callBackend } from "../../../utils/envelope";

export default defineEventHandler(async (event) => {
  return callBackend(event, "/admin/profile");
});
