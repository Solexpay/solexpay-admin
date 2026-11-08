import { type HttpHandler, HttpResponse, http } from "msw";
import type {
  CardMovement,
  CursorPage,
  Promo,
  SupportTicket,
  SupportTicketDetail,
  UsageAnalytics,
} from "@/lib/types";

const cursorPage = <T>(
  items: T[],
  nextCursor: string | null = null,
  hasMore = false,
): CursorPage<T> => ({
  items,
  nextCursor,
  hasMore,
});

// In-memory data generators & stores
const supportTickets: SupportTicketDetail[] = [
  {
    id: "tick-001",
    reference: "TCK-2026-001",
    category: "PAYMENT",
    subject: "Debit without wallet credit",
    status: "OPEN",
    relatedReference: "TRX-882910",
    lastMessageAt: "2026-06-08T14:20:00Z",
    createdAt: "2026-06-08T12:00:00Z",
    userId: "usr-001",
    contactPhone: "+2348012345678",
    messages: [
      {
        id: "msg-001",
        author: "user",
        body: "I funded my wallet with ₦25,000 via GTBank transfer 2 hours ago but my balance has not updated.",
        createdAt: "2026-06-08T12:00:00Z",
      },
    ],
  },
  {
    id: "tick-002",
    reference: "TCK-2026-002",
    category: "CARD",
    subject: "Virtual card declined on Netflix",
    status: "IN_PROGRESS",
    relatedReference: "CRD-9912",
    lastMessageAt: "2026-06-08T11:45:00Z",
    createdAt: "2026-06-07T16:30:00Z",
    userId: "usr-002",
    contactPhone: "+2348098765432",
    messages: [
      {
        id: "msg-002",
        author: "user",
        body: "My virtual USD card was declined for Netflix renewal despite having $20 balance.",
        createdAt: "2026-06-07T16:30:00Z",
      },
      {
        id: "msg-003",
        author: "admin",
        body: "Hello Amaka, we are looking into the 3DS verification logs with our card issuer.",
        createdAt: "2026-06-08T11:45:00Z",
      },
    ],
  },
  {
    id: "tick-003",
    reference: "TCK-2026-003",
    category: "LOAN",
    subject: "Tuition disbursement status",
    status: "RESOLVED",
    relatedReference: "LOAN-001",
    lastMessageAt: "2026-06-06T09:15:00Z",
    createdAt: "2026-06-05T08:00:00Z",
    userId: "usr-003",
    contactPhone: "+2347033445566",
    messages: [
      {
        id: "msg-004",
        author: "user",
        body: "When will the school fees loan be sent to UNILAG bursary?",
        createdAt: "2026-06-05T08:00:00Z",
      },
      {
        id: "msg-005",
        author: "admin",
        body: "Your loan was disbursed directly to University of Lagos portal this morning.",
        createdAt: "2026-06-06T09:15:00Z",
      },
    ],
  },
  {
    id: "tick-004",
    reference: "TCK-2026-004",
    category: "KYC",
    subject: "NIN verification pending over 48 hours",
    status: "CLOSED",
    relatedReference: "KYC-0091",
    lastMessageAt: "2026-06-04T17:00:00Z",
    createdAt: "2026-06-03T10:15:00Z",
    userId: "usr-004",
    contactPhone: "+2348144556677",
    messages: [
      {
        id: "msg-006",
        author: "user",
        body: "Submitted my slip two days ago, still showing unverified.",
        createdAt: "2026-06-03T10:15:00Z",
      },
      {
        id: "msg-007",
        author: "admin",
        body: "We verified your NIN document manually. Your tier 2 access is active.",
        createdAt: "2026-06-04T17:00:00Z",
      },
    ],
  },
];

