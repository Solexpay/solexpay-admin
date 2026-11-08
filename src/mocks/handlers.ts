import { HttpResponse, http } from "msw";

// Helper to simulate cursor page responses
const cursorPage = <T>(
  items: T[],
  nextCursor: string | null = null,
  hasMore = false,
) => ({
  items,
  nextCursor,
  hasMore,
});

// Explicit types for MSW handlers
interface AuthLoginRequest {
  email?: string;
  password?: string;
  totpCode?: string;
}
interface TOTPEnrollRequest {
  enrollmentToken?: string;
}
interface TOTPConfirmRequest {
  enrollmentToken?: string;
  code?: string;
}
interface OpsRejectLoanRequest {
  reviewedBy?: string;
  rejectionReason?: string;
  reason?: string;
}
interface RejectKycRequest {
  reason?: string;
}
interface BroadcastRequest {
  title?: string;
  message?: string;
  targetAudience?: string;
}
interface CreateSchoolRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  state?: string;
}
interface ToggleSchoolStatusRequest {
  status: string;
}
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}
interface UpdateNotificationSettingsRequest {
  newUserRegistrations?: boolean;
  loanApplications?: boolean;
  kycSubmissions?: boolean;
  systemAlerts?: boolean;
  browserNotifications?: boolean;
}
interface CreateAdminRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
}

// Mock database states so changes persist in memory
const mockUsers = [
  {
    id: "usr-001",
    firstName: "Chidi",
    lastName: "Okafor",
    email: "chidi@example.com",
    phoneNumber: "08011111111",
    status: "ACTIVE",
    kycTier: "TIER_2",
    createdAt: "2026-01-10T09:00:00Z",
    walletBalance: 125000,
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "usr-002",
    firstName: "Amaka",
    lastName: "Eze",
    email: "amaka@example.com",
    phoneNumber: "08022222222",
    status: "ACTIVE",
    kycTier: "TIER_2",
    createdAt: "2026-01-15T11:30:00Z",
    walletBalance: 89000,
    avatarUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "usr-003",
    firstName: "Emeka",
    lastName: "Nwosu",
    email: "emeka@example.com",
    phoneNumber: "08033333333",
    status: "SUSPENDED",
    kycTier: "TIER_2",
    createdAt: "2026-02-01T08:00:00Z",
    walletBalance: 0,
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "usr-004",
    firstName: "Ngozi",
    lastName: "Adeyemi",
    email: "ngozi@example.com",
    phoneNumber: "08044444444",
    status: "ACTIVE",
    kycTier: "TIER_1",
    createdAt: "2026-02-14T14:00:00Z",
    walletBalance: 45000,
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "usr-005",
    firstName: "Tunde",
    lastName: "Balogun",
    email: "tunde@example.com",
    phoneNumber: "08055555555",
    status: "ACTIVE",
    kycTier: "TIER_2",
    createdAt: "2026-03-02T10:00:00Z",
    walletBalance: 52000,
    avatarUrl:
      "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "usr-006",
    firstName: "Ifeoma",
    lastName: "Okeke",
    email: "ifeoma@example.com",
    phoneNumber: "08066666666",
    status: "ACTIVE",
    kycTier: "TIER_0",
    createdAt: "2026-03-20T16:45:00Z",
    walletBalance: 3000,
    avatarUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=150&auto=format&fit=crop",
  },
];

