import { type HttpHandler, HttpResponse, http } from "msw";

export const b1Handlers: HttpHandler[] = [
  http.get("*/admin/users/:userId/activity", ({ params }) => {
    if (params.userId !== "usr-001")
      return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      windowDays: 90,
      transferProfile: {
        count: 12,
        total: 38500000,
        average: 3208333,
        median: 2500000,
        largest: 12000000,
      },
      loginEvents: [
        {
          occurredAt: "2026-06-06T12:00:00Z",
          outcome: "LOGIN_SUCCEEDED",
          deviceId: "device-01",
          sourceIp: "102.89.23.4",
          userAgent: "SolexPay Android",
        },
        {
          occurredAt: "2026-06-05T08:30:00Z",
          outcome: "LOGIN_FAILED",
          deviceId: null,
          sourceIp: "102.89.23.4",
          userAgent: "Chrome",
        },
      ],
    });
  }),
];