const cardMovements: CardMovement[] = [
  {
    id: "mov-001",
    reference: "MOV-20260608-01",
    userId: "usr-001",
    userName: "Chidi Okafor",
    cardId: "crd-101",
    last4: "4821",
    direction: "FUND",
    status: "UNKNOWN",
    amountUsd: 5000, // $50.00
    amount: 7500000, // ₦75,000.00
    createdAt: "2026-06-08T13:00:00Z",
  },
  {
    id: "mov-002",
    reference: "MOV-20260608-02",
    userId: "usr-002",
    userName: "Amaka Eze",
    cardId: "crd-102",
    last4: "1904",
    direction: "WITHDRAW",
    status: "PENDING",
    amountUsd: 2500, // $25.00
    amount: 3700000, // ₦37,000.00
    createdAt: "2026-06-08T12:30:00Z",
  },
  {
    id: "mov-003",
    reference: "MOV-20260607-01",
    userId: "usr-003",
    userName: "Babatunde Adeyemi",
    cardId: "crd-103",
    last4: "8392",
    direction: "FUND",
    status: "COMPLETED",
    amountUsd: 10000, // $100.00
    amount: 15000000, // ₦150,000.00
    resolutionNote: "Confirmed credited by card provider settlement log",
    resolvedBy: "ops@solexpay.com",
    createdAt: "2026-06-07T09:00:00Z",
    completedAt: "2026-06-07T09:15:00Z",
  },
  {
    id: "mov-004",
    reference: "MOV-20260606-01",
    userId: "usr-004",
    userName: "Fatima Bello",
    cardId: "crd-104",
    last4: "6612",
    direction: "WITHDRAW",
    status: "FAILED",
    amountUsd: 1500, // $15.00
    amount: 2250000, // ₦22,500.00
    resolutionNote: "Declined by issuing bank: insufficient ledger float",
    resolvedBy: "ops@solexpay.com",
    createdAt: "2026-06-06T15:20:00Z",
    completedAt: "2026-06-06T15:35:00Z",
  },
];

let promosList: Promo[] = [
  {
    id: "prm-001",
    slug: "student-loan-zero-fee",
    title: "0% Fee Tuition Financing",
    body: "Pay zero processing fees on school fee loans applied before semester resumption.",
    artKey: "student_loan",
    ctaLabel: "Apply Now",
    ctaRoute: "/loans/apply",
    endsAt: "2026-09-30T23:59:59Z",
    priority: 10,
    active: true,
    startsAt: "2026-06-01T00:00:00Z",
    createdBy: "admin-001",
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "prm-002",
    slug: "virtual-card-launch",
    title: "Free Virtual USD Card",
    body: "Create your first virtual dollar card with zero issuance fee.",
    artKey: "virtual_card_launch",
    ctaLabel: "Create Card",
    ctaRoute: "/cards/new",
    endsAt: null,
    priority: 5,
    active: true,
    startsAt: "2026-05-15T00:00:00Z",
    createdBy: "admin-001",
    createdAt: "2026-05-15T00:00:00Z",
    updatedAt: "2026-05-15T00:00:00Z",
  },
  {
    id: "prm-003",
    slug: "airtime-cashback-expired",
    title: "3% Airtime Cashback",
    body: "Get 3% instant cashback on all MTN and Airtel recharge.",
    artKey: "airtime_3_percent",
    ctaLabel: "Buy Airtime",
    ctaRoute: "/bills/airtime",
    endsAt: "2026-05-01T23:59:59Z",
    priority: 1,
    active: false,
    startsAt: "2026-04-01T00:00:00Z",
    createdBy: "admin-001",
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-05-02T00:00:00Z",
  },
];

export function resetB4Data() {
  // Can be called to restore baseline state in tests
}

