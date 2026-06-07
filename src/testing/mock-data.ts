import type {
  DashboardMetrics,
  User,
  Loan,
  Transaction,
  KycItem,
  School,
  Profile,
  NotificationSettings,
} from "../app/services/admin.service";

export const mockDashboardMetrics = (
  overrides: Partial<DashboardMetrics> = {},
): DashboardMetrics => ({
  totalUsers: 500,
  activeLoans: 42,
  overdueLoans: 3,
  totalVolume: 7500000,
  trends: {
    users: 15.4,
    volume: 8.9,
    loans: -2.1,
  },
  volumeByDay: [
    { date: "2026-06-01", amount: 150000 },
    { date: "2026-06-02", amount: 300000 },
  ],
  pendingKycItems: [
    { id: "kyc1", name: "John Doe", type: "NIN", time: "2h ago" },
  ],
  recentTransactions: [
    {
      id: "tx1",
      type: "WALLET_FUNDING",
      amount: 20000,
      status: "SUCCESS",
      createdAt: "2026-06-06T12:00:00Z",
      userName: "John Doe",
    },
  ],
  ...overrides,
});

export const mockUser = (overrides: Partial<User> = {}): User => ({
  id: "usr-test-001",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  phoneNumber: "08000000000",
  status: "ACTIVE",
  kycTier: "TIER_2",
  createdAt: "2026-01-01T00:00:00Z",
  walletBalance: 50000,
  ...overrides,
});

export const mockLoan = (overrides: Partial<Loan> = {}): Loan => ({
  id: "loan-test-001",
  userId: "usr-test-001",
  userName: "Test User",
  schoolName: "Test School",
  amount: 100000,
  interestRate: 15,
  tenorMonths: 6,
  monthlyRepayment: 18000,
  status: "OPS_REVIEW",
  purpose: "Tuition",
  appliedAt: "2026-01-01T00:00:00Z",
  creditScore: 700,
  ...overrides,
});

export const mockTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: "tx-test-001",
  type: "WALLET_FUNDING",
  amount: 20000,
  status: "SUCCESS",
  senderName: "GTBank",
  recipientName: "Test User",
  reference: "REF-001",
  description: "Wallet funding",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

export const mockKycItem = (overrides: Partial<KycItem> = {}): KycItem => ({
  id: "kyc-test-001",
  userId: "usr-test-001",
  userName: "Test User",
  type: "NIN",
  documentNumber: "12345678901",
  status: "PENDING",
  submittedAt: "2026-01-01T00:00:00Z",
  documents: ["ID Front", "Selfie"],
  ...overrides,
});

export const mockSchool = (overrides: Partial<School> = {}): School => ({
  id: "sch-test-001",
  name: "Test School",
  email: "test@school.edu",
  phone: "08012345678",
  address: "123 Test St",
  state: "Lagos",
  studentCount: 1000,
  activeLoans: 5,
  totalDisbursed: 500000,
  status: "ACTIVE",
  apiToken: "token-123",
  createdAt: "2026-01-01T00:00:00Z",
  logoUrl: "",
  ...overrides,
});

export const mockProfile = (overrides: Partial<Profile> = {}): Profile => ({
  firstName: "Admin",
  lastName: "User",
  email: "admin@solexpay.com",
  phone: "+2348000000000",
  ...overrides,
});

export const mockNotificationSettings = (
  overrides: Partial<NotificationSettings> = {},
): NotificationSettings => ({
  newUserRegistrations: true,
  loanApplications: true,
  kycSubmissions: true,
  systemAlerts: false,
  browserNotifications: true,
  ...overrides,
});
