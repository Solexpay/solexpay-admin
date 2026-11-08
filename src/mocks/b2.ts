import { type HttpHandler, HttpResponse, http } from "msw";
import type { CursorPage, Loan, TransactionDetail } from "@/lib/types";

const cursorPage = <T>(
  items: T[],
  nextCursor: string | null = null,
  hasMore = false,
): CursorPage<T> => ({
  items,
  nextCursor,
  hasMore,
});

export const b2Handlers: HttpHandler[] = [
  // Override GET */loans/ops-pending so one loan has a bankConnection and one does not
  http.get("*/loans/ops-pending", () => {
    const loans: Loan[] = [
      {
        id: "LOAN-001",
        userId: "usr-001",
        userName: "Chidi Okafor",
        schoolName: "University of Lagos",
        amount: 150000,
        interestRate: 15,
        tenorMonths: 6,
        monthlyRepayment: 28750,
        status: "OPS_REVIEW",
        purpose: "Tuition Fees",
        appliedAt: "2026-06-01T10:00:00Z",
        creditScore: 720,
        bankConnection: {
          institutionName: "Guaranty Trust Bank",
          accountNumberMasked: "••••••4821",
          balance: 450000,
          dataStatus: "AVAILABLE",
          lastSyncedAt: "2026-06-01T09:30:00Z",
        },
      },
      {
        id: "LOAN-003",
        userId: "usr-003",
        userName: "Emeka Nwosu",
        schoolName: "University of Ibadan",
        amount: 100000,
        interestRate: 18,
        tenorMonths: 3,
        monthlyRepayment: 34500,
        status: "OPS_REVIEW",
        purpose: "Books & Materials",
        appliedAt: "2026-06-02T14:30:00Z",
        creditScore: 450,
        bankConnection: null,
      },
    ];
    return HttpResponse.json(cursorPage(loans));
  }),

  // Transaction detail endpoint: GET */admin/transactions/:id
  http.get("*/admin/transactions/:id", ({ params }) => {
    const { id } = params;
    const detail: TransactionDetail = {
      transaction: {
        id: String(id),
        type: "WALLET_FUNDING",
        amount: 50000,
        status: "SUCCESS",
        senderName: "GTBank",
        recipientName: "Chidi Okafor",
        reference: "WAL-20260418001",
        description: "Wallet funding via bank transfer",
        createdAt: "2026-04-18T10:00:00Z",
        userId: "usr-001",
      } as unknown as TransactionDetail["transaction"],
      journals: [
        {
          id: "jnl-001",
          kind: "WALLET_FUNDING",
          memo: "Bank deposit received into user wallet",
          createdAt: "2026-04-18T10:00:00Z",
          lines: [
            {
              id: "line-001",
              accountId: "acc-bank-gtb",
              accountKind: "ASSET",
              accountCode: "1010-GTB",
              side: "DEBIT",
              amount: 50000,
              balanceAfter: 5500000,
              createdAt: "2026-04-18T10:00:00Z",
            },
            {
              id: "line-002",
              accountId: "acc-usr-001",
              accountKind: "LIABILITY",
              accountCode: "2010-USR-001",
              side: "CREDIT",
              amount: 50000,
              balanceAfter: 125000,
              createdAt: "2026-04-18T10:00:00Z",
            },
          ],
        },
      ],
    };
    return HttpResponse.json(detail);
  }),
];
