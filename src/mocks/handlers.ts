import { http, HttpResponse } from "msw";

// Helper to simulate page responses
const page = <T>(items: T[], size = 10) => ({
  content: items,
  totalElements: items.length,
  totalPages: 1,
  size,
  number: 0,
  first: true,
  last: true,
});

// Explicit types for MSW handlers
interface AuthLoginRequest {
  email?: string;
  password?: string;
}
interface ForgotPasswordRequest {
  email?: string;
}
interface ResetPasswordRequest {
  token?: string;
  email?: string;
  newPassword?: string;
}
interface OpsRejectLoanRequest {
  rejectionReason?: string;
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
  status: "ACTIVE" | "INACTIVE";
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

// Mock database states so changes (suspending user, approving loan, approving KYC) persist in browser memory
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

const mockDashboard = {
  totalUsers: 1482,
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
    {
      id: "3",
      type: "NIP_TRANSFER",
      amount: 25000,
      status: "PENDING",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      userName: "Mike Johnson",
    },
    {
      id: "4",
      type: "LOAN_REPAYMENT",
      amount: 12500,
      status: "SUCCESS",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      userName: "Sarah Williams",
    },
    {
      id: "5",
      type: "BILL_PAYMENT",
      amount: 5000,
      status: "FAILED",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      userName: "Tom Brown",
    },
  ],
};

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
    createdAt: "2023-01-15",
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
    createdAt: "2023-02-20",
    logoUrl: "/logos/cu.png",
  },
  {
    id: "SCH-003",
    name: "University of Ibadan",
    email: "bursar@ui.edu.ng",
    phone: "+2348055512345",
    address: "Ibadan, Oyo State",
    state: "Oyo",
    studentCount: 33000,
    activeLoans: 890,
    totalDisbursed: 89000000,
    status: "ACTIVE",
    apiToken: "sk_live_51H9z0mM0Q4mP1rT7",
    createdAt: "2023-03-10",
    logoUrl: "/logos/ui.png",
  },
  {
    id: "SCH-004",
    name: "University of Abuja",
    email: "bursar@uniabuja.edu.ng",
    phone: "+2348077723456",
    address: "Airport Road, Abuja",
    state: "Abuja",
    studentCount: 15000,
    activeLoans: 320,
    totalDisbursed: 32000000,
    status: "INACTIVE",
    apiToken: "sk_live_51H0a1nN1Q5mQ2sU8",
    createdAt: "2023-04-05",
    logoUrl: "/logos/uniabuja.png",
  },
];

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
  http.post("*/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as AuthLoginRequest;
    if (!body?.email || !body?.password) {
      return new HttpResponse("Email and password required", { status: 400 });
    }
    return HttpResponse.json({
      token: "dev.mock.jwt.token",
      user: {
        id: "usr-001",
        email: body.email,
        role: "ADMIN",
        firstName: "Dev",
        lastName: "Admin",
      },
    });
  }),

  http.post("*/api/auth/school/login", async ({ request }) => {
    const body = (await request.json()) as AuthLoginRequest;
    if (!body?.email || !body?.password) {
      return new HttpResponse("Email and password required", { status: 400 });
    }
    return HttpResponse.json({
      token: "dev.mock.jwt.token",
      user: {
        id: "usr-school-001",
        email: body.email,
        role: "SCHOOL",
        firstName: "School",
        lastName: "Admin",
      },
    });
  }),

  // 2. Forgot Password
  http.post("*/api/auth/forgot-password", async ({ request }) => {
    const body = (await request.json()) as ForgotPasswordRequest;
    const email = body?.email;
    if (!email) {
      return new HttpResponse("Email is required", { status: 400 });
    }
    const mockResetToken =
      "mock-reset-token-" + Math.random().toString(36).substring(2, 15);
    const resetLink = `http://localhost:5173/reset-password?token=${mockResetToken}&email=${encodeURIComponent(email)}`;
    return HttpResponse.json({
      message: "If the email exists, a reset link has been sent.",
      email: email,
      resetLink,
      resetToken: mockResetToken,
      expiresIn: "24h",
      sentAt: new Date().toISOString(),
      _devNote:
        "DEV MODE: Use the reset link above to test the flow. Token expires in 24 hours.",
    });
  }),

  // 3. Reset Password
  http.post("*/api/auth/reset-password", async ({ request }) => {
    const body = (await request.json()) as ResetPasswordRequest;
    const token = body?.token;
    const email = body?.email;
    const password = body?.newPassword;
    if (!token || !email || !password) {
      return new HttpResponse("Token, email, and newPassword are required", {
        status: 400,
      });
    }
    if (!token.startsWith("mock-reset-token-")) {
      return HttpResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      message:
        "Password reset successful. You can now sign in with your new password.",
    });
  }),

  // 4. Dashboard Metrics
  http.get("*/api/admin/dashboard", () => {
    return HttpResponse.json(mockDashboard);
  }),

  // 5. Users List
  http.get("*/api/admin/users", ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("phoneNumber");
    const status = url.searchParams.get("status");
    const size = parseInt(url.searchParams.get("size") || "20", 10);

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
    return HttpResponse.json(page(filtered, size));
  }),

  // 5b. User Detail
  http.get("*/api/admin/users/:userId", ({ params }) => {
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

  // 6. Suspend User
  http.post("*/api/admin/users/:userId/suspend", ({ params, request }) => {
    const { userId } = params;
    const url = new URL(request.url);
    const reason = url.searchParams.get("reason") || "Suspended by admin";
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

  // 7. Reactivate User
  http.post("*/api/admin/users/:userId/reactivate", ({ params }) => {
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

  // 8. Loans List
  http.get("*/api/admin/loans", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const size = parseInt(url.searchParams.get("size") || "50", 10);

    let filtered = [...mockLoans];
    if (status) {
      filtered = filtered.filter((l) => l.status === status);
    }
    return HttpResponse.json(page(filtered, size));
  }),

  // 9. Overdue Loans List
  http.get("*/api/admin/loans/overdue", ({ request }) => {
    const url = new URL(request.url);
    const size = parseInt(url.searchParams.get("size") || "20", 10);
    return HttpResponse.json(page(mockOverdueLoans, size));
  }),

  // 10. Approve Loan
  http.post("*/api/loans/:loanId/ops-approve", ({ params }) => {
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

  // 11. Reject Loan
  http.post("*/api/loans/:loanId/ops-reject", async ({ params, request }) => {
    const { loanId } = params;
    const body = (await request.json()) as OpsRejectLoanRequest;
    const rejectionReason = body?.rejectionReason || "Rejected by Ops";
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

  // 12. Transactions List
  http.get("*/api/admin/transactions", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const size = parseInt(url.searchParams.get("size") || "50", 10);

    let filtered = [...mockTransactions];
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }
    return HttpResponse.json(page(filtered, size));
  }),

  // 13. KYC Queue
  http.get("*/api/admin/kyc", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "PENDING";
    const size = parseInt(url.searchParams.get("size") || "50", 10);

    const filtered = mockKyc.filter((k) => k.status === status);
    return HttpResponse.json(page(filtered, size));
  }),

  // 14. Approve KYC
  http.post("*/api/admin/kyc/:verificationId/approve", ({ params }) => {
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

  // 15. Reject KYC
  http.post(
    "*/api/admin/kyc/:verificationId/reject",
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

  // 16. Broadcast Notification
  http.post("*/api/admin/broadcast", async ({ request }) => {
    const body = (await request.json()) as BroadcastRequest;
    const { title, targetAudience } = body || {};
    return HttpResponse.json({
      success: true,
      message: `Notification broadcasted to ${targetAudience}: ${title}`,
    });
  }),

  // 17. Schools API
  http.get("*/api/admin/schools", () => {
    return HttpResponse.json(mockSchools);
  }),

  http.post("*/api/admin/schools", async ({ request }) => {
    const body = (await request.json()) as CreateSchoolRequest;
    const school = {
      id: "SCH-" + (mockSchools.length + 1).toString().padStart(3, "0"),
      name: body.name,
      email: body.email,
      phone: body.phone || "N/A",
      address: body.address || "N/A",
      state: body.state || "N/A",
      studentCount: 0,
      activeLoans: 0,
      totalDisbursed: 0,
      status: "ACTIVE" as const,
      apiToken: "sk_live_" + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name)}&background=random&color=fff&size=120`,
    };
    mockSchools.push(school);
    return HttpResponse.json(school);
  }),

  http.post("*/api/admin/schools/:schoolId/regenerate-token", ({ params }) => {
    const { schoolId } = params;
    const school = mockSchools.find((s) => s.id === schoolId);
    if (school) {
      school.apiToken =
        "sk_live_" + Math.random().toString(36).substring(2, 15);
    }
    return HttpResponse.json({ success: true, school });
  }),

  http.post(
    "*/api/admin/schools/:schoolId/toggle-status",
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

  // 18. Profile API
  http.get("*/api/admin/profile", () => {
    return HttpResponse.json(mockProfile);
  }),

  http.put("*/api/admin/profile", async ({ request }) => {
    const body = (await request.json()) as UpdateProfileRequest;
    mockProfile.firstName = body.firstName || mockProfile.firstName;
    mockProfile.lastName = body.lastName || mockProfile.lastName;
    mockProfile.email = body.email || mockProfile.email;
    mockProfile.phone = body.phone || mockProfile.phone;
    return HttpResponse.json({ success: true, profile: mockProfile });
  }),

  // 19. Notification Settings API
  http.get("*/api/admin/settings/notifications", () => {
    return HttpResponse.json(mockNotificationSettings);
  }),

  http.put("*/api/admin/settings/notifications", async ({ request }) => {
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
