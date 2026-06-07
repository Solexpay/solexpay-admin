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
import { AdminService, Transaction, Page } from "../../services/admin.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("TransactionsPageComponent", () => {
  let component: TransactionsPageComponent;
  let fixture: ComponentFixture<TransactionsPageComponent>;

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
          content: mockTransactions,
          totalElements: 2,
          totalPages: 1,
          size: 100,
          number: 0,
        } as Page<Transaction>),
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
    queryClient.setQueryData(["transactions", { from: "" }], {
      content: mockTransactions,
      totalElements: 2,
      totalPages: 1,
      size: 100,
      number: 0,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TransactionsPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
      ],
    });

    fixture = TestBed.createComponent(TransactionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch and filter transactions correctly", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.transactions()).toEqual(mockTransactions);
    expect(component.filteredTransactions().length).toBe(2);

    // Search query filter
    component.searchQuery.set("Jane");
    fixture.detectChanges();
    expect(component.filteredTransactions().length).toBe(1);
    expect(component.filteredTransactions()[0]!.id).toBe("tx2");

    // Type filter
    component.searchQuery.set("");
    component.typeFilter.set("WALLET_FUNDING");
    fixture.detectChanges();
    expect(component.filteredTransactions().length).toBe(1);
    expect(component.filteredTransactions()[0]!.id).toBe("tx1");

    // Status filter
    component.typeFilter.set("");
    component.statusFilter.set("FAILED");
    fixture.detectChanges();
    expect(component.filteredTransactions().length).toBe(1);
    expect(component.filteredTransactions()[0]!.id).toBe("tx2");
  }));

  it("should calculate summary analytics correctly", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.volume24h()).toBe(15000);
    expect(component.successCount()).toBe(1);
    expect(component.failedCount()).toBe(1);
  }));

  it("should format helper utilities properly", () => {
    expect(component.formatType("LOAN_DISBURSEMENT")).toBe("Loan Disbursement");
    expect(component.getTypeIcon("WALLET_FUNDING")).toBe("add_circle");
    expect(component.getTypeColor("WALLET_FUNDING")).toBe("text-tertiary");
    expect(component.getTypeColor("UNKNOWN")).toBe("text-on-surface-variant");
  });
});
