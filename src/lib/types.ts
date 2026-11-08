export type { AdminRole } from "./access";

import type { AdminRole } from "./access";

export interface AdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
}
export interface DashboardMetrics {
  totalUsers: number;
  activeUsersToday?: number;
  newUsersToday?: number;
  transactionVolumeToday?: number;
  transactionVolumeThisMonth?: number;
  transactionCountToday?: number;
  activeLoans: number;
  overdueLoans: number;
  totalLoanPortfolio?: number;
  defaultRate?: number;
  totalSavingsBalance?: number;
  reportDate?: string;
  period?: string;
  totalVolume?: number;
  activeUsers?: number;
  totalTransactions?: number;
  totalTransactionVolume?: number;
  pendingKyc?: number;
  totalLoans?: number;
  totalLoanDisbursed?: number;
  revenue?: number;
  trends?: Record<string, number>;
  volumeByDay?: { date: string; amount: number }[];
  pendingKycItems?: { id: string; name: string; type: string; time: string }[];
  recentTransactions?: {
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    userName: string;
  }[];
}
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
export type Page<T> = CursorPage<T>;
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  kycTier: string;
  createdAt: string;
  walletBalance: number;
  avatarUrl?: string;
}
export interface TransactionSummary {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  description: string;
  createdAt: string;
}
export interface LoanSummary {
  id: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  schoolName: string;
  amount: number;
  status: string;
  submittedAt: string;
  disbursedAt: string | null;
  outstandingPrincipal: number;
  outstandingInterest: number;
  installmentsRemaining: number;
  isOverdue: boolean;
}
export interface KycSummary {
  id: string;
  userId: string;
  status: string;
  idType: string;
  requestedTier: string;
  verifiedFirstName: string | null;
  verifiedLastName: string | null;
  providerReference: string | null;
  providerResponseMessage: string | null;
  processedAt: string | null;
  createdAt: string;
}
export interface UserDetail extends User {
  role: string;
  suspendedAt: string | null;
  suspensionReason: string | null;
  recentTransactions: TransactionSummary[];
  loans: LoanSummary[];
  kycVerifications: KycSummary[];
}
export interface BankConnectionSnapshot {
  institutionName: string | null;
  accountNumberMasked: string | null;
  balance: number | null;
  dataStatus: string | null;
  lastSyncedAt: string | null;
}
export interface Loan {
  id: string;
  userId?: string;
  userName?: string;
  schoolName?: string;
  amount: number;
  interestRate?: number;
  tenorMonths?: number;
  tenureMonths?: number;
  monthlyRepayment?: number;
  status: string;
  purpose?: string;
  appliedAt?: string;
  createdAt?: string;
  creditScore?: number;
  studentId?: string;
  studentName?: string;
  schoolId?: string;
  outstandingPrincipal?: number;
  outstandingInterest?: number;
  rejectionReason?: string;
  bankConnection?: BankConnectionSnapshot | null;
}
export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  senderName: string;
  recipientName: string;
  reference: string;
  description: string;
  createdAt: string;
}
export interface LedgerLineView {
  id: string;
  accountId: string;
  accountKind: string;
  accountCode: string;
  side: string;
  amount: number;
  balanceAfter?: number;
  createdAt: string;
}
export interface JournalView {
  id: string;
  kind: string;
  memo: string;
  createdAt: string;
  lines: LedgerLineView[];
}
export interface TransactionDetail {
  transaction: Transaction;
  journals: JournalView[];
}
export interface KycItem {
  id: string;
  userId: string;
  userName: string;
  type: string;
  documentNumber: string;
  status: string;
  submittedAt: string;
  failureReason?: string | null;
  documents?: string[];
}
export interface RegenerateSchoolTokenResult {
  school_id: string;
  temporary_password: string;
}
export interface School {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  state?: string;
  status: string;
  createdAt: string;
  studentCount?: number;
  activeLoans?: number;
  totalDisbursed?: number;
  apiToken?: string;
  logoUrl?: string;
}
export interface GiftCardOrder {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  productName: string;
  faceValue: string;
  status: string;
  price: number;
  providerOrderName?: string | null;
  codesStored: boolean;
  resolutionNote?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  completedAt?: string | null;
}
export interface NipTransfer {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  amount: number;
  fee: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  anchorTransferId?: string | null;
  stuckAlertedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface DeadOutbox {
  id: string;
  topic: string;
  payload: unknown;
  attempts: number;
  lastError?: string | null;
  createdAt: string;
}
export interface ComplianceFlag {
  id: string;
  userId: string;
  userName: string;
  phoneNumber: string;
  kind: string;
  detail: unknown;
  status: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}
export interface AuditLog {
  seq: number;
  id: string;
  actorType: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  ip: string;
  userAgent: string;
  data: unknown;
  createdAt: string;
  chainSeq: number;
  hash: string;
}
export interface AuditVerifyResult {
  checked: number;
  ok: boolean;
  firstBrokenChainSeq: number;
  firstBrokenAuditId: string;
}
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: "SUPPORT" | "OPS" | "COMPLIANCE" | "SUPER_ADMIN" | string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
}
export interface CreateAdminResult {
  admin: AdminUser;
  temporaryPassword: string;
}
export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}
export interface NotificationSettings {
  newUserRegistrations: boolean;
  loanApplications: boolean;
  kycSubmissions: boolean;
  systemAlerts: boolean;
  browserNotifications: boolean;
}
export interface SuccessResponse {
  success?: boolean;
  message?: string;
  eventId?: string;
  user?: User;
  loan?: Loan;
  kycItem?: KycItem;
  school?: School;
  profile?: Profile;
  settings?: NotificationSettings;
  [key: string]: unknown;
}
export interface CreateSchoolResponse {
  school?: School;
  school_user?: unknown;
  temporary_password?: string;
  success?: boolean;
  message?: string;
}
export interface LoginRequest {
  email: string;
  password: string;
  totpCode?: string;
}
export interface AdminSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
}
export interface ShellUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}
export interface LoginSuccessResponse {
  admin: AdminProfile;
  expiresIn: number;
}
export interface EnrollmentRequiredResponse {
  enrollmentRequired: true;
  enrollmentToken: string;
}
export type LoginResponse = LoginSuccessResponse | EnrollmentRequiredResponse;
export type LoginResult = LoginResponse;
export interface TOTPEnrollResponse {
  secret: string;
  otpauthUrl: string;
}
export interface AuthResponse {
  token: string;
  user: ShellUser;
}
export interface UserActivity {
  windowDays: number;
  transferProfile: {
    count: number;
    total: number;
    average: number;
    median: number;
    largest: number;
  };
  loginEvents: {
    occurredAt: string;
    outcome: string;
    deviceId: string | null;
    sourceIp: string | null;
    userAgent: string | null;
  }[];
}
export interface UsageAnalytics {
  windowDays: number;
  activeUsers?: number;
  avgLoginsPerActiveUser?: number;
  avgForegroundSessionSeconds?: number;
  medianForegroundSessionSeconds?: number;
  dailyActive: { date: string; users: number }[];
  featureUsage: { feature: string; events: number; users: number }[];
  flowUsage: {
    flow: string;
    started: number;
    completed: number;
    failed: number;
    abandoned: number;
    users: number;
    completionRate: number;
  }[];
}
export interface SupportMessage {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}
export interface SupportTicket {
  id: string;
  reference: string;
  category: string;
  subject: string;
  status: string;
  relatedReference: string | null;
  lastMessageAt: string;
  createdAt: string;
}
export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
  userId: string | null;
  contactPhone: string | null;
}
export interface CardMovement {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  cardId: string;
  last4?: string;
  direction: string;
  status: string;
  amountUsd: number;
  amount: number;
  resolutionNote?: string;
  resolvedBy?: string;
  createdAt: string;
  completedAt?: string;
}
export interface Promo {
  id: string;
  slug: string;
  title: string;
  body: string;
  artKey: string;
  ctaLabel: string;
  ctaRoute: string;
  endsAt: string | null;
  priority: number;
  active: boolean;
  startsAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
