import "../../../test";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import {
  provideQueryClient,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { RouterTestingModule } from "@angular/router/testing";
import { By } from "@angular/platform-browser";
import { UsersPageComponent } from "./users.page";
import { AdminService, User, CursorPage } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { of } from "rxjs";
import { vi, expect } from "vitest";

describe("Cursor List Component Behavior (UsersPageComponent)", () => {
  let component: UsersPageComponent;
  let fixture: ComponentFixture<UsersPageComponent>;
  let adminService: AdminService;

  const page1Users: User[] = [
    {
      id: "usr-1",
      firstName: "Alice",
      lastName: "Adams",
      email: "alice@test.com",
      phoneNumber: "08011111111",
      status: "ACTIVE",
      kycTier: "TIER_2",
      createdAt: "2026-06-01T10:00:00Z",
      walletBalance: 10000,
    },
    {
      id: "usr-2",
      firstName: "Bob",
      lastName: "Baker",
      email: "bob@test.com",
      phoneNumber: "08022222222",
      status: "ACTIVE",
      kycTier: "TIER_1",
      createdAt: "2026-06-01T11:00:00Z",
      walletBalance: 20000,
    },
  ];

  const page2Users: User[] = [
    {
      id: "usr-3",
      firstName: "Charlie",
      lastName: "Clark",
      email: "charlie@test.com",
      phoneNumber: "08033333333",
      status: "ACTIVE",
      kycTier: "TIER_2",
      createdAt: "2026-06-01T12:00:00Z",
      walletBalance: 30000,
    },
  ];

  const page1Response: CursorPage<User> = {
    items: page1Users,
    nextCursor: "cursor_after_page_1",
    hasMore: true,
  };

  const page2Response: CursorPage<User> = {
    items: page2Users,
    nextCursor: null,
    hasMore: false,
  };

  beforeEach(() => {
    // Mock IntersectionObserver
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.prototype.observe = vi.fn();
    mockIntersectionObserver.prototype.unobserve = vi.fn();
    mockIntersectionObserver.prototype.disconnect = vi.fn();
    window.IntersectionObserver =
      mockIntersectionObserver as unknown as typeof IntersectionObserver;

    const mockAdminService = {
      getUsers: vi
        .fn()
        .mockImplementation(
          (params: Parameters<AdminService["getUsers"]>[0]) => {
            if (
              typeof params === "object" &&
              params?.cursor === "cursor_after_page_1"
            ) {
              return of(page2Response);
            }
            return of(page1Response);
          },
        ),
      suspendUser: vi.fn().mockReturnValue(of({ success: true })),
      reactivateUser: vi.fn().mockReturnValue(of({ success: true })),
      getUserDetail: vi.fn().mockReturnValue(of({})),
    };

    const mockToastService = {
      show: vi.fn(),
    };

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });

    queryClient.setQueryData(
      ["users", { search: "", status: "" }],
      page1Response,
    );

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
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should show initial items and render the Load More button when hasMore is true", () => {
    expect(component.users().length).toBe(2);
    expect(component.hasMore()).toBe(true);

    const buttons = fixture.debugElement.queryAll(By.css("button"));
    const hasLoadMoreBtn = buttons.some((b) =>
      b.nativeElement.textContent?.includes("Load more"),
    );
    expect(hasLoadMoreBtn).toBe(true);
  });

  it("should append new items to the existing list when loadMore() is executed", () => {
    expect(component.users().length).toBe(2);

    component.loadMore();
    fixture.detectChanges();

    // Must call adminService.getUsers with cursor
    expect(adminService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: "cursor_after_page_1" }),
    );

    // List must now contain items from page1 + page2 (total 3 items)
    expect(component.users().length).toBe(3);
    expect(component.users().map((u) => u.id)).toEqual([
      "usr-1",
      "usr-2",
      "usr-3",
    ]);

    // hasMore must now be false
    expect(component.hasMore()).toBe(false);
  });

  it("should reset cursor and appended items when a filter or search changes", () => {
    // Append items first
    component.loadMore();
    expect(component.users().length).toBe(3);

    // User changes status filter
    component.onStatusChange("SUSPENDED");
    expect(component.statusFilter()).toBe("SUSPENDED");

    // Appended items must be cleared and cursor reset
    expect(component.rawAppendedUsers().length).toBe(0);
    expect(component.nextCursor()).toBeNull();
  });

  it("should reset cursor and appended items on search input", () => {
    component.loadMore();
    expect(component.users().length).toBe(3);

    component.onSearch("08011111111");
    expect(component.searchQuery()).toBe("08011111111");
    expect(component.rawAppendedUsers().length).toBe(0);
    expect(component.nextCursor()).toBeNull();
  });
});
