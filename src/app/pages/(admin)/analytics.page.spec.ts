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
import { AnalyticsPageComponent } from "./analytics.page";
import { AdminService, UsageAnalytics } from "../../services/admin.service";
import { of, throwError, NEVER } from "rxjs";
import { vi } from "vitest";

describe("AnalyticsPageComponent", () => {
  let component: AnalyticsPageComponent;
  let fixture: ComponentFixture<AnalyticsPageComponent>;
  let queryClient: QueryClient;
  let mockAdminService: {
    getUsageAnalytics: ReturnType<typeof vi.fn>;
  };

  const mockUsageAnalytics: UsageAnalytics = {
    windowDays: 30,
    activeUsers: 1250,
    avgLoginsPerActiveUser: 4.8,
    avgForegroundSessionSeconds: 145,
    medianForegroundSessionSeconds: 60,
    dailyActive: [
      { date: "2026-06-01", users: 120 },
      { date: "2026-06-02", users: 240 },
    ],
    featureUsage: [
      { feature: "loan_application", events: 500, users: 320 },
      { feature: "wallet_transfer", events: 850, users: 410 },
    ],
    flowUsage: [
      {
        flow: "tuition_loan",
        started: 100,
        completed: 85,
        failed: 10,
        abandoned: 5,
        users: 90,
        completionRate: 0.85,
      },
      {
        flow: "kyc_verification",
        started: 200,
        completed: 150,
        failed: 30,
        abandoned: 20,
        users: 180,
        completionRate: 0.75,
      },
    ],
  };

  // TanStack Query settles through real timers that fixture.whenStable() does
  // not track, so poll until the query leaves its pending state.
  async function waitForQuery(
    target: ComponentFixture<AnalyticsPageComponent>,
  ): Promise<void> {
    for (let i = 0; i < 50 && target.componentInstance.query.isPending(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    target.detectChanges();
  }

  beforeEach(() => {
    // Mock IntersectionObserver for JSDOM
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.prototype.observe = vi.fn();
    mockIntersectionObserver.prototype.unobserve = vi.fn();
    mockIntersectionObserver.prototype.disconnect = vi.fn();
    window.IntersectionObserver =
      mockIntersectionObserver as unknown as typeof IntersectionObserver;

    mockAdminService = {
      getUsageAnalytics: vi
        .fn()
        .mockImplementation((days: 7 | 30 | 90) =>
          of({ ...mockUsageAnalytics, windowDays: days }),
        ),
    };

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AnalyticsPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
      ],
    });

    fixture = TestBed.createComponent(AnalyticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create component with default window of 30 and call the service with 30", () => {
    expect(component).toBeTruthy();
    expect(component.days()).toBe(30);
    expect(mockAdminService.getUsageAnalytics).toHaveBeenCalledWith(30);
  });

  it("should update days and trigger getUsageAnalytics on selectWindow(7) and selectWindow(90) with matching button aria-pressed", fakeAsync(() => {
    const buttons = fixture.nativeElement.querySelectorAll(
      'div[aria-label="Analytics date range"] button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(3);

    // Initial state: 30 days is active
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[2]!.getAttribute("aria-pressed")).toBe("false");

    // Select window 7
    component.selectWindow(7);
    fixture.detectChanges();
    tick(10000);
    flush();
    fixture.detectChanges();

    expect(component.days()).toBe(7);
    expect(mockAdminService.getUsageAnalytics).toHaveBeenCalledWith(7);
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[2]!.getAttribute("aria-pressed")).toBe("false");

    // Select window 90
    component.selectWindow(90);
    fixture.detectChanges();
    tick(10000);
    flush();
    fixture.detectChanges();

    expect(component.days()).toBe(90);
    expect(mockAdminService.getUsageAnalytics).toHaveBeenCalledWith(90);
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[2]!.getAttribute("aria-pressed")).toBe("true");
  }));

  it("should render key aggregates, feature reach rows, and flow outcome counts with completion rate from mocked UsageAnalytics payload", async () => {
    // The fetch started in beforeEach (outside any fake zone), so wait on the
    // real event loop for the mocked service response to settle.
    await waitForQuery(fixture);

    const compiled = fixture.nativeElement as HTMLElement;

    // Summary aggregates
    expect(compiled.textContent).toContain("1250");
    expect(compiled.textContent).toContain("4.8");
    expect(compiled.textContent).toContain("1m");
    expect(compiled.textContent).toContain("2m 25s");

    // Feature reach section
    expect(compiled.textContent).toContain("loan application");
    expect(compiled.textContent).toContain("320 users · 500 opens");
    expect(compiled.textContent).toContain("wallet transfer");
    expect(compiled.textContent).toContain("410 users · 850 opens");

    // Flow outcomes section table rows
    const tableRows = compiled.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(2);

    // Row 1: tuition loan
    const row1Text = tableRows[0]?.textContent || "";
    expect(row1Text).toContain("tuition loan");
    expect(row1Text).toContain("100");
    expect(row1Text).toContain("85");
    expect(row1Text).toContain("10");
    expect(row1Text).toContain("5");
    expect(row1Text).toContain("85%");

    // Row 2: kyc verification
    const row2Text = tableRows[1]?.textContent || "";
    expect(row2Text).toContain("kyc verification");
    expect(row2Text).toContain("200");
    expect(row2Text).toContain("150");
    expect(row2Text).toContain("30");
    expect(row2Text).toContain("20");
    expect(row2Text).toContain("75%");

    // Daily active users chart points
    const bars = compiled.querySelectorAll(
      '[role="img"][aria-label="Daily active users bar chart"] .group',
    );
    expect(bars.length).toBe(2);
    expect(bars[0]?.getAttribute("title")).toBe("2026-06-01: 120 active users");
    expect(bars[1]?.getAttribute("title")).toBe("2026-06-02: 240 active users");
  });

  it("should render page without throwing when optional fields are absent in UsageAnalytics", fakeAsync(() => {
    const minimalUsage: UsageAnalytics = {
      windowDays: 30,
      dailyActive: [],
      featureUsage: [],
      flowUsage: [],
    };

    queryClient.setQueryData(["admin", "product-usage", 30], minimalUsage);
    expect(() => {
      fixture.detectChanges();
      tick(10000);
      flush();
      fixture.detectChanges();
    }).not.toThrow();

    const compiled = fixture.nativeElement as HTMLElement;

    // Empty state messages when cohorts/fields are absent
    expect(compiled.textContent).toContain(
      "Hidden until at least 10 users are in this cohort.",
    );
    expect(compiled.textContent).toContain("No reportable daily cohorts yet.");
    expect(compiled.textContent).toContain(
      "No feature cohort has reached 10 users yet.",
    );
    expect(compiled.textContent).toContain(
      "No flow cohorts have reached 10 users yet.",
    );
  }));

  it("should render error state when service throws an error", async () => {
    TestBed.resetTestingModule();
    const errorAdminService = {
      getUsageAnalytics: vi
        .fn()
        .mockReturnValue(
          throwError(() => new Error("Failed to fetch product analytics")),
        ),
    };
    const errorQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    TestBed.configureTestingModule({
      imports: [AnalyticsPageComponent],
      providers: [
        provideQueryClient(errorQueryClient),
        { provide: AdminService, useValue: errorAdminService },
      ],
    });

    const errorFixture = TestBed.createComponent(AnalyticsPageComponent);
    errorFixture.detectChanges();
    await waitForQuery(errorFixture);

    const alert = errorFixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain(
      "Product analytics could not be loaded. Your role must have access to aggregate usage analytics.",
    );
  });

  it("should render loading state when query is pending", () => {
    TestBed.resetTestingModule();
    const pendingAdminService = {
      getUsageAnalytics: vi.fn().mockReturnValue(NEVER),
    };
    const pendingQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    TestBed.configureTestingModule({
      imports: [AnalyticsPageComponent],
      providers: [
        provideQueryClient(pendingQueryClient),
        { provide: AdminService, useValue: pendingAdminService },
      ],
    });

    const pendingFixture = TestBed.createComponent(AnalyticsPageComponent);
    pendingFixture.detectChanges();

    const status =
      pendingFixture.nativeElement.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect(status.textContent).toContain("Loading product metrics…");
  });

  describe("helper methods", () => {
    it("should format seconds into human-readable duration with formatDuration", () => {
      expect(component.formatDuration(undefined)).toBe("—");
      expect(component.formatDuration()).toBe("—");
      expect(component.formatDuration(0)).toBe("0s");
      expect(component.formatDuration(45)).toBe("45s");
      expect(component.formatDuration(60)).toBe("1m");
      expect(component.formatDuration(65)).toBe("1m 5s");
      expect(component.formatDuration(120)).toBe("2m");
      expect(component.formatDuration(145)).toBe("2m 25s");
      expect(component.formatDuration(-10)).toBe("0s");
    });

    it("should calculate proportional bar height with minimum of 4% using barHeight", () => {
      const points = [{ users: 50 }, { users: 100 }, { users: 200 }];
      expect(component.barHeight(200, points)).toBe(100);
      expect(component.barHeight(100, points)).toBe(50);
      expect(component.barHeight(50, points)).toBe(25);
      expect(component.barHeight(1, points)).toBe(4);
      expect(component.barHeight(0, points)).toBe(4);
    });

    it("should calculate percentage share safely using share", () => {
      expect(component.share(50, 200)).toBe(25);
      expect(component.share(100, 100)).toBe(100);
      expect(component.share(150, 100)).toBe(100);
      expect(component.share(50, 0)).toBe(0);
      expect(component.share(50, undefined)).toBe(0);
    });
  });
});
