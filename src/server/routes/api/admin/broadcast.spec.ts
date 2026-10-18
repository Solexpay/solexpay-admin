import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { createEvent, H3Event } from "h3";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import broadcastHandler from "./broadcast.post";

function makeMockEvent(
  options: {
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): { event: H3Event } {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.method = "POST";
  req.url = "/api/admin/broadcast";
  req.headers = Object.fromEntries(
    Object.entries(options.headers || {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  if (options.body !== undefined) {
    (event as unknown as { _requestBody?: unknown })._requestBody =
      options.body;
  }
  return { event };
}

describe("POST /api/admin/broadcast validation limits", () => {
  let fetchSpy: MockInstance;

  beforeEach(() => {
    process.env["API_URL"] = "http://backend.internal";
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects title longer than 120 characters with 400", async () => {
    const longTitle = "A".repeat(121);
    const { event } = makeMockEvent({
      headers: { "x-idempotency-key": "idemp-123" },
      body: {
        title: longTitle,
        message: "Valid message content",
      },
    });

    await expect(broadcastHandler(event)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects message longer than 1000 characters with 400", async () => {
    const longMessage = "M".repeat(1001);
    const { event } = makeMockEvent({
      headers: { "x-idempotency-key": "idemp-123" },
      body: {
        title: "Valid Title",
        message: longMessage,
      },
    });

    await expect(broadcastHandler(event)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts title of 120 chars and message of 1000 chars", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: { eventId: "ev-001", message: "Broadcast queued." },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const maxTitle = "T".repeat(120);
    const maxMessage = "M".repeat(1000);
    const { event } = makeMockEvent({
      headers: { "x-idempotency-key": "idemp-max" },
      body: {
        title: maxTitle,
        message: maxMessage,
        targetAudience: "ALL",
      },
    });

    const res = await broadcastHandler(event);
    expect(res).toEqual({ eventId: "ev-001", message: "Broadcast queued." });
    expect(fetchSpy).toHaveBeenCalled();
  });
});
