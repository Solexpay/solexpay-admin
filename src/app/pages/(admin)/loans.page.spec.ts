import "../../../test";
import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  tick,
  flush,
} from "@angular/core/testing";
import {
  provideQueryClient,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { LoansPageComponent } from "./loans.page";
import { AdminService, Loan } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { ConfirmService } from "../../services/confirm.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("LoansPageComponent", () => {
  let component: LoansPageComponent;
  let fixture: ComponentFixture<LoansPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;
  let confirmService: { ask: ReturnType<typeof vi.fn> };

  const mockLoans: Loan[] = [
    {
      id: "loan-1",
      userId: "usr-1",
      userName: "John Doe",
      schoolName: "University of Ibadan",
      amount: 150000,
      interestRate: 5,
      tenorMonths: 12,
      monthlyRepayment: 13125,
      status: "PENDING",
      purpose: "Tuition Fee",
      appliedAt: "2026-06-06T12:00:00Z",
      creditScore: 750,
    },
    {
      id: "loan-2",
      userId: "usr-2",
      userName: "Jane Smith",
      schoolName: "Unilag",
      amount: 300000,
      interestRate: 6,
      tenorMonths: 18,
      monthlyRepayment: 18200,
      status: "DISBURSED",
      purpose: "Textbooks",
      appliedAt: "2026-06-06T13:00:00Z",
      creditScore: 680,
    },
  ];

  beforeEach(() => {
    const mockAdminService = {
      getLoans: vi.fn().mockReturnValue(
        of({
          items: mockLoans,
          nextCursor: null,
          hasMore: false,
        }),
      ),
      getOverdueLoans: vi.fn().mockReturnValue(
        of({
          items: [],
          nextCursor: null,
          hasMore: false,
        }),
      ),
      getDashboardMetrics: vi
        .fn()
        .mockReturnValue(
          of({ totalLoanPortfolio: 450000, activeLoans: 1, overdueLoans: 0 }),
        ),
      approveLoan: vi.fn().mockReturnValue(of({ success: true })),
      rejectLoan: vi.fn().mockReturnValue(of({ success: true })),
    };

    const mockToastService = {
      show: vi.fn(),
    };
    confirmService = {
      ask: vi.fn().mockResolvedValue({ reason: "Test reason" }),
    };

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    queryClient.setQueryData(["loans", { status: "ALL" }], {
      items: mockLoans,
      nextCursor: null,
      hasMore: false,
    });
    queryClient.setQueryData(["loans", { status: "PENDING" }], {
      items: [mockLoans[0]],
      nextCursor: null,
      hasMore: false,
    });
    queryClient.setQueryData(["dashboard-metrics"], {
      totalLoanPortfolio: 450000,
      activeLoans: 1,
      overdueLoans: 0,
    });
    queryClient.setQueryData(["loans-overdue"], {
      items: [],
      nextCursor: null,
      hasMore: false,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LoansPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmService, useValue: confirmService },
      ],
    });

    fixture = TestBed.createComponent(LoansPageComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should load loans data and compute metrics properly", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.loans()).toEqual(mockLoans);
    expect(component.pendingCount()).toBe(1);
    expect(component.dashboardQuery.data()?.totalLoanPortfolio).toBe(450000);
    expect(component.dashboardQuery.data()?.activeLoans).toBe(1);
  }));

  it("should filter locally by statusFilter tab", fakeAsync(() => {
    tick(10000);
    flush();

    component.statusFilter.set("PENDING");
    fixture.detectChanges();
    tick(10000);
    flush();
    expect(component.filteredLoans().length).toBe(1);
    expect(component.filteredLoans()[0]!.id).toBe("loan-1");
  }));

  it("should call mutations correctly on actions", async () => {
    await component.approve(mockLoans[0]!);
    await vi.waitFor(() =>
      expect(adminService.approveLoan).toHaveBeenCalledWith("loan-1"),
    );
    expect(adminService.approveLoan).toHaveBeenCalledWith("loan-1");
    await vi.waitFor(() =>
      expect(toastService.show).toHaveBeenCalledWith(
        "success",
        "Loan approved for John Doe",
      ),
    );

    await component.reject(mockLoans[0]!);
    await vi.waitFor(() =>
      expect(adminService.rejectLoan).toHaveBeenCalledWith(
        "loan-1",
        "Test reason",
      ),
    );
    expect(adminService.rejectLoan).toHaveBeenCalledWith(
      "loan-1",
      "Test reason",
    );
    await vi.waitFor(() =>
      expect(toastService.show).toHaveBeenCalledWith(
        "success",
        "Loan rejected for John Doe",
      ),
    );
  });

  it("should not approve a loan when confirmation is cancelled", async () => {
    confirmService.ask.mockResolvedValueOnce(null);
    await component.approve(mockLoans[0]!);
    expect(adminService.approveLoan).not.toHaveBeenCalled();
  });

  it("should open the selected loan detail modal", () => {
    component.viewLoan(mockLoans[0]!);
    expect(component.selectedLoan()).toEqual(mockLoans[0]);
  });
});
