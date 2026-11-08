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
import { TransactionsPageComponent } from "./transactions.page";
import { AdminService, Transaction } from "../../services/admin.service";
import { of } from "rxjs";
import { vi } from "vitest";
import { provideRouter } from "@angular/router";

describe("TransactionsPageComponent", () => {
  let component: TransactionsPageComponent;
  let fixture: ComponentFixture<TransactionsPageComponent>;
  let adminService: AdminService;

  const mockTransactions: Transaction[] = [
    {
      id: "tx1",
      type: "WALLET_FUNDING",
      amount: 15000,
      status: "SUCCESS",
      senderName: "John Doe",
      recipientName: "Wallet",
      reference: "REF-001",
      description: "Wallet topup",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tx2",
      type: "LOAN_DISBURSEMENT",
      amount: 250000,
      status: "FAILED",
      senderName: "Solexpay",
      recipientName: "Jane Smith",
      reference: "REF-002",
      description: "Business loan",
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    const mockAdminService = {
      getTransactions: vi.fn().mockReturnValue(
        of({
          items: mockTransactions,
          nextCursor: null,
          hasMore: false,
        }),
      ),
      getDashboardMetrics: vi
        .fn()
        .mockReturnValue(
          of({ transactionVolumeToday: 265000, transactionCountToday: 7 }),
        ),
      getTransaction: vi
        .fn()
        .mockReturnValue(
          of({ transaction: mockTransactions[0], journals: [] }),
        ),
    };

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    queryClient.setQueryData(
      [
        "transactions",
        { status: "", type: "", reference: "", from: "", to: "" },
      ],
      {
        items: mockTransactions,
        nextCursor: null,
        hasMore: false,
      },
    );
    queryClient.setQueryData(["dashboard-metrics"], {
      transactionVolumeToday: 265000,
      transactionCountToday: 7,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TransactionsPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(TransactionsPageComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch transactions and send server-side filter parameters", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.transactions()).toEqual(mockTransactions);

    component.onTypeChange("WALLET_FUNDING");
    fixture.detectChanges();
    component.onStatusChange("FAILED");
    fixture.detectChanges();
    component.onDateFromChange("2026-10-19");
    component.onDateToChange("2026-10-19");
    tick(10000);
    flush();

    expect(adminService.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ type: "WALLET_FUNDING", status: "FAILED" }),
    );
  }));

  it("should calculate today cards from dashboard metrics", fakeAsync(() => {
    tick(10000);
    flush();

    // Seeded into the shared dashboard-metrics cache, so no refetch happens.
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Transactions today");
    expect(component.metricsQuery.data()?.transactionVolumeToday).toBe(265000);
    expect(component.metricsQuery.data()?.transactionCountToday).toBe(7);
  }));

  it("should send date filters as RFC3339 Lagos day boundaries", fakeAsync(() => {
    component.onDateFromChange("2026-10-19");
    component.onDateToChange("2026-10-19");
    fixture.detectChanges();
    tick(10000);
    flush();

    expect(adminService.getTransactions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        from: "2026-10-19T00:00:00+01:00",
        to: "2026-10-19T23:59:59.999+01:00",
      }),
    );
  }));

  it("should debounce reference search and send the reference to the server", () => {
    vi.useFakeTimers();
    component.onSearch(" REF-001 ");
    expect(component.referenceFilter()).toBe("");
    vi.advanceTimersByTime(300);
    expect(component.referenceFilter()).toBe("REF-001");
    fixture.detectChanges();

    expect(adminService.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ reference: "REF-001" }),
    );
  });

  it("should load transaction details by ID", () => {
    component.viewTransaction(mockTransactions[0]!);
    fixture.detectChanges();

    expect(adminService.getTransaction).toHaveBeenCalledWith("tx1");
  });

  it("should format helper utilities properly", () => {
    expect(component.formatType("LOAN_DISBURSEMENT")).toBe("Loan Disbursement");
    expect(component.getTypeIcon("WALLET_FUNDING")).toBe("add_circle");
  });
});
