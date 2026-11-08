import { apiGet, apiPost, apiPut } from "../http";
import type {
  AdminUser,
  AuditLog,
  AuditVerifyResult,
  CardMovement,
  ComplianceFlag,
  CreateAdminResult,
  CursorPage,
  DashboardMetrics,
  DeadOutbox,
  GiftCardOrder,
  KycItem,
  Loan,
  NipTransfer,
  NotificationSettings,
  Profile,
  Promo,
  School,
  SuccessResponse,
  SupportTicket,
  SupportTicketDetail,
  Transaction,
  TransactionDetail,
  UsageAnalytics,
  User,
  UserActivity,
  UserDetail,
} from "../types";

type Filters = Record<string, string | number | boolean | null | undefined>;

export const getDashboardMetrics = () =>
  apiGet<DashboardMetrics>("/admin/dashboard/metrics");
export function getUsers(
  paramsOrPage?: Filters | number,
  size = 20,
  search?: string,
  status?: string,
): Promise<CursorPage<User>> {
  return apiGet(
    "/admin/users",
    typeof paramsOrPage === "object"
      ? paramsOrPage
      : { limit: size, phoneNumber: search, status },
  );
}
export const getUserDetail = (userId: string) =>
  apiGet<UserDetail>(`/admin/users/${encodeURIComponent(userId)}`);
export const getUserActivity = (userId: string) =>
  apiGet<UserActivity>(`/admin/users/${encodeURIComponent(userId)}/activity`);
export const suspendUser = (userId: string, reason = "Suspended by admin") =>
  apiPost<SuccessResponse>(
    `/admin/users/${encodeURIComponent(userId)}/suspend`,
    { reason },
  );
export const reactivateUser = (userId: string) =>
  apiPost<SuccessResponse>(
    `/admin/users/${encodeURIComponent(userId)}/reactivate`,
    {},
  );
export function getLoans(
  paramsOrPage?: Filters | number,
  size = 50,
  status?: string,
): Promise<CursorPage<Loan>> {
  return apiGet(
    "/admin/loans",
    typeof paramsOrPage === "object" ? paramsOrPage : { limit: size, status },
  );
}
export function getOverdueLoans(
  paramsOrPage?: Filters | number,
  size = 20,
): Promise<CursorPage<Loan>> {
  return apiGet(
    "/admin/loans/overdue",
    typeof paramsOrPage === "object" ? paramsOrPage : { limit: size },
  );
}
export const getOpsPendingLoans = (filter?: Filters) =>
  apiGet<CursorPage<Loan>>("/loans/ops-pending", filter);
export const approveLoan = (loanId: string, coolingOffHours = 24) =>
  apiPost<SuccessResponse>(`/loans/${encodeURIComponent(loanId)}/ops-approve`, {
    reviewedBy: "OPS",
    coolingOffHours,
  });
export const rejectLoan = (loanId: string, rejectionReason: string) =>
  apiPost<SuccessResponse>(`/loans/${encodeURIComponent(loanId)}/ops-reject`, {
    reviewedBy: "OPS",
    rejectionReason,
  });
export function getTransactions(
  paramsOrPage?: Filters | number,
  size = 50,
  status?: string,
  type?: string,
): Promise<CursorPage<Transaction>> {
  return apiGet(
    "/admin/transactions",
    typeof paramsOrPage === "object"
      ? paramsOrPage
      : { limit: size, status, type },
  );
}
export const getTransaction = (id: string) =>
  apiGet<TransactionDetail>(`/admin/transactions/${encodeURIComponent(id)}`);
export function getKycQueue(
  statusOrFilter: string | Filters = "PENDING",
  size = 50,
): Promise<CursorPage<KycItem>> {
  return apiGet(
    "/admin/kyc",
    typeof statusOrFilter === "object"
      ? statusOrFilter
      : { status: statusOrFilter, limit: size },
  );
}
export const approveKyc = (verificationId: string) =>
  apiPost<SuccessResponse>(
    `/admin/kyc/${encodeURIComponent(verificationId)}/approve`,
    {},
  );
