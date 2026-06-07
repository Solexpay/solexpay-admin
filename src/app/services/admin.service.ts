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

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

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
  userId: string;
  userName: string;
  schoolName: string;
  amount: number;
  interestRate: number;
  tenorMonths: number;
  monthlyRepayment: number;
  status: string;
  purpose: string;
  appliedAt: string;
  creditScore: number;
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
export interface KycItem {
  id: string;
  userId: string;
  userName: string;
  type: string;
  documentNumber: string;
  status: string;
  submittedAt: string;
  documents: string[];
}
export interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  studentCount: number;
  activeLoans: number;
  totalDisbursed: number;
  status: string;
  apiToken: string;
  createdAt: string;
  logoUrl: string;
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
  success: boolean;
  message?: string;
  user?: User;
  loan?: Loan;
  kycItem?: KycItem;
  school?: School;
  profile?: Profile;
  settings?: NotificationSettings;
}

// All calls go to the AnalogJS BFF (Nitro) — the backend URL never reaches the browser
const BFF = "/api";

@Injectable({ providedIn: "root" })
export class AdminService {
  private http = inject(HttpClient);

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${BFF}/admin/dashboard`);
  }

  getUsers(
    page = 0,
    size = 20,
    search?: string,
    status?: string,
  ): Observable<Page<User>> {
    let params = new HttpParams().set("page", page).set("size", size);
    if (search) params = params.set("phoneNumber", search);
    if (status) params = params.set("status", status);
    return this.http.get<Page<User>>(`${BFF}/admin/users`, { params });
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
      null,
      {
        params: new HttpParams().set("reason", reason),
      },
    );
  }

  reactivateUser(userId: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/users/${userId}/reactivate`,
      null,
    );
  }

  getLoans(page = 0, size = 50, status?: string): Observable<Page<Loan>> {
    let params = new HttpParams().set("page", page).set("size", size);
    if (status) params = params.set("status", status);
    return this.http.get<Page<Loan>>(`${BFF}/admin/loans`, { params });
  }

  getOverdueLoans(page = 0, size = 20): Observable<Page<Loan>> {
    const params = new HttpParams().set("page", page).set("size", size);
    return this.http.get<Page<Loan>>(`${BFF}/admin/loans/overdue`, { params });
  }

  approveLoan(loanId: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/loans/${loanId}/ops-approve`,
      {
        reviewedBy: "OPS",
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
    page = 0,
    size = 50,
    status?: string,
    type?: string,
  ): Observable<Page<Transaction>> {
    let params = new HttpParams().set("page", page).set("size", size);
    if (status) params = params.set("status", status);
    if (type) params = params.set("type", type);
    return this.http.get<Page<Transaction>>(`${BFF}/admin/transactions`, {
      params,
    });
  }

  getKycQueue(
    status = "PENDING",
    page = 0,
    size = 50,
  ): Observable<Page<KycItem>> {
    const params = new HttpParams()
      .set("status", status)
      .set("page", page)
      .set("size", size);
    return this.http.get<Page<KycItem>>(`${BFF}/admin/kyc`, { params });
  }

  approveKyc(verificationId: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/kyc/${verificationId}/approve`,
      null,
    );
  }

  rejectKyc(
    verificationId: string,
    reason = "Rejected by admin",
  ): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/kyc/${verificationId}/reject`,
      {
        reason,
      },
    );
  }

  broadcastNotification(
    title: string,
    message: string,
    targetAudience = "ALL_USERS",
  ): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(`${BFF}/admin/broadcast`, {
      title,
      message,
      targetAudience,
    });
  }

  // Partner Schools
  getSchools(): Observable<School[]> {
    return this.http.get<School[]>(`${BFF}/admin/schools`);
  }

  addSchool(school: Partial<School>): Observable<School> {
    return this.http.post<School>(`${BFF}/admin/schools`, school);
  }

  regenerateSchoolToken(schoolId: string): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/schools/${schoolId}/regenerate-token`,
      null,
    );
  }

  toggleSchoolStatus(
    schoolId: string,
    status: string,
  ): Observable<SuccessResponse> {
    return this.http.post<SuccessResponse>(
      `${BFF}/admin/schools/${schoolId}/toggle-status`,
      {
        status,
      },
    );
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