export const b4Handlers: HttpHandler[] = [
  // 1. GET */admin/analytics/usage
  http.get("*/admin/analytics/usage", ({ request }) => {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");
    const windowDays = daysParam ? parseInt(daysParam, 10) || 30 : 30;

    // Generate daily points for the requested window
    const dailyActive: { date: string; users: number }[] = [];
    const now = new Date();
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      const dateStr = d.toISOString().slice(0, 10);
      // Realistic weekday/weekend wave around 120-180
      const dayOfWeek = d.getDay();
      const wave = dayOfWeek === 0 || dayOfWeek === 6 ? 95 : 160 + (i % 5) * 8;
      dailyActive.push({ date: dateStr, users: wave });
    }

    const analytics: UsageAnalytics = {
      windowDays,
      activeUsers: 1420,
      avgLoginsPerActiveUser: 4.6,
      avgForegroundSessionSeconds: 184.2,
      medianForegroundSessionSeconds: 118.0,
      dailyActive,
      featureUsage: [
        { feature: "send_money", events: 8420, users: 950 },
        { feature: "virtual_card", events: 5120, users: 780 },
        { feature: "airtime_bill", events: 3840, users: 620 },
        { feature: "student_loan", events: 2410, users: 430 },
        { feature: "gift_card", events: 1980, users: 310 },
        { feature: "kyc_verify", events: 1120, users: 290 },
      ],
      flowUsage: [
        {
          flow: "wallet_fund",
          started: 3200,
          completed: 3040,
          failed: 80,
          abandoned: 80,
          users: 1100,
          completionRate: 0.95,
        },
        {
          flow: "transfer_out",
          started: 2800,
          completed: 2520,
          failed: 140,
          abandoned: 140,
          users: 920,
          completionRate: 0.9,
        },
        {
          flow: "card_fund",
          started: 1500,
          completed: 1350,
          failed: 90,
          abandoned: 60,
          users: 650,
          completionRate: 0.9,
        },
        {
          flow: "loan_application",
          started: 800,
          completed: 560,
          failed: 120,
          abandoned: 120,
          users: 420,
          completionRate: 0.7,
        },
      ],
    };

    return HttpResponse.json(analytics);
  }),

  // 2. GET */admin/support/tickets
  http.get("*/admin/support/tickets", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const filtered = status
      ? supportTickets.filter(
          (t) => t.status.toUpperCase() === status.toUpperCase(),
        )
      : supportTickets;

    // Return summaries (omits messages in list projection)
    const summaries: SupportTicket[] = filtered.map((t) => ({
      id: t.id,
      reference: t.reference,
      category: t.category,
      subject: t.subject,
      status: t.status,
      relatedReference: t.relatedReference,
      lastMessageAt: t.lastMessageAt,
      createdAt: t.createdAt,
    }));

    return HttpResponse.json(cursorPage(summaries));
  }),

  // 3. GET */admin/support/tickets/:id
  http.get("*/admin/support/tickets/:id", ({ params }) => {
    const ticket = supportTickets.find((t) => t.id === params.id);
    if (!ticket) {
      return new HttpResponse(JSON.stringify({ message: "Not found" }), {
        status: 404,
      });
    }
    return HttpResponse.json(ticket);
  }),

  // 4. POST */admin/support/tickets/:id/messages
  http.post(
    "*/admin/support/tickets/:id/messages",
    async ({ params, request }) => {
      const ticket = supportTickets.find((t) => t.id === params.id);
      if (!ticket) {
        return new HttpResponse(JSON.stringify({ message: "Not found" }), {
          status: 404,
        });
      }

      const body = (await request.json()) as { message: string };
      const newMsg = {
        id: `msg-${Date.now()}`,
        author: "admin",
        body: body.message,
        createdAt: new Date().toISOString(),
      };

      ticket.messages.push(newMsg);
      ticket.lastMessageAt = newMsg.createdAt;
      if (ticket.status === "OPEN") {
        ticket.status = "IN_PROGRESS";
      }

      return HttpResponse.json(ticket);
    },
  ),

  // 5. POST */admin/support/tickets/:id/status
  http.post(
    "*/admin/support/tickets/:id/status",
    async ({ params, request }) => {
      const ticket = supportTickets.find((t) => t.id === params.id);
      if (!ticket) {
        return new HttpResponse(JSON.stringify({ message: "Not found" }), {
          status: 404,
        });
      }

      const body = (await request.json()) as { status: string };
      ticket.status = body.status.toUpperCase();
      return HttpResponse.json(ticket);
    },
  ),

  // 6. GET */admin/cards/movements
  http.get("*/admin/cards/movements", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const filtered = status
      ? cardMovements.filter(
          (m) => m.status.toUpperCase() === status.toUpperCase(),
        )
      : cardMovements;

    return HttpResponse.json(cursorPage(filtered));
  }),

  // 7. GET */admin/cards/movements/:id
  http.get("*/admin/cards/movements/:id", ({ params }) => {
    const mov = cardMovements.find((m) => m.id === params.id);
    if (!mov) {
      return new HttpResponse(JSON.stringify({ message: "Not found" }), {
        status: 404,
      });
    }
    return HttpResponse.json(mov);
  }),

  // 8. POST */admin/cards/movements/:id/resolve-completed
  http.post(
    "*/admin/cards/movements/:id/resolve-completed",
    async ({ params, request }) => {
      const mov = cardMovements.find((m) => m.id === params.id);
      if (!mov) {
        return new HttpResponse(JSON.stringify({ message: "Not found" }), {
          status: 404,
        });
      }

      let note = "";
      try {
        const body = (await request.json()) as { note?: string };
        if (body?.note) note = body.note;
      } catch {
        // empty body ok
      }

      mov.status = "COMPLETED";
      mov.resolutionNote = note || "Marked completed by admin ops";
      mov.resolvedBy = "ops@solexpay.com";
      mov.completedAt = new Date().toISOString();

      return HttpResponse.json(mov);
    },
  ),

  // 9. POST */admin/cards/movements/:id/resolve-failed
  http.post(
    "*/admin/cards/movements/:id/resolve-failed",
    async ({ params, request }) => {
      const mov = cardMovements.find((m) => m.id === params.id);
      if (!mov) {
        return new HttpResponse(JSON.stringify({ message: "Not found" }), {
          status: 404,
        });
      }

      let note = "";
      try {
        const body = (await request.json()) as { note?: string };
        if (body?.note) note = body.note;
      } catch {
        // empty body ok
      }

      mov.status = "FAILED";
      mov.resolutionNote = note || "Marked failed by admin ops";
      mov.resolvedBy = "ops@solexpay.com";
      mov.completedAt = new Date().toISOString();

      return HttpResponse.json(mov);
    },
  ),

  // 10. GET */admin/promos
  http.get("*/admin/promos", () => {
    return HttpResponse.json(promosList);
  }),

  // 11. POST */admin/promos
  http.post("*/admin/promos", async ({ request }) => {
    const body = (await request.json()) as {
      slug: string;
      title: string;
      body: string;
      artKey: string;
      ctaLabel: string;
      ctaRoute: string;
      priority?: number;
      startsAt?: string;
      endsAt?: string | null;
    };

    const newPromo: Promo = {
      id: `prm-${Date.now()}`,
      slug: body.slug,
      title: body.title,
      body: body.body,
      artKey: body.artKey,
      ctaLabel: body.ctaLabel,
      ctaRoute: body.ctaRoute,
      priority: body.priority ?? 0,
      active: true,
      startsAt: body.startsAt || new Date().toISOString(),
      endsAt: body.endsAt || null,
      createdBy: "admin-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    promosList = [newPromo, ...promosList];
    return HttpResponse.json(newPromo, { status: 201 });
  }),

  // 12. PUT */admin/promos/:id
  http.put("*/admin/promos/:id", async ({ params, request }) => {
    const promo = promosList.find((p) => p.id === params.id);
    if (!promo) {
      return new HttpResponse(JSON.stringify({ message: "Not found" }), {
        status: 404,
      });
    }

    const body = (await request.json()) as {
      title: string;
      body: string;
      artKey: string;
      ctaLabel: string;
      ctaRoute: string;
      priority: number;
      startsAt: string;
      endsAt: string | null;
      active: boolean;
    };

    promo.title = body.title;
    promo.body = body.body;
    promo.artKey = body.artKey;
    promo.ctaLabel = body.ctaLabel;
    promo.ctaRoute = body.ctaRoute;
    promo.priority = body.priority;
    promo.startsAt = body.startsAt;
    promo.endsAt = body.endsAt;
    promo.active = body.active;
    promo.updatedAt = new Date().toISOString();

    return HttpResponse.json(promo);
  }),

  // 13. POST */admin/promos/:id/deactivate
  http.post("*/admin/promos/:id/deactivate", ({ params }) => {
    const promo = promosList.find((p) => p.id === params.id);
    if (!promo) {
      return new HttpResponse(JSON.stringify({ message: "Not found" }), {
        status: 404,
      });
    }

    promo.active = false;
    promo.updatedAt = new Date().toISOString();

    return HttpResponse.json(promo);
  }),
];
