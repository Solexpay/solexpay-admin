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
import { UsersPageComponent } from "./users.page";
import { AdminService, User, UserDetail } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { ConfirmService } from "../../services/confirm.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("UsersPageComponent", () => {
  let component: UsersPageComponent;
  let fixture: ComponentFixture<UsersPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;
  let confirmService: { ask: ReturnType<typeof vi.fn> };

  const mockUsers: User[] = [
    {
      id: "usr-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@test.com",
      phoneNumber: "1234567890",
      status: "ACTIVE",
      kycTier: "TIER_2",
      createdAt: "2026-06-06T12:00:00Z",
      walletBalance: 5000,
    },
    {
      id: "usr-2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@test.com",
      phoneNumber: "0987654321",
      status: "SUSPENDED",
      kycTier: "TIER_1",
      createdAt: "2026-06-06T13:00:00Z",
      walletBalance: 0,
    },
  ];

  beforeEach(() => {
    // Mock IntersectionObserver
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.prototype.observe = vi.fn();
    mockIntersectionObserver.prototype.unobserve = vi.fn();
    mockIntersectionObserver.prototype.disconnect = vi.fn();
    window.IntersectionObserver =
      mockIntersectionObserver as unknown as typeof IntersectionObserver;

    const mockAdminService = {
      getUsers: vi.fn().mockReturnValue(
        of({
          items: mockUsers,
          nextCursor: null,
          hasMore: false,
        }),
      ),
      suspendUser: vi.fn().mockReturnValue(of({ success: true })),
      reactivateUser: vi.fn().mockReturnValue(of({ success: true })),
      getUserDetail: vi.fn().mockReturnValue(
        of({
          id: "usr-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@test.com",
          phoneNumber: "1234567890",
          status: "ACTIVE",
          kycTier: "TIER_2",
          createdAt: "2026-06-06T12:00:00Z",
          walletBalance: 5000,
          role: "USER",
          suspendedAt: null,
          suspensionReason: null,
          recentTransactions: [],
          loans: [],
          kycVerifications: [],
        } as UserDetail),
      ),
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
    queryClient.setQueryData(
      ["users", { search: "", status: "", kycTier: "" }],
      {
        items: mockUsers,
        nextCursor: null,
        hasMore: false,
      },
    );
    queryClient.setQueryData(["user-detail", "usr-1"], {
      id: "usr-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@test.com",
      phoneNumber: "1234567890",
      status: "ACTIVE",
      kycTier: "TIER_2",
      createdAt: "2026-06-06T12:00:00Z",
      walletBalance: 5000,
      role: "USER",
      suspendedAt: null,
      suspensionReason: null,
      recentTransactions: [],
      loans: [],
      kycVerifications: [],
    } as UserDetail);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [UsersPageComponent, RouterTestingModule],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmService, useValue: confirmService },
      ],
    });

    fixture = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should load users and map their API properties correctly", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.users().length).toBe(2);
    expect(component.users()[0]!.kycTier).toBe("TIER_2");
    expect(component.users()[0]!.phone).toBe("1234567890");
    expect(component.users()[1]!.kycTier).toBe("TIER_1");
  }));

  it("should send the selected KYC tier to the server", fakeAsync(() => {
    component.onKycChange("TIER_2");
    fixture.detectChanges();
    tick(10000);
    flush();

    expect(component.kycFilter()).toBe("TIER_2");
    expect(adminService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ kycTier: "TIER_2" }),
    );
  }));

  it("should debounce server search and use phoneNumber for phone queries", () => {
    vi.useFakeTimers();
    component.onSearch("John");
    expect(component.searchInput()).toBe("John");
    expect(component.searchQuery()).toBe("");
    vi.advanceTimersByTime(300);
    expect(component.searchQuery()).toBe("John");

    component.onSearch("08012345678");
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(adminService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: "08012345678" }),
    );
  });

  it("should trigger a server refetch when status changes", fakeAsync(() => {
    component.onStatusChange("SUSPENDED");
    fixture.detectChanges();
    tick(10000);
    flush();

    expect(component.statusFilter()).toBe("SUSPENDED");
    expect(adminService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ status: "SUSPENDED" }),
    );
    expect(component.rawAppendedUsers()).toEqual([]);
    expect(component.nextCursor()).toBeNull();
  }));

  it("should load the next cursor page", () => {
    component.nextCursor.set("cursor-after-first-page");
    component.loadMore();

    expect(adminService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: "cursor-after-first-page" }),
    );
    expect(component.rawAppendedUsers()).toHaveLength(2);
    expect(component.users()).toHaveLength(4);
  });

  it("should ask for confirmation and call suspend and reactivate mutations", async () => {
    await component.suspend(mockUsers[0]!);
    expect(confirmService.ask).toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(adminService.suspendUser).toHaveBeenCalledWith(
        "usr-1",
        "Test reason",
      ),
    );
    await vi.waitFor(() =>
      expect(toastService.show).toHaveBeenCalledWith(
        "success",
        "John Doe suspended",
      ),
    );

    await component.reactivate(mockUsers[1]!);
    await vi.waitFor(() =>
      expect(adminService.reactivateUser).toHaveBeenCalledWith("usr-2"),
    );
    await vi.waitFor(() =>
      expect(toastService.show).toHaveBeenCalledWith(
        "success",
        "Jane Smith reactivated",
      ),
    );
  });

  it("should not suspend when confirmation is cancelled", async () => {
    confirmService.ask.mockResolvedValueOnce(null);

    await component.suspend(mockUsers[0]!);

    expect(adminService.suspendUser).not.toHaveBeenCalled();
  });

  it("should open and close the user detail view", () => {
    const user = mockUsers[0]!;
    expect(component.selectedUserId()).toBeNull();

    component.viewUser(user);
    fixture.detectChanges();
    expect(component.selectedUserId()).toBe("usr-1");
    expect(component.userDetailQuery.data()?.firstName).toBe("John");

    component.closeUserDetail();
    fixture.detectChanges();
    expect(component.selectedUserId()).toBeNull();
  });
});
