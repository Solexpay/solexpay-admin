import { defineEventHandler, createError } from "h3";
import { callBackend } from "../../../utils/envelope";
import {
  getAuthCookie,
  clearAuthCookie,
  handleAuthResponse,
} from "../../../utils/auth-cookie";

export default defineEventHandler(async (event) => {
  const refreshToken = getAuthCookie(event);

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "No refresh token available",
    });
  }

  try {
    const res = await callBackend<Record<string, unknown>>(
      event,
      "/auth/admin/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      },
    );

    return handleAuthResponse(event, res);
  } catch (err: unknown) {
    const httpErr = err as { statusCode?: number };
    if (httpErr?.statusCode === 401) {
      clearAuthCookie(event);
    }
    throw err;
  }
});
