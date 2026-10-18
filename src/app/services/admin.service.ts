import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

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

/** Backward-compatibility alias for tests and components */
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

const BFF = "/api";

function buildHttpParams(
  filters: Record<string, string | number | boolean | null | undefined>,
): HttpParams {
  let params = new HttpParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null && val !== "") {
      params = params.set(key, String(val).trim());
    }
  }
  return params;
}

@Injectable({ providedIn: "root" })
export class AdminService {
  private http = inject(HttpClient);

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${BFF}/admin/dashboard`);
  }

  getUsers(
    paramsOrPage?:
      | {
          search?: string;
          phoneNumber?: string;
          status?: string;
          kycTier?: string;
          limit?: number;
          cursor?: string | null;
        }
      | number,
    size = 20,
    search?: string,
    status?: string,
  ): Observable<CursorPage<User>> {
    if (typeof paramsOrPage === "object") {
      const params = buildHttpParams(paramsOrPage);
      return this.http.get<CursorPage<User>>(`${BFF}/admin/users`, { params });
    }

    const paramsObj: Record<
      string,
      string | number | boolean | null | undefined
    > = { limit: size };
    if (search) paramsObj["phoneNumber"] = search;
    if (status) paramsObj["status"] = status;

    return this.http.get<CursorPage<User>>(`${BFF}/admin/users`, {
      params: buildHttpParams(paramsObj),
    });
  }

  getUserDetail(userId: string): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${BFF}/admin/users/${userId}`);
  }

  suspendUser(
    userId: string,
    reason = "Suspended by admin",
  ): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/users/${userId}/suspend`,
      { reason },
    );
  }

  reactivateUser(userId: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/users/${userId}/reactivate`,
      {},
    );
  }

  getLoans(
    paramsOrPage?:
      | {
          status?: string;
          limit?: number;
          cursor?: string | null;
        }
      | number,
    size = 50,
    status?: string,
  ): Observable<CursorPage<Loan>> {
    if (typeof paramsOrPage === "object") {
      return this.http.get<CursorPage<Loan>>(`${BFF}/admin/loans`, {
        params: buildHttpParams(paramsOrPage),
      });
    }

    const paramsObj: Record<
      string,
      string | number | boolean | null | undefined
    > = { limit: size };
    if (status) paramsObj["status"] = status;

    return this.http.get<CursorPage<Loan>>(`${BFF}/admin/loans`, {
      params: buildHttpParams(paramsObj),
    });
  }

  getOverdueLoans(
    paramsOrPage?:
      | {
          limit?: number;
          cursor?: string | null;
        }
      | number,
    size = 20,
  ): Observable<CursorPage<Loan>> {
    if (typeof paramsOrPage === "object") {
      return this.http.get<CursorPage<Loan>>(`${BFF}/admin/loans/overdue`, {
        params: buildHttpParams(paramsOrPage),
      });
    }

    return this.http.get<CursorPage<Loan>>(`${BFF}/admin/loans/overdue`, {
      params: buildHttpParams({ limit: size }),
    });
  }

  getOpsPendingLoans(filter?: {
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<Loan>> {
    const params = buildHttpParams(filter || {});
    return this.http.get<CursorPage<Loan>>(`${BFF}/loans/ops-pending`, {
      params,
    });
  }

  approveLoan(
    loanId: string,
    coolingOffHours = 24,
  ): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/loans/${loanId}/ops-approve`,
      {
        reviewedBy: "OPS",
        coolingOffHours,
      },
    );
  }

  rejectLoan(
    loanId: string,
    rejectionReason: string,
  ): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/loans/${loanId}/ops-reject`,
      {
        reviewedBy: "OPS",
        rejectionReason,
      },
    );
  }

  getTransactions(
    paramsOrPage?:
      | {
          status?: string;
          type?: string;
          userId?: string;
          reference?: string;
          from?: string;
          to?: string;
          limit?: number;
          cursor?: string | null;
        }
      | number,
    size = 50,
    status?: string,
    type?: string,
  ): Observable<CursorPage<Transaction>> {
    if (typeof paramsOrPage === "object") {
      return this.http.get<CursorPage<Transaction>>(
        `${BFF}/admin/transactions`,
        {
          params: buildHttpParams(paramsOrPage),
        },
      );
    }

    const paramsObj: Record<
      string,
      string | number | boolean | null | undefined
    > = { limit: size };
    if (status) paramsObj["status"] = status;
    if (type) paramsObj["type"] = type;

    return this.http.get<CursorPage<Transaction>>(`${BFF}/admin/transactions`, {
      params: buildHttpParams(paramsObj),
    });
  }

  getTransaction(id: string): Observable<TransactionDetail> {
    return this.http.get<TransactionDetail>(`${BFF}/admin/transactions/${id}`);
  }

  getKycQueue(
    statusOrFilter:
      | string
      | {
          status?: string;
          limit?: number;
          cursor?: string | null;
        } = "PENDING",
    size = 50,
  ): Observable<CursorPage<KycItem>> {
    if (typeof statusOrFilter === "object") {
      return this.http.get<CursorPage<KycItem>>(`${BFF}/admin/kyc`, {
        params: buildHttpParams(statusOrFilter),
      });
    }

    const paramsObj = { status: statusOrFilter, limit: size };
    return this.http.get<CursorPage<KycItem>>(`${BFF}/admin/kyc`, {
      params: buildHttpParams(paramsObj),
    });
  }

  approveKyc(verificationId: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/kyc/${verificationId}/approve`,
      {},
    );
  }

  rejectKyc(
    verificationId: string,
    reason = "Rejected by admin",
  ): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/kyc/${verificationId}/reject`,
      { reason },
    );
  }

  broadcastNotification(
    title: string,
    message: string,
    targetAudience = "ALL",
    idempotencyKey?: string,
  ): Observable<SuccessResponse> {
    const key =
      idempotencyKey ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "idemp-" + Date.now());
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/broadcast`,
      { title, message, targetAudience },
      {
        headers: {
          "X-Idempotency-Key": key,
        },
      },
    );
  }

  // Partner Schools
  getSchools(filter?: {
    status?: string;
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<School>> {
    const params = buildHttpParams(filter || {});
    return this.http.get<CursorPage<School>>(`${BFF}/admin/schools`, {
      params,
    });
  }

  addSchool(school: Partial<School>): Observable<School> {
    return this.http.post<School>(`${BFF}/admin/schools`, school);
  }

  regenerateSchoolToken(schoolId: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/schools/${schoolId}/regenerate-token`,
      {},
    );
  }

  toggleSchoolStatus(
    schoolId: string,
    status: string,
  ): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/schools/${schoolId}/toggle-status`,
      { status },
    );
  }

  // Gift Card / Gaming Orders
  getGamingOrders(filter?: {
    status?: string;
    userId?: string;
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<GiftCardOrder>> {
    const params = buildHttpParams({
      status: "UNKNOWN",
      ...(filter || {}),
    });
    return this.http.get<CursorPage<GiftCardOrder>>(
      `${BFF}/admin/gaming/orders`,
      { params },
    );
  }

  getGamingOrder(id: string): Observable<GiftCardOrder> {
    return this.http.get<GiftCardOrder>(`${BFF}/admin/gaming/orders/${id}`);
  }

  getGiftCardOrders(filter?: {
    status?: string;
    userId?: string;
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<GiftCardOrder>> {
    return this.getGamingOrders(filter);
  }

  getGiftCardOrder(id: string): Observable<GiftCardOrder> {
    return this.getGamingOrder(id);
  }

  resolveDeliveredGamingOrder(
    id: string,
    payload?: { codes?: string[]; note?: string },
  ): Observable<GiftCardOrder | SuccessResponse> {
    return this.http.post<GiftCardOrder | SuccessResponse>(
      `${BFF}/admin/gaming/orders/${id}/resolve-delivered`,
      payload || {},
    );
  }

  resolveGiftCardDelivered(
    id: string,
    payload?: { codes?: string[]; note?: string },
  ): Observable<GiftCardOrder | SuccessResponse> {
    return this.resolveDeliveredGamingOrder(id, payload);
  }

  resolveFailedGamingOrder(
    id: string,
    payload: { note: string },
  ): Observable<GiftCardOrder | SuccessResponse> {
    return this.http.post<GiftCardOrder | SuccessResponse>(
      `${BFF}/admin/gaming/orders/${id}/resolve-failed`,
      payload,
    );
  }

  resolveGiftCardFailed(
    id: string,
    payload: { note: string },
  ): Observable<GiftCardOrder | SuccessResponse> {
    return this.resolveFailedGamingOrder(id, payload);
  }

  // NIP Transfers
  getNipTransfers(filter?: {
    status?: string;
    userId?: string;
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<NipTransfer>> {
    const params = buildHttpParams({
      status: "PENDING",
      ...(filter || {}),
    });
    return this.http.get<CursorPage<NipTransfer>>(
      `${BFF}/admin/nip/transfers`,
      { params },
    );
  }

  getNipTransfer(id: string): Observable<NipTransfer> {
    return this.http.get<NipTransfer>(`${BFF}/admin/nip/transfers/${id}`);
  }

  // Ops Console
  getDeadOutbox(filter?: {
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<DeadOutbox>> {
    const params = buildHttpParams(filter || {});
    return this.http.get<CursorPage<DeadOutbox>>(
      `${BFF}/admin/ops/outbox/dead`,
      { params },
    );
  }

  requeueOutbox(id: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/ops/outbox/${id}/requeue`,
      {},
    );
  }

  requeueDeadOutbox(id: string): Observable<SuccessResponse> {
    return this.requeueOutbox(id);
  }

  getComplianceFlags(filter?: {
    status?: string;
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<ComplianceFlag>> {
    const params = buildHttpParams(filter || {});
    return this.http.get<CursorPage<ComplianceFlag>>(
      `${BFF}/admin/ops/compliance-flags`,
      { params },
    );
  }

  resolveComplianceFlag(id: string, note: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/ops/compliance-flags/${id}/resolve`,
      { note },
    );
  }

  // Audit Logs
  getAuditLogs(filter?: {
    actorId?: string;
    actorType?: string;
    action?: string;
    entityId?: string;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<AuditLog>> {
    const params = buildHttpParams(filter || {});
    return this.http.get<CursorPage<AuditLog>>(`${BFF}/admin/audit`, {
      params,
    });
  }

  verifyAuditChain(
    fromSeq?: number,
    toSeq?: number,
  ): Observable<AuditVerifyResult> {
    const paramsObj: Record<
      string,
      string | number | boolean | null | undefined
    > = {};
    if (fromSeq !== undefined && fromSeq !== null)
      paramsObj["fromSeq"] = fromSeq;
    if (toSeq !== undefined && toSeq !== null) paramsObj["toSeq"] = toSeq;

    return this.http.get<AuditVerifyResult>(`${BFF}/admin/audit/verify`, {
      params: buildHttpParams(paramsObj),
    });
  }

  // Admins Management (SUPER_ADMIN only)
  getAdmins(filter?: {
    role?: string;
    status?: string;
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<AdminUser>> {
    const params = buildHttpParams(filter || {});
    return this.http.get<CursorPage<AdminUser>>(`${BFF}/admin/admins`, {
      params,
    });
  }

  getAdminUsers(filter?: {
    role?: string;
    status?: string;
    limit?: number;
    cursor?: string | null;
  }): Observable<CursorPage<AdminUser>> {
    return this.getAdmins(filter);
  }

  createAdmin(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }): Observable<CreateAdminResult> {
    return this.http.post<CreateAdminResult>(`${BFF}/admin/admins`, data);
  }

  createAdminUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }): Observable<CreateAdminResult> {
    return this.createAdmin(data);
  }

  disableAdmin(id: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/admins/${id}/disable`,
      {},
    );
  }

  disableAdminUser(id: string): Observable<SuccessResponse> {
    return this.disableAdmin(id);
  }

  resetAdminTOTP(id: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/admins/${id}/reset-totp`,
      {},
    );
  }

  resetAdminTotp(id: string): Observable<SuccessResponse> {
    return this.resetAdminTOTP(id);
  }

  // Profile Settings
  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${BFF}/admin/profile`);
  }

  updateProfile(profile: Partial<Profile>): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(`${BFF}/admin/profile`, profile);
  }

  // Notification Preferences
  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(
      `${BFF}/admin/settings/notifications`,
    );
  }

  updateNotificationSettings(
    settings: Partial<NotificationSettings>,
  ): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(
      `${BFF}/admin/settings/notifications`,
      settings,
    );
  }
}
