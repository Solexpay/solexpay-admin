import { describe, it, expect } from "vitest";
import type { H3Event } from "h3";
import { unwrapGoEnvelope, forwardHeaders, buildQueryString } from "./envelope";

describe("envelope helper", () => {
  describe("unwrapGoEnvelope", () => {
    it("unwraps 200 success envelope returning data", async () => {
      const mockPayload = { id: "123", name: "Test User" };
      const res = new Response(
        JSON.stringify({
          success: true,
          message: "Success",
          data: mockPayload,
          timestamp: "2026-10-18T12:00:00Z",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

      const result = await unwrapGoEnvelope(res);
      expect(result).toEqual(mockPayload);
    });

    it("unwraps 201 Created envelope returning data", async () => {
      const mockCreated = { id: "admin-1", role: "OPS" };
      const res = new Response(
        JSON.stringify({
          success: true,
          message: "Created",
          data: mockCreated,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );

      const result = await unwrapGoEnvelope(res);
      expect(result).toEqual(mockCreated);
    });

    it("handles 204 No Content gracefully", async () => {
      const res = new Response(null, { status: 204 });
      const result = await unwrapGoEnvelope(res);
      expect(result).toBeUndefined();
    });

    it("maps 400 validation error to an h3 error with same status code and message", async () => {
      const errorBody = {
        success: false,
        errorCode: "VALIDATION_ERROR",
        message: "The request payload failed validation.",
        details: [{ field: "amount", message: "failed validation rule: gt" }],
      };
      const res = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

      await expect(unwrapGoEnvelope(res)).rejects.toMatchObject({
        statusCode: 400,
        message: "The request payload failed validation.",
        data: errorBody,
      });
    });

    it("maps 401 unauthorized to h3 error", async () => {
      const errorBody = {
        success: false,
        errorCode: "UNAUTHORIZED",
        message: "Invalid credentials.",
      };
      const res = new Response(JSON.stringify(errorBody), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });

      await expect(unwrapGoEnvelope(res)).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid credentials.",
      });
    });

    it("maps 403 forbidden cleanly", async () => {
      const errorBody = {
        success: false,
        errorCode: "FORBIDDEN",
        message: "Insufficient permissions.",
      };
      const res = new Response(JSON.stringify(errorBody), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });

      await expect(unwrapGoEnvelope(res)).rejects.toMatchObject({
        statusCode: 403,
        message: "Insufficient permissions.",
      });
    });

    it("maps 422 insufficient funds error correctly", async () => {
      const errorBody = {
        success: false,
        errorCode: "INSUFFICIENT_FUNDS",
        message: "Your balance is too low for this transfer.",
      };
      const res = new Response(JSON.stringify(errorBody), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });

      await expect(unwrapGoEnvelope(res)).rejects.toMatchObject({
        statusCode: 422,
        message: "Your balance is too low for this transfer.",
      });
    });

    it("handles non-JSON error response gracefully", async () => {
      const res = new Response("Gateway Timeout", {
        status: 504,
        statusText: "Gateway Timeout",
        headers: { "Content-Type": "text/plain" },
      });

      await expect(unwrapGoEnvelope(res)).rejects.toMatchObject({
        statusCode: 504,
        message: "Gateway Timeout",
      });
    });
  });

  describe("forwardHeaders", () => {
    it("forwards Authorization and X-Idempotency-Key headers", () => {
      const fakeEvent = {
        node: {
          req: {
            headers: {
              authorization: "Bearer test-jwt-token",
              "x-idempotency-key": "uuid-key-12345",
            },
          },
        },
      } as unknown as H3Event;

      const headers = forwardHeaders(fakeEvent);
      expect(headers["Authorization"]).toBe("Bearer test-jwt-token");
      expect(headers["X-Idempotency-Key"]).toBe("uuid-key-12345");
    });

    it("forwards X-Forwarded-For from client IP and User-Agent", () => {
      const fakeEvent = {
        context: {},
        node: {
          req: {
            headers: {
              "x-forwarded-for": "198.51.100.42, 10.0.0.1",
              "user-agent": "Mozilla/5.0 AdminPanel/1.0",
            },
            socket: {
              remoteAddress: "127.0.0.1",
            },
          },
        },
      } as unknown as H3Event;

      // Not behind our proxy: a browser-supplied X-Forwarded-For is ignored.
      const headers = forwardHeaders(fakeEvent);
      expect(headers["X-Forwarded-For"]).toBe("127.0.0.1");
      expect(headers["User-Agent"]).toBe("Mozilla/5.0 AdminPanel/1.0");

      // Behind our proxy: the entry it appended (the last) is the client.
      process.env["BFF_BEHIND_PROXY"] = "true";
      try {
        expect(forwardHeaders(fakeEvent)["X-Forwarded-For"]).toBe("10.0.0.1");
      } finally {
        delete process.env["BFF_BEHIND_PROXY"];
      }
    });

    it("falls back to socket remoteAddress for X-Forwarded-For when x-forwarded-for header is absent", () => {
      const fakeEvent = {
        context: {},
        node: {
          req: {
            headers: {
              "user-agent": "SolexPay-Client",
            },
            socket: {
              remoteAddress: "192.168.1.100",
            },
          },
        },
      } as unknown as H3Event;

      const headers = forwardHeaders(fakeEvent);
      expect(headers["X-Forwarded-For"]).toBe("192.168.1.100");
      expect(headers["User-Agent"]).toBe("SolexPay-Client");
    });
  });

  describe("buildQueryString", () => {
    it("builds query params from allowed keys, skipping empty values", () => {
      const qs = buildQueryString(
        {
          status: "UNKNOWN",
          userId: "123",
          cursor: "",
          limit: 20,
          ignored: "foo",
        },
        ["status", "userId", "cursor", "limit"],
      );

      expect(qs).toBe("?status=UNKNOWN&userId=123&limit=20");
    });

    it("returns empty string when no valid parameters", () => {
      const qs = buildQueryString({ cursor: "", status: undefined }, [
        "cursor",
        "status",
      ]);
      expect(qs).toBe("");
    });
  });
});
