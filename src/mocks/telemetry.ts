import type { HttpHandler } from "msw";
import { HttpResponse, http } from "msw";

export const telemetryHandlers: HttpHandler[] = [
  http.post("*/admin/client-events", async ({ request }) => {
    const body = (await request.json()) as { events?: unknown[] };
    return HttpResponse.json(
      { accepted: Array.isArray(body.events) ? body.events.length : 0 },
      { status: 202 },
    );
  }),
];
