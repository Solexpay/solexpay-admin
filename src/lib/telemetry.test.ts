import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../mocks/server";

const tokenState = vi.hoisted(() => ({ token: "test-token" as string | null }));
vi.mock("./auth/session", () => ({
  getAccessToken: () => tokenState.token,
}));

import {
  __setTelemetryEnabledForTests,
  trackAction,
  trackError,
  trackPageView,
} from "./telemetry";

const endpoint = "*/admin/client-events";

describe("admin client telemetry", () => {
  beforeEach(() => {
    tokenState.token = "test-token";
    __setTelemetryEnabledForTests(true);
  });

  afterEach(() => {
    __setTelemetryEnabledForTests(false);
    vi.useRealTimers();
  });

  it("batches when the queue reaches 20 and strips query strings", async () => {
    const received: Array<Record<string, unknown>> = [];
    server.use(
      http.post(endpoint, async ({ request }) => {
        const body = (await request.json()) as {
          events: Array<Record<string, unknown>>;
        };
        received.push(...body.events);
        return HttpResponse.json(
          { accepted: body.events.length },
          { status: 202 },
        );
      }),
    );
    for (let index = 0; index < 20; index += 1)
      trackPageView("/users?phone=08012345678&token=secret");
    await vi.waitFor(() => expect(received).toHaveLength(20));
    expect(received[0]?.path).toBe("/users");
  });

  it("flushes queued events on the 10 second interval", async () => {
    // Fake only the interval; MSW's fetch pipeline needs real timers.
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    let accepted = 0;
    server.use(
      http.post(endpoint, async ({ request }) => {
        const body = (await request.json()) as { events: unknown[] };
        accepted += body.events.length;
        return HttpResponse.json(
          { accepted: body.events.length },
          { status: 202 },
        );
      }),
    );
    trackAction("open-panel");
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(10_000);
    vi.useRealTimers();
    await vi.waitFor(() => expect(accepted).toBe(1));
  });

  it("truncates event fields and keeps at most 20 detail keys", async () => {
    let received: Record<string, unknown> | undefined;
    server.use(
      http.post(endpoint, async ({ request }) => {
        const body = (await request.json()) as {
          events: Array<Record<string, unknown>>;
        };
        received = body.events[0];
        return HttpResponse.json({ accepted: 1 }, { status: 202 });
      }),
    );
    trackAction(
      "n".repeat(80),
      Object.fromEntries(
        Array.from({ length: 25 }, (_, index) => [
          `key${index}`,
          "v".repeat(250),
        ]),
      ),
    );
    for (let index = 0; index < 19; index += 1) trackAction("flush");
    await vi.waitFor(() => expect(received).toBeDefined());
    expect(received?.name).toHaveLength(64);
    const detail = received?.detail as Record<string, string>;
    expect(Object.keys(detail)).toHaveLength(20);
    expect(detail.key0).toHaveLength(200);
  });

  it("deduplicates identical errors within five seconds", async () => {
    const batches: unknown[][] = [];
    server.use(
      http.post(endpoint, async ({ request }) => {
        const body = (await request.json()) as { events: unknown[] };
        batches.push(body.events);
        return HttpResponse.json(
          { accepted: body.events.length },
          { status: 202 },
        );
      }),
    );
    const error = new Error("same error");
    trackError(error);
    trackError(new Error("same error"));
    for (let index = 0; index < 19; index += 1) trackAction("flush");
    await vi.waitFor(() => expect(batches.length).toBeGreaterThan(0));
    expect(batches[0]).toHaveLength(20);
  });

  it("chunks requests at 50 events or fewer", async () => {
    const sizes: number[] = [];
    server.use(
      http.post(endpoint, async ({ request }) => {
        const body = (await request.json()) as { events: unknown[] };
        sizes.push(body.events.length);
        return HttpResponse.json(
          { accepted: body.events.length },
          { status: 202 },
        );
      }),
    );
    for (let index = 0; index < 120; index += 1) trackAction("event");
    await vi.waitFor(() =>
      expect(sizes.reduce((sum, size) => sum + size, 0)).toBe(120),
    );
    expect(sizes.every((size) => size <= 50)).toBe(true);
  });

  it("does not send without a token and retains the queued event", async () => {
    vi.useFakeTimers();
    let calls = 0;
    server.use(
      http.post(endpoint, () => {
        calls += 1;
        return HttpResponse.json({ accepted: 1 }, { status: 202 });
      }),
    );
    tokenState.token = null;
    trackAction("waiting-for-token");
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toBe(0);
    tokenState.token = "test-token";
    for (let index = 0; index < 19; index += 1) trackAction("flush");
    await vi.waitFor(() => expect(calls).toBeGreaterThan(0));
  });
});
