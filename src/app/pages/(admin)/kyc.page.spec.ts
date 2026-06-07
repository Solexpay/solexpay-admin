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
import { KycPageComponent } from "./kyc.page";
import { AdminService, KycItem, Page } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { ConfettiService } from "../../services/confetti.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("KycPageComponent", () => {
  let component: KycPageComponent;
  let fixture: ComponentFixture<KycPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;

  const mockKycItems: KycItem[] = [
    {
      id: "kyc1",
      userId: "user1",
      userName: "John Doe",
      type: "NIN",
      documentNumber: "1234567890",
      documents: ["nin_slip.pdf"],
      status: "PENDING",
      submittedAt: "2026-06-06T12:00:00Z",
    },
    {
      id: "kyc2",
      userId: "user2",
      userName: "Jane Smith",
      type: "BVN",
      documentNumber: "0987654321",
      documents: ["bvn_doc.png"],
      status: "APPROVED",
      submittedAt: "2026-06-06T13:00:00Z",
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
      getKycQueue: vi.fn().mockReturnValue(
        of({
          content: mockKycItems,
          totalElements: 2,
          size: 10,
          number: 0,
        } as Page<KycItem>),
      ),
      approveKyc: vi
        .fn()
        .mockReturnValue(of({ success: true, message: "Approved" })),
      rejectKyc: vi
        .fn()
        .mockReturnValue(of({ success: true, message: "Rejected" })),
    };

    const mockToastService = {
      show: vi.fn(),
    };

    const mockConfettiService = {
      success: vi.fn(),
    };

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    queryClient.setQueryData(["kyc-queue"], {
      content: mockKycItems,
      totalElements: 2,
      size: 10,
      number: 0,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [KycPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfettiService, useValue: mockConfettiService },
      ],
    });

    fixture = TestBed.createComponent(KycPageComponent);
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

  it("should compute status and filters correctly", fakeAsync(() => {
    // Wait for the query to populate
    tick(10000);
    flush();
    expect(component.kycQueue()).toEqual(mockKycItems);
    expect(component.pendingCount()).toBe(1);
    expect(component.totalToday()).toBe(2);
    expect(component.approvedCount()).toBe(1);
    expect(component.rejectedCount()).toBe(0);
  }));

  it("should mask document numbers except last 4 digits", () => {
    expect(component.maskNumber("1234567890")).toBe("******7890");
    expect(component.maskNumber("12")).toBe("12");
  });

  it("should call approveMutation and show toast/confetti on success", async () => {
    await component.approveMutation.mutateAsync({
      id: "kyc1",
      userName: "John Doe",
    });
    expect(adminService.approveKyc).toHaveBeenCalledWith("kyc1");
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "KYC approved for John Doe",
    );
  });

  it("should call rejectMutation on reject action", async () => {
    await component.rejectMutation.mutateAsync({
      id: "kyc1",
      userName: "John Doe",
    });
    expect(adminService.rejectKyc).toHaveBeenCalledWith("kyc1");
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "KYC rejected for John Doe",
    );
  });

  it("should trigger toast notification when viewing details", () => {
    component.viewDetails(mockKycItems[0]!);
    expect(toastService.show).toHaveBeenCalledWith(
      "info",
      "Viewing details for John Doe",
    );
  });
});
