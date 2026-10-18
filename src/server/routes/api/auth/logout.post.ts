import { defineEventHandler, setResponseStatus } from "h3";
import { callBackend } from "../../../utils/envelope";
import { getAuthCookie, clearAuthCookie } from "../../../utils/auth-cookie";

export default defineEventHandler(async (event) => {
  const refreshToken = getAuthCookie(event);

  if (refreshToken) {
    try {
      await callBackend(event, "/auth/admin/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore backend logout errors to ensure client cookie is always cleared
    }
  }

  clearAuthCookie(event);
  setResponseStatus(event, 204);
  return null;
});
