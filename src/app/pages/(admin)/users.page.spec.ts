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
import {
  AdminService,
  User,
  UserDetail,
  Page,
} from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("UsersPageComponent", () => {
  let component: UsersPageComponent;
  let fixture: ComponentFixture<UsersPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;

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
          content: mockUsers,
          totalElements: 2,
          totalPages: 1,
          size: 20,
          number: 0,
          first: true,
          last: true,
        } as Page<User>),
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
        "users",
        {
          page: 0,
          size: 20,
          search: "",
          status: "",
        },
      ],
      {
        content: mockUsers,
        totalElements: 2,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
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
      ],
    });

    fixture = TestBed.createComponent(UsersPageComponent);
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

  it("should load and filter users mapping the properties correctly", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.users().length).toBe(2);
    expect(component.users()[0]!.kycStatus).toBe("VERIFIED");
    expect(component.users()[1]!.kycStatus).toBe("PENDING");
  }));

  it("should filter locally by KYC status", fakeAsync(() => {
    tick(10000);
    flush();

    component.kycFilter.set("VERIFIED");
    fixture.detectChanges();
    expect(component.users().length).toBe(1);
    expect(component.users()[0]!.id).toBe("usr-1");
  }));

  it("should trigger search filter refetch", () => {
    component.onSearch("John");
    expect(component.searchQuery()).toBe("John");
    expect(component.currentPage()).toBe(0);
  });

  it("should trigger status filter refetch", () => {
    component.onStatusChange("SUSPENDED");
    expect(component.statusFilter()).toBe("SUSPENDED");
    expect(component.currentPage()).toBe(0);
  });

  it("should support pagination methods", () => {
    component.currentPage.set(1);
    component.prevPage();
    expect(component.currentPage()).toBe(0);

    component.nextPage();
    expect(component.currentPage()).toBe(1);
  });

  it("should call suspend and reactivate mutations correctly", async () => {
    await component.suspendMutation.mutateAsync({
      userId: "usr-1",
      userName: "John Doe",
    });
    expect(adminService.suspendUser).toHaveBeenCalledWith("usr-1");
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "John Doe suspended",
    );

    await component.reactivateMutation.mutateAsync({
      userId: "usr-2",
      userName: "Jane Smith",
    });
    expect(adminService.reactivateUser).toHaveBeenCalledWith("usr-2");
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "Jane Smith reactivated",
    );
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