const mockTransactions = [
  {
    id: "txn-001",
    type: "WALLET_FUNDING",
    amount: 50000,
    status: "SUCCESS",
    senderName: "GTBank",
    recipientName: "Chidi Okafor",
    reference: "WAL-20260418001",
    description: "Wallet funding via bank transfer",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "txn-002",
    type: "LOAN_DISBURSEMENT",
    amount: 150000,
    status: "SUCCESS",
    senderName: "SolexPay",
    recipientName: "Amaka Eze",
    reference: "LOAN-20260418002",
    description: "Loan disbursement - Education",
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "txn-003",
    type: "NIP_TRANSFER",
    amount: 25000,
    status: "PENDING",
    senderName: "Emeka Nwosu",
    recipientName: "UBA Account",
    reference: "NIP-20260418003",
    description: "Interbank transfer",
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
  {
    id: "txn-004",
    type: "LOAN_REPAYMENT",
    amount: 12500,
    status: "SUCCESS",
    senderName: "Ngozi Adeyemi",
    recipientName: "SolexPay",
    reference: "REP-20260417004",
    description: "Monthly loan repayment",
    createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
  },
  {
    id: "txn-005",
    type: "BILL_PAYMENT",
    amount: 5000,
    status: "FAILED",
    senderName: "Tunde Balogun",
    recipientName: "PHCN",
    reference: "BILL-20260416005",
    description: "Electricity bill payment",
    createdAt: new Date(Date.now() - 22 * 3600000).toISOString(),
  },
];

const mockLoans = [
  {
    id: "LOAN-001",
    userId: "USR-001",
    userName: "Chidi Okafor",
    schoolName: "University of Lagos",
    amount: 150000,
    interestRate: 15,
    tenorMonths: 6,
    monthlyRepayment: 28750,
    status: "OPS_REVIEW",
    purpose: "Tuition Fees",
    appliedAt: new Date(Date.now() - 86400000).toISOString(),
    creditScore: 720,
  },
  {
    id: "LOAN-002",
    userId: "USR-002",
    userName: "Amaka Eze",
    schoolName: "Covenant University",
    amount: 250000,
    interestRate: 12,
    tenorMonths: 12,
    monthlyRepayment: 23333,
    status: "PENDING",
    purpose: "Accommodation",
    appliedAt: new Date(Date.now() - 172800000).toISOString(),
    creditScore: 680,
  },
  {
    id: "LOAN-003",
    userId: "USR-003",
    userName: "Emeka Nwosu",
    schoolName: "University of Ibadan",
    amount: 100000,
    interestRate: 18,
    tenorMonths: 3,
    monthlyRepayment: 34500,
    status: "OPS_REVIEW",
    purpose: "Books & Materials",
    appliedAt: new Date(Date.now() - 259200000).toISOString(),
    creditScore: 450,
  },
  {
    id: "LOAN-004",
    userId: "USR-004",
    userName: "Ngozi Adeyemi",
    schoolName: "Ahmadu Bello University",
    amount: 500000,
    interestRate: 10,
    tenorMonths: 24,
    monthlyRepayment: 22917,
    status: "APPROVED",
    purpose: "Tuition Fees",
    appliedAt: new Date(Date.now() - 432000000).toISOString(),
    creditScore: 780,
  },
  {
    id: "LOAN-005",
    userId: "USR-005",
    userName: "Tunde Balogun",
    schoolName: "University of Abuja",
    amount: 120000,
    interestRate: 14,
    tenorMonths: 9,
    monthlyRepayment: 15400,
    status: "DISBURSED",
    purpose: "Hostel Fees",
    appliedAt: new Date(Date.now() - 604800000).toISOString(),
    creditScore: 640,
  },
];

const mockOverdueLoans = [
  {
    id: "loan-003",
    userId: "usr-003",
    amount: 75000,
    balance: 80000,
    status: "OVERDUE",
    daysOverdue: 45,
    dueDate: "2026-03-01",
  },
];

const mockKyc = [
  {
    id: "kyc-001",
    userId: "USR-001",
    userName: "John Doe",
    type: "BVN",
    documentNumber: "12345678901",
    status: "PENDING",
    submittedAt: new Date(Date.now() - 300000).toISOString(),
    documents: ["ID Front", "ID Back", "Selfie"],
  },
  {
    id: "kyc-002",
    userId: "USR-002",
    userName: "Jane Smith",
    type: "NIN",
    documentNumber: "98765432109",
    status: "PENDING",
    submittedAt: new Date(Date.now() - 900000).toISOString(),
    documents: ["NIN Slip", "Selfie"],
  },
  {
    id: "kyc-003",
    userId: "USR-003",
    userName: "Michael Johnson",
    type: "BVN",
    documentNumber: "45678901234",
    status: "PENDING",
    submittedAt: new Date(Date.now() - 1800000).toISOString(),
    documents: ["ID Front", "ID Back", "Utility Bill"],
  },
  {
    id: "kyc-004",
    userId: "USR-004",
    userName: "Sarah Williams",
    type: "NIN",
    documentNumber: "78901234567",
    status: "PENDING",
    submittedAt: new Date(Date.now() - 3600000).toISOString(),
    documents: ["NIN Slip"],
  },
];

const mockSchools = [
  {
    id: "SCH-001",
    name: "University of Lagos",
    email: "bursar@unilag.edu.ng",
    phone: "+2348012345678",
    address: "Akoka, Yaba, Lagos",
    state: "Lagos",
    studentCount: 45000,
    activeLoans: 1250,
    totalDisbursed: 125000000,
    status: "ACTIVE",
    apiToken: "sk_live_51H7x8jK8Q2mN9pR5",
    createdAt: "2023-01-15T00:00:00Z",
    logoUrl: "/logos/unilag.png",
  },
  {
    id: "SCH-002",
    name: "Covenant University",
    email: "finance@covenantuniversity.edu.ng",
    phone: "+2348098765432",
    address: "KM 10 Idiroko Road, Ota",
    state: "Ogun",
    studentCount: 8500,
    activeLoans: 450,
    totalDisbursed: 45000000,
    status: "ACTIVE",
    apiToken: "sk_live_51H8y9kL9Q3mO0qS6",
    createdAt: "2023-02-20T00:00:00Z",
    logoUrl: "/logos/cu.png",
  },
];

const mockGamingOrders = [
  {
    id: "ord-001",
    reference: "GC-20260418001",
    userId: "usr-001",
    userName: "Chidi Okafor",
    productName: "Steam $50 Gift Card",
    faceValue: "$50",
    status: "UNKNOWN",
    price: 75000,
    providerOrderName: "WUPEX-9988",
    codesStored: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "ord-002",
    reference: "GC-20260418002",
    userId: "usr-002",
    userName: "Amaka Eze",
    productName: "Apple $25 Gift Card",
    faceValue: "$25",
    status: "DELIVERED",
    price: 37500,
    providerOrderName: "WUPEX-9989",
    codesStored: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockNipTransfers = [
  {
    id: "nip-001",
    reference: "NIP-20260418001",
    userId: "usr-001",
    userName: "Chidi Okafor",
    amount: 50000,
    fee: 2688,
    bankName: "Guaranty Trust Bank",
    accountNumber: "******1234",
    accountName: "John Doe",
    status: "PENDING",
    anchorTransferId: "anch-tf-001",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "nip-002",
    reference: "NIP-20260418002",
    userId: "usr-002",
    userName: "Amaka Eze",
    amount: 12000,
    fee: 2688,
    bankName: "Access Bank",
    accountNumber: "******5678",
    accountName: "Jane Smith",
    status: "COMPLETED",
    anchorTransferId: "anch-tf-002",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3000000).toISOString(),
  },
];

const mockDeadOutboxList = [
  {
    id: "out-001",
    topic: "ops.notification.sms.dead",
    payload: { to: "+2348011111111", message: "Your OTP is 123456" },
    attempts: 12,
    lastError: "Termii provider gateway timeout",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const mockComplianceFlagList = [
  {
    id: "flag-001",
    userId: "usr-001",
    userName: "Chidi Okafor",
    phoneNumber: "08011111111",
    kind: "TIER_LIMIT_EXCEEDED",
    detail: { inflow: 500000, maxLimit: 300000 },
    status: "OPEN",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockAuditList = [
  {
    seq: 1,
    id: "aud-001",
    actorType: "ADMIN",
    actorId: "admin-super-001",
    action: "USER_SUSPENDED",
    entityType: "USER",
    entityId: "usr-003",
    ip: "192.168.1.1",
    userAgent: "AdminPortal/1.0",
    data: { reason: "Suspicious transaction activity" },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    chainSeq: 1,
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
];

const mockAdminUsers: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}[] = [
  {
    id: "admin-001",
    email: "super@solexpay.com",
    firstName: "Super",
    lastName: "Admin",
    phone: "+2348000000001",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    lastLoginAt: new Date().toISOString(),
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "admin-002",
    email: "ops@solexpay.com",
    firstName: "Ops",
    lastName: "Lead",
    phone: "+2348000000002",
    role: "OPS",
    status: "ACTIVE",
    lastLoginAt: new Date().toISOString(),
    createdAt: "2026-01-15T00:00:00Z",
  },
];

const mockDashboard = {
  // Fields the Go backend sends (internal/admin/dto.go DashboardMetrics)
  totalUsers: 1482,
  activeUsersToday: 312,
  newUsersToday: 27,
  transactionVolumeToday: 1840500,
  transactionVolumeThisMonth: 48200000,
  transactionCountToday: 642,
  totalLoanPortfolio: 15600000,
  totalSavingsBalance: 9350000,
  reportDate: new Date().toISOString().slice(0, 10),
  totalVolume: 48200000,
  activeUsers: 1104,
  totalTransactions: 23410,
  totalTransactionVolume: 48200000,
  pendingKyc: 37,
  totalLoans: 512,
  activeLoans: 204,
  overdueLoans: 18,
  totalLoanDisbursed: 15600000,
  revenue: 980000,
  trends: {
    users: 12.5,
    volume: 8.3,
    loans: -2.1,
  },
  volumeByDay: [
    {
      date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
      amount: 150000,
    },
    {
      date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
      amount: 230000,
    },
    {
      date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
      amount: 180000,
    },
    {
      date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
      amount: 320000,
    },
    {
      date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      amount: 280000,
    },
    {
      date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
      amount: 350000,
    },
    { date: new Date().toISOString().slice(0, 10), amount: 410000 },
  ],
  pendingKycItems: [
    { id: "1", name: "John Doe", type: "BVN Verification", time: "2 min ago" },
    {
      id: "2",
      name: "Jane Smith",
      type: "NIN Verification",
      time: "15 min ago",
    },
    {
      id: "3",
      name: "Mike Johnson",
      type: "BVN Verification",
      time: "1 hour ago",
    },
  ],
  recentTransactions: [
    {
      id: "1",
      type: "WALLET_FUNDING",
      amount: 50000,
      status: "SUCCESS",
      createdAt: new Date().toISOString(),
      userName: "John Doe",
    },
    {
      id: "2",
      type: "LOAN_DISBURSEMENT",
      amount: 150000,
      status: "SUCCESS",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      userName: "Jane Smith",
    },
  ],
};

const mockProfile = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@solexpay.com",
  phone: "+2348012345678",
  avatarUrl:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop",
};

const mockNotificationSettings = {
  newUserRegistrations: true,
  loanApplications: true,
  kycSubmissions: true,
  systemAlerts: false,
  browserNotifications: true,
};

export const handlers = [
  // 1. Auth Logins
  http.post("*/auth/admin/login", async ({ request }) => {
    const body = (await request.json()) as AuthLoginRequest;
    if (!body?.email || !body?.password) {
      return new HttpResponse("Email and password required", { status: 400 });
    }

    if (body.email === "totp-enroll@solexpay.com") {
      return HttpResponse.json({
        enrollmentRequired: true,
        enrollmentToken: "mock-enrollment-token-12345",
      });
    }

    return HttpResponse.json({
      token: "dev.mock.jwt.token",
      expiresIn: 900,
      admin: {
        id: "admin-001",
        email: body.email,
        firstName: "Dev",
        lastName: "Admin",
        role: "SUPER_ADMIN",
      },
      user: {
        id: "admin-001",
        email: body.email,
        role: "ADMIN",
        firstName: "Dev",
        lastName: "Admin",
      },
    });
  }),

  // TOTP routes
  http.post("*/auth/admin/totp/enroll", async ({ request }) => {
    const body = (await request.json()) as TOTPEnrollRequest;
    if (!body?.enrollmentToken) {
      return new HttpResponse("enrollmentToken required", { status: 400 });
    }
    return HttpResponse.json({
      secret: "JBSWY3DPEHPK3PXP",
      otpauthUrl:
        "otpauth://totp/SolexPay:admin@solexpay.com?secret=JBSWY3DPEHPK3PXP&issuer=SolexPay",
    });
  }),

  http.post("*/auth/admin/totp/confirm", async ({ request }) => {
    const body = (await request.json()) as TOTPConfirmRequest;
    if (!body?.enrollmentToken || !body?.code) {
      return new HttpResponse("enrollmentToken and code required", {
        status: 400,
      });
    }
    return HttpResponse.json({
      token: "dev.mock.confirmed.jwt.token",
      expiresIn: 900,
      admin: {
        id: "admin-001",
        email: "enrolled@solexpay.com",
        firstName: "Dev",
        lastName: "Admin",
        role: "SUPER_ADMIN",
      },
      user: {
        id: "admin-001",
        email: "enrolled@solexpay.com",
        role: "ADMIN",
        firstName: "Dev",
        lastName: "Admin",
      },
    });
  }),

  // Refresh
  // The real backend reads the refresh token from its httpOnly cookie; the
  // mock acts as if that cookie is always valid.
  http.post("*/auth/admin/refresh", () => {
    return HttpResponse.json({
      token: "dev.mock.refreshed.jwt.token",
      expiresIn: 900,
      admin: {
        id: "admin-001",
        email: "refreshed@solexpay.com",
        firstName: "Dev",
        lastName: "Admin",
        role: "SUPER_ADMIN",
      },
      user: {
        id: "admin-001",
        email: "refreshed@solexpay.com",
        role: "ADMIN",
        firstName: "Dev",
        lastName: "Admin",
      },
    });
  }),

  // Logout
  http.post("*/auth/admin/logout", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Dashboard Metrics
  http.get("*/admin/dashboard/metrics", () => {
    return HttpResponse.json(mockDashboard);
  }),

  // Users List (CursorPage)
  http.get("*/admin/users", ({ request }) => {
    const url = new URL(request.url);
    const search =
      url.searchParams.get("phoneNumber") || url.searchParams.get("search");
    const status = url.searchParams.get("status");

    let filtered = [...mockUsers];
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.phoneNumber.includes(search) ||
          `${u.firstName} ${u.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      );
    }
    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }
    return HttpResponse.json(cursorPage(filtered));
  }),

  // User Detail
  http.get("*/admin/users/:userId", ({ params }) => {
    const { userId } = params;
    const user = mockUsers.find(
      (u) => u.id.toLowerCase() === String(userId).toLowerCase(),
    );
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    const fullName = `${user.firstName} ${user.lastName}`;
    const upperId = user.id.toUpperCase();

    return HttpResponse.json({
      ...user,
      role: "USER",
      suspendedAt:
        user.status === "SUSPENDED"
          ? new Date(Date.now() - 86400000).toISOString()
          : null,
      suspensionReason:
        user.status === "SUSPENDED" ? "Suspicious transaction activity" : null,
      recentTransactions: mockTransactions
        .filter(
          (t) => t.senderName === fullName || t.recipientName === fullName,
        )
        .map(
          ({
            id,
            reference,
            type,
            status,
            amount,
            description,
            createdAt,
          }) => ({
            id,
            reference,
            type,
            status,
            amount,
            description,
            createdAt,
          }),
        ),
      loans: mockLoans
        .filter((l) => l.userId.toUpperCase() === upperId)
        .map((l) => ({
          id: l.id,
          studentId: l.userId,
          studentName: l.userName,
          schoolId: mockSchools.find((s) => s.name === l.schoolName)?.id ?? "",
          schoolName: l.schoolName,
          amount: l.amount,
          status: l.status,
          submittedAt: l.appliedAt,
          disbursedAt: l.status === "DISBURSED" ? l.appliedAt : null,
          outstandingPrincipal: l.amount,
          outstandingInterest: Math.round(l.amount * (l.interestRate / 100)),
          installmentsRemaining: l.tenorMonths,
          isOverdue: false,
        })),
      kycVerifications: mockKyc
        .filter((k) => k.userId.toUpperCase() === upperId)
        .map((k) => ({
          id: k.id,
          userId: k.userId,
          status: k.status,
          idType: k.type,
          requestedTier: user.kycTier,
          verifiedFirstName: user.firstName,
          verifiedLastName: user.lastName,
          providerReference: k.documentNumber,
          providerResponseMessage: null,
          processedAt: null,
          createdAt: k.submittedAt,
        })),
    });
  }),

  // Suspend User
  http.post("*/admin/users/:userId/suspend", async ({ params, request }) => {
    const { userId } = params;
    const body = (await request.json().catch(() => ({}))) as {
      reason?: string;
    };
    const reason = body?.reason || "Suspended by admin";
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      user.status = "SUSPENDED";
    }
    return HttpResponse.json({
      success: true,
      message: `User suspended: ${reason}`,
      user,
    });
  }),

  // Reactivate User
  http.post("*/admin/users/:userId/reactivate", ({ params }) => {
    const { userId } = params;
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      user.status = "ACTIVE";
    }
    return HttpResponse.json({
      success: true,
      message: "User reactivated",
      user,
    });
  }),

  // Loans List (CursorPage)
  http.get("*/admin/loans", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    let filtered = [...mockLoans];
    if (status) {
      filtered = filtered.filter((l) => l.status === status);
    }
    return HttpResponse.json(cursorPage(filtered));
  }),

  // Overdue Loans List
  http.get("*/admin/loans/overdue", () => {
    return HttpResponse.json(cursorPage(mockOverdueLoans));
  }),

  // Ops Pending Loans List
  http.get("*/loans/ops-pending", () => {
    const pending = mockLoans.filter((l) => l.status === "OPS_REVIEW");
    return HttpResponse.json(cursorPage(pending));
  }),

  // Approve Loan
  http.post("*/loans/:loanId/ops-approve", ({ params }) => {
    const { loanId } = params;
    const loan = mockLoans.find((l) => l.id === loanId);
    if (loan) {
      loan.status = "APPROVED";
    }
    return HttpResponse.json({
      success: true,
      message: "Loan approved by Ops",
      loan,
    });
  }),

  // Reject Loan
  http.post("*/loans/:loanId/ops-reject", async ({ params, request }) => {
    const { loanId } = params;
    const body = (await request.json()) as OpsRejectLoanRequest;
    const rejectionReason =
      body?.rejectionReason || body?.reason || "Rejected by Ops";
    const loan = mockLoans.find((l) => l.id === loanId);
    if (loan) {
      loan.status = "REJECTED";
    }
    return HttpResponse.json({
      success: true,
      message: `Loan rejected: ${rejectionReason}`,
      loan,
    });
  }),

  // Transactions List (CursorPage)
  http.get("*/admin/transactions", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");

    let filtered = [...mockTransactions];
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }
    return HttpResponse.json(cursorPage(filtered));
  }),

  // KYC Queue (CursorPage)
  http.get("*/admin/kyc", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "PENDING";
    const filtered = mockKyc.filter((k) => k.status === status);
    return HttpResponse.json(cursorPage(filtered));
  }),

  // Approve KYC
  http.post("*/admin/kyc/:verificationId/approve", ({ params }) => {
    const { verificationId } = params;
    const kycItem = mockKyc.find((k) => k.id === verificationId);
    if (kycItem) {
      kycItem.status = "APPROVED";
      const user = mockUsers.find((u) => u.id === kycItem.userId);
      if (user) {
        user.kycTier = kycItem.type === "BVN" ? "TIER_2" : "TIER_1";
      }
    }
    return HttpResponse.json({
      success: true,
      message: "KYC approved",
      kycItem,
    });
  }),

  // Reject KYC
  http.post(
    "*/admin/kyc/:verificationId/reject",
    async ({ params, request }) => {
      const { verificationId } = params;
      const body = (await request.json()) as RejectKycRequest;
      const reason = body?.reason || "Rejected by admin";
      const kycItem = mockKyc.find((k) => k.id === verificationId);
      if (kycItem) {
        kycItem.status = "REJECTED";
      }
      return HttpResponse.json({
        success: true,
        message: `KYC rejected: ${reason}`,
        kycItem,
      });
    },
  ),

  // Broadcast Notification
  http.post("*/admin/broadcast", async ({ request }) => {
    const body = (await request.json()) as BroadcastRequest;
    const { title, targetAudience } = body || {};
    return HttpResponse.json({
      success: true,
      eventId: "ev-broadcast-001",
      message: `Notification broadcasted to ${targetAudience}: ${title}`,
    });
  }),

  // Schools API (CursorPage)
  http.get("*/admin/schools", () => {
    return HttpResponse.json(cursorPage(mockSchools));
  }),

  http.post("*/admin/schools", async ({ request }) => {
    const body = (await request.json()) as CreateSchoolRequest;
    const school = {
      id: `SCH-${(mockSchools.length + 1).toString().padStart(3, "0")}`,
      name: body.name,
      email: body.email,
      phone: body.phone || "N/A",
      address: body.address || "N/A",
      state: body.state || "N/A",
      studentCount: 0,
      activeLoans: 0,
      totalDisbursed: 0,
      status: "ACTIVE" as const,
      apiToken: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString(),
      // No upload yet: the console falls back to a bundled crest or initials.
      logoUrl: "",
    };
    mockSchools.push(school);
    return HttpResponse.json(school);
  }),

  http.post("*/admin/schools/:schoolId/regenerate-token", ({ params }) => {
    const { schoolId } = params;
    // Same shape as the backend: the school's login is reset to a new
    // temporary password, shown once.
    return HttpResponse.json({
      success: true,
      data: {
        school_id: schoolId,
        temporary_password: `${Math.random().toString(36).slice(2, 12)}A1!`,
      },
    });
  }),

  http.post(
    "*/admin/schools/:schoolId/toggle-status",
    async ({ params, request }) => {
      const { schoolId } = params;
      const body = (await request.json()) as ToggleSchoolStatusRequest;
      const school = mockSchools.find((s) => s.id === schoolId);
      if (school) {
        school.status = body.status;
      }
      return HttpResponse.json({ success: true, school });
    },
  ),

  // Gaming / Gift Card Orders (CursorPage)
  http.get("*/admin/gaming/orders", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "UNKNOWN";
    const filtered = mockGamingOrders.filter((o) => o.status === status);
    return HttpResponse.json(cursorPage(filtered));
  }),

  http.get("*/admin/gaming/orders/:id", ({ params }) => {
    const { id } = params;
    const order = mockGamingOrders.find((o) => o.id === id);
    if (!order) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(order);
  }),

  http.post("*/admin/gaming/orders/:id/resolve-delivered", ({ params }) => {
    const { id } = params;
    const order = mockGamingOrders.find((o) => o.id === id);
    if (order) {
      order.status = "DELIVERED";
      order.codesStored = true;
    }
    return HttpResponse.json({ success: true, order });
  }),

  http.post("*/admin/gaming/orders/:id/resolve-failed", ({ params }) => {
    const { id } = params;
    const order = mockGamingOrders.find((o) => o.id === id);
    if (order) {
      order.status = "FAILED";
    }
    return HttpResponse.json({ success: true, order });
  }),

  // NIP Transfers (CursorPage)
  http.get("*/admin/nip/transfers", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "PENDING";
    const filtered = mockNipTransfers.filter((t) => t.status === status);
    return HttpResponse.json(cursorPage(filtered));
  }),

  http.get("*/admin/nip/transfers/:id", ({ params }) => {
    const { id } = params;
    const item = mockNipTransfers.find((t) => t.id === id);
    if (!item) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(item);
  }),

  // Ops Console (Dead Outbox & Compliance Flags)
  http.get("*/admin/ops/outbox/dead", () => {
    return HttpResponse.json(cursorPage(mockDeadOutboxList));
  }),

  http.post("*/admin/ops/outbox/:id/requeue", ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      message: `Message ${id} requeued`,
    });
  }),

  http.get("*/admin/ops/compliance-flags", () => {
    return HttpResponse.json(cursorPage(mockComplianceFlagList));
  }),

  http.post("*/admin/ops/compliance-flags/:id/resolve", ({ params }) => {
    const { id } = params;
    const flag = mockComplianceFlagList.find((f) => f.id === id);
    if (flag) {
      flag.status = "RESOLVED";
    }
    return HttpResponse.json({
      success: true,
      message: "Compliance flag resolved",
    });
  }),

  // Audit Logs
  http.get("*/admin/audit", () => {
    return HttpResponse.json(cursorPage(mockAuditList));
  }),

  http.get("*/admin/audit/verify", () => {
    return HttpResponse.json({
      checked: 1,
      ok: true,
      firstBrokenChainSeq: 0,
      firstBrokenAuditId: "",
    });
  }),

  // Admins Management
  http.get("*/admin/admins", () => {
    return HttpResponse.json(cursorPage(mockAdminUsers));
  }),

  http.post("*/admin/admins", async ({ request }) => {
    const body = (await request.json()) as CreateAdminRequest;
    const admin = {
      id: `admin-${(mockAdminUsers.length + 1).toString().padStart(3, "0")}`,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
      role: body.role,
      status: "ACTIVE",
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };
    mockAdminUsers.push(admin);
    return HttpResponse.json({
      admin,
      temporaryPassword: "TempPassword!123",
    });
  }),

  http.post("*/admin/admins/:id/disable", ({ params }) => {
    const { id } = params;
    const admin = mockAdminUsers.find((a) => a.id === id);
    if (admin) {
      admin.status = "DISABLED";
    }
    return HttpResponse.json({ success: true, message: "Admin disabled" });
  }),

  http.post("*/admin/admins/:id/reset-totp", () => {
    return HttpResponse.json({ success: true, message: "Admin TOTP reset" });
  }),

  // Profile API
  http.get("*/admin/profile", () => {
    return HttpResponse.json(mockProfile);
  }),

  http.put("*/admin/profile", async ({ request }) => {
    const body = (await request.json()) as UpdateProfileRequest;
    mockProfile.firstName = body.firstName || mockProfile.firstName;
    mockProfile.lastName = body.lastName || mockProfile.lastName;
    mockProfile.email = body.email || mockProfile.email;
    mockProfile.phone = body.phone || mockProfile.phone;
    return HttpResponse.json({ success: true, profile: mockProfile });
  }),

  // Notification Settings API
  http.get("*/admin/settings/notifications", () => {
    return HttpResponse.json(mockNotificationSettings);
  }),

  http.put("*/admin/settings/notifications", async ({ request }) => {
    const body = (await request.json()) as UpdateNotificationSettingsRequest;
    mockNotificationSettings.newUserRegistrations =
      body.newUserRegistrations !== undefined
        ? body.newUserRegistrations
        : mockNotificationSettings.newUserRegistrations;
    mockNotificationSettings.loanApplications =
      body.loanApplications !== undefined
        ? body.loanApplications
        : mockNotificationSettings.loanApplications;
    mockNotificationSettings.kycSubmissions =
      body.kycSubmissions !== undefined
        ? body.kycSubmissions
        : mockNotificationSettings.kycSubmissions;
    mockNotificationSettings.systemAlerts =
      body.systemAlerts !== undefined
        ? body.systemAlerts
        : mockNotificationSettings.systemAlerts;
    mockNotificationSettings.browserNotifications =
      body.browserNotifications !== undefined
        ? body.browserNotifications
        : mockNotificationSettings.browserNotifications;
    return HttpResponse.json({
      success: true,
      settings: mockNotificationSettings,
    });
  }),
];
