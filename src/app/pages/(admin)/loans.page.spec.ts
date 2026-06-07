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
import { AdminService, Loan, Page } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("LoansPageComponent", () => {
  let component: LoansPageComponent;
  let fixture: ComponentFixture<LoansPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;

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
          content: mockLoans,
          totalElements: 2,
          totalPages: 1,
          size: 50,
          number: 0,
          first: true,
          last: true,
        } as Page<Loan>),
      ),
      getOverdueLoans: vi.fn().mockReturnValue(
        of({
          content: [],
          totalElements: 0,
          totalPages: 1,
          size: 20,
          number: 0,
          first: true,
          last: true,
        } as Page<Loan>),
      ),
      approveLoan: vi.fn().mockReturnValue(of({ success: true })),
      rejectLoan: vi.fn().mockReturnValue(of({ success: true })),
    };

    const mockToastService = {
      show: vi.fn(),
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
      content: mockLoans,
      totalElements: 2,
      totalPages: 1,
      size: 50,
      number: 0,
      first: true,
      last: true,
    });
    queryClient.setQueryData(["loans", { status: "PENDING" }], {
      content: [mockLoans[0]],
      totalElements: 1,
      totalPages: 1,
      size: 50,
      number: 0,
      first: true,
      last: true,
    });
    queryClient.setQueryData(["loans-overdue"], {
      content: [],
      totalElements: 0,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LoansPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
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
    expect(component.totalPortfolio()).toBe(450000);
    expect(component.disbursedTotal()).toBe(300000);
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
    await component.approveMutation.mutateAsync("loan-1");
    expect(adminService.approveLoan).toHaveBeenCalledWith("loan-1");
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "Loan loan-1 approved",
    );

    await component.rejectMutation.mutateAsync("loan-1");
    expect(adminService.rejectLoan).toHaveBeenCalledWith(
      "loan-1",
      "Rejected by operations",
    );
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "Loan loan-1 rejected",
    );
  });

  it("should trigger toast details when viewing loan info", () => {
    component.viewLoan(mockLoans[0]!);
    expect(toastService.show).toHaveBeenCalledWith(
      "info",
      "Viewing loan: loan-1",
    );
  });
});