export const rejectKyc = (
  verificationId: string,
  reason = "Rejected by admin",
) =>
  apiPost<SuccessResponse>(
    `/admin/kyc/${encodeURIComponent(verificationId)}/reject`,
    { reason },
  );
export function broadcastNotification(
  title: string,
  message: string,
  targetAudience = "ALL",
  idempotencyKey?: string,
): Promise<SuccessResponse> {
  const key =
    idempotencyKey ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idemp-${Date.now()}`);
  return apiPost(
    "/admin/broadcast",
    { title, message, targetAudience },
    { idempotencyKey: key },
  );
}
export const getSchools = (filter?: Filters) =>
  apiGet<CursorPage<School>>("/admin/schools", filter);
export const addSchool = (school: Partial<School>) =>
  apiPost<School>("/admin/schools", school);
export const regenerateSchoolToken = (schoolId: string) =>
  apiPost<{ school_id: string; temporary_password: string }>(
    `/admin/schools/${encodeURIComponent(schoolId)}/regenerate-token`,
    {},
  );
export const toggleSchoolStatus = (schoolId: string, status: string) =>
  apiPost<SuccessResponse>(
    `/admin/schools/${encodeURIComponent(schoolId)}/toggle-status`,
    { status },
  );
/** Body for PUT /admin/schools/:id/logo — exactly one mode. */
export type SchoolLogoUpdate =
  | { domain: string }
  | { logoUrl: string }
  | { clear: true };
export const setSchoolLogo = (schoolId: string, update: SchoolLogoUpdate) =>
  apiPut<School>(`/admin/schools/${encodeURIComponent(schoolId)}/logo`, update);
export const refreshSchoolLogo = (schoolId: string, force = false) =>
  apiPost<School>(
    `/admin/schools/${encodeURIComponent(schoolId)}/logo/refresh`,
    { force },
  );
export const backfillSchoolLogos = () =>
  apiPost<{ resolved: number; failed: number }>(
    "/admin/schools/logos/backfill",
    {},
  );
export const getGamingOrders = (filter?: Filters) =>
  apiGet<CursorPage<GiftCardOrder>>("/admin/gaming/orders", {
    status: "UNKNOWN",
    ...filter,
  });
export const getGamingOrder = (id: string) =>
  apiGet<GiftCardOrder>(`/admin/gaming/orders/${encodeURIComponent(id)}`);
export const getGiftCardOrders = getGamingOrders;
export const resolveDeliveredGamingOrder = (
  id: string,
  payload?: { codes?: string[]; note?: string },
) =>
  apiPost<GiftCardOrder | SuccessResponse>(
    `/admin/gaming/orders/${encodeURIComponent(id)}/resolve-delivered`,
    payload ?? {},
  );
export const resolveGiftCardDelivered = resolveDeliveredGamingOrder;
export const resolveFailedGamingOrder = (
  id: string,
  payload: { note: string },
) =>
  apiPost<GiftCardOrder | SuccessResponse>(
    `/admin/gaming/orders/${encodeURIComponent(id)}/resolve-failed`,
    payload,
  );
export const resolveGiftCardFailed = resolveFailedGamingOrder;
export const getNipTransfers = (filter?: Filters) =>
  apiGet<CursorPage<NipTransfer>>("/admin/nip/transfers", {
    status: "PENDING",
    ...filter,
  });
export const getNipTransfer = (id: string) =>
  apiGet<NipTransfer>(`/admin/nip/transfers/${encodeURIComponent(id)}`);
export const getDeadOutbox = (filter?: Filters) =>
  apiGet<CursorPage<DeadOutbox>>("/admin/ops/outbox/dead", filter);
export const requeueOutbox = (id: string) =>
  apiPost<SuccessResponse>(
    `/admin/ops/outbox/${encodeURIComponent(id)}/requeue`,
    {},
  );
export const getComplianceFlags = (filter?: Filters) =>
  apiGet<CursorPage<ComplianceFlag>>("/admin/ops/compliance-flags", filter);
export const resolveComplianceFlag = (id: string, note: string) =>
  apiPost<SuccessResponse>(
    `/admin/ops/compliance-flags/${encodeURIComponent(id)}/resolve`,
    { note },
  );
export const getAuditLogs = (filter?: Filters) =>
  apiGet<CursorPage<AuditLog>>("/admin/audit", filter);
export const verifyAuditChain = (fromSeq?: number, toSeq?: number) =>
  apiGet<AuditVerifyResult>("/admin/audit/verify", { fromSeq, toSeq });
export const getAdmins = (filter?: Filters) =>
  apiGet<CursorPage<AdminUser>>("/admin/admins", filter);
export const getAdminUsers = getAdmins;
export const createAdmin = (data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
}) => apiPost<CreateAdminResult>("/admin/admins", data);
export const createAdminUser = createAdmin;
export const disableAdmin = (id: string) =>
  apiPost<SuccessResponse>(
    `/admin/admins/${encodeURIComponent(id)}/disable`,
    {},
  );
export const resetAdminTOTP = (id: string) =>
  apiPost<SuccessResponse>(
    `/admin/admins/${encodeURIComponent(id)}/reset-totp`,
    {},
  );
export const getProfile = () => apiGet<Profile>("/admin/profile");
export const updateProfile = (profile: Partial<Profile>) =>
  apiPut<SuccessResponse>("/admin/profile", profile);
export const changePassword = (currentPassword: string, newPassword: string) =>
  apiPost<SuccessResponse>("/admin/profile/password", {
    currentPassword,
    newPassword,
  });
export const getNotificationSettings = () =>
  apiGet<NotificationSettings>("/admin/settings/notifications");
export const updateNotificationSettings = (
  settings: Partial<NotificationSettings>,
) => apiPut<SuccessResponse>("/admin/settings/notifications", settings);
export const getUsageAnalytics = (params?: { days?: number }) =>
  apiGet<UsageAnalytics>("/admin/analytics/usage", params);
export const listSupportTickets = (params?: Filters) =>
  apiGet<CursorPage<SupportTicket>>("/admin/support/tickets", params);
export const getSupportTicket = (id: string) =>
  apiGet<SupportTicketDetail>(
    `/admin/support/tickets/${encodeURIComponent(id)}`,
  );
export const replySupportTicket = (id: string, body: string) =>
  apiPost<SupportTicketDetail>(
    `/admin/support/tickets/${encodeURIComponent(id)}/messages`,
    { message: body },
  );
export const setSupportTicketStatus = (id: string, status: string) =>
  apiPost<SupportTicketDetail>(
    `/admin/support/tickets/${encodeURIComponent(id)}/status`,
    { status },
  );
export const listCardMovements = (params?: Filters) =>
  apiGet<CursorPage<CardMovement>>("/admin/cards/movements", params);
export const getCardMovement = (id: string) =>
  apiGet<CardMovement>(`/admin/cards/movements/${encodeURIComponent(id)}`);
export const resolveCardMovementCompleted = (
  id: string,
  body?: { note: string },
) =>
  apiPost<CardMovement>(
    `/admin/cards/movements/${encodeURIComponent(id)}/resolve-completed`,
    body,
  );
export const resolveCardMovementFailed = (
  id: string,
  body?: { note: string },
) =>
  apiPost<CardMovement>(
    `/admin/cards/movements/${encodeURIComponent(id)}/resolve-failed`,
    body,
  );
export const listPromos = (_params?: Filters) =>
  apiGet<Promo[]>("/admin/promos");
export const createPromo = (body: {
  slug: string;
  title: string;
  body: string;
  artKey: string;
  ctaLabel: string;
  ctaRoute: string;
  priority?: number;
  startsAt?: string;
  endsAt?: string | null;
}) => apiPost<Promo>("/admin/promos", body);
export const updatePromo = (
  id: string,
  body: {
    title: string;
    body: string;
    artKey: string;
    ctaLabel: string;
    ctaRoute: string;
    priority: number;
    startsAt: string;
    endsAt: string | null;
    active: boolean;
  },
) => apiPut<Promo>(`/admin/promos/${encodeURIComponent(id)}`, body);
export const deactivatePromo = (id: string) =>
  apiPost<Promo>(`/admin/promos/${encodeURIComponent(id)}/deactivate`, {});
