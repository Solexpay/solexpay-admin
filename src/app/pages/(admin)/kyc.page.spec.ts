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
import { AdminService, KycItem } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { ConfirmService } from "../../services/confirm.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("KycPageComponent", () => {
  let component: KycPageComponent;
  let fixture: ComponentFixture<KycPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;
  let confirmService: { ask: ReturnType<typeof vi.fn> };

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
          items: mockKycItems,
          nextCursor: null,
          hasMore: false,
        }),
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
    queryClient.setQueryData(["kyc-queue", { status: "PENDING" }], {
      items: mockKycItems,
      nextCursor: null,
      hasMore: false,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [KycPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmService, useValue: confirmService },
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

  it("should compute queue metrics from the current status query", fakeAsync(() => {
    // Wait for the query to populate
    tick(10000);
    flush();
    expect(component.kycQueue()).toEqual(mockKycItems);
    expect(component.pendingCount()).toBe(2);
    expect(component.oldestWaiting().unit).toBe("d");
  }));

  it("should mask document numbers except last 4 digits", () => {
    expect(component.maskNumber("1234567890")).toBe("******7890");
    expect(component.maskNumber("12")).toBe("12");
  });

  it("should call approveMutation and show a toast on success", async () => {
    await component.approve(mockKycItems[0]!);
    await vi.waitFor(() =>
      expect(adminService.approveKyc).toHaveBeenCalledWith("kyc1"),
    );
    expect(adminService.approveKyc).toHaveBeenCalledWith("kyc1");
    await vi.waitFor(() =>
      expect(toastService.show).toHaveBeenCalledWith(
        "success",
        "KYC approved for John Doe",
      ),
    );
  });

  it("should call reject with the confirmed reason", async () => {
    await component.reject(mockKycItems[0]!);
    await vi.waitFor(() =>
      expect(adminService.rejectKyc).toHaveBeenCalledWith(
        "kyc1",
        "Test reason",
      ),
    );
    await vi.waitFor(() =>
      expect(toastService.show).toHaveBeenCalledWith(
        "success",
        "KYC rejected for John Doe",
      ),
    );
  });

  it("should not reject KYC when confirmation is cancelled", async () => {
    confirmService.ask.mockResolvedValueOnce(null);
    await component.reject(mockKycItems[0]!);
    expect(adminService.rejectKyc).not.toHaveBeenCalled();
  });

  it("should open the selected KYC detail modal", () => {
    component.viewDetails(mockKycItems[0]!);
    expect(component.selectedItem()).toEqual(mockKycItems[0]);
    expect(component.showDocumentNumber()).toBe(false);
  });
});
