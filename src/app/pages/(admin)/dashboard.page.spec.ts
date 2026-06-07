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
import { RouterTestingModule } from "@angular/router/testing";
import { DashboardPageComponent } from "./dashboard.page";
import { AdminService, DashboardMetrics } from "../../services/admin.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("DashboardPageComponent", () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;

  const mockMetrics: DashboardMetrics = {
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
  };

  beforeEach(() => {
    const mockAdminService = {
      getDashboardMetrics: vi.fn().mockReturnValue(of(mockMetrics)),
    };

    // Mock IntersectionObserver
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.prototype.observe = vi.fn();
    mockIntersectionObserver.prototype.unobserve = vi.fn();
    mockIntersectionObserver.prototype.disconnect = vi.fn();
    window.IntersectionObserver =
      mockIntersectionObserver as unknown as typeof IntersectionObserver;

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    queryClient.setQueryData(["dashboard-metrics"], mockMetrics);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DashboardPageComponent, RouterTestingModule],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
      ],
    });

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should load dashboard metrics and compute values correctly", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.metrics()).toEqual(mockMetrics);
    expect(component.usersTrend()).toBe(15.4);
    expect(component.volumeTrend()).toBe(8.9);
    expect(component.loansTrend()).toBe(-2.1);
    expect(component.pendingKycItems().length).toBe(1);
    expect(component.recentTransactions().length).toBe(1);
  }));

  it("should calculate bar height correctly based on max volume", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.maxVolume()).toBe(300000);
    expect(component.barHeightPx(150000)).toBe(60);
    expect(component.barHeightPx(300000)).toBe(120);
  }));

  it("should format helper values properly", () => {
    expect(component.compactAmount(1500000)).toBe("₦1.5M");
    expect(component.compactAmount(5000)).toBe("₦5K");
    expect(component.compactAmount(500)).toBe("₦500");
    expect(component.getTransactionIcon("WALLET_FUNDING")).toBe("add_circle");
    expect(component.getTransactionIcon("UNKNOWN")).toBe("payment");
  });
});
