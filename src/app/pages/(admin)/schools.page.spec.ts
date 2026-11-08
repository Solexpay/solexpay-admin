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
import { SchoolsPageComponent } from "./schools.page";
import { AdminService, School } from "../../services/admin.service";
import { ToastService } from "../../services/toast.service";
import { ConfirmService } from "../../services/confirm.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("SchoolsPageComponent", () => {
  let component: SchoolsPageComponent;
  let fixture: ComponentFixture<SchoolsPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;
  let confirmService: { ask: ReturnType<typeof vi.fn> };

  const mockSchools: School[] = [
    {
      id: "sch-1",
      name: "Unilag",
      email: "unilag@test.com",
      phone: "1234",
      address: "Akoka",
      state: "Lagos",
      studentCount: 15000,
      activeLoans: 25,
      totalDisbursed: 1200000,
      status: "ACTIVE",
      apiToken: "jwt-token-1",
      createdAt: "2026-06-06T12:00:00Z",
      logoUrl: "logo.png",
    },
    {
      id: "sch-2",
      name: "Afe Babalola",
      email: "afe@test.com",
      phone: "5678",
      address: "Ado Ekiti",
      state: "Ekiti",
      studentCount: 8000,
      activeLoans: 12,
      totalDisbursed: 600000,
      status: "INACTIVE",
      apiToken: "jwt-token-2",
      createdAt: "2026-06-06T13:00:00Z",
      logoUrl: "",
    },
  ];

  beforeEach(() => {
    const mockAdminService = {
      getSchools: vi.fn().mockReturnValue(
        of({
          items: mockSchools,
          nextCursor: null,
          hasMore: false,
        }),
      ),
      regenerateSchoolToken: vi
        .fn()
        .mockReturnValue(
          of({ school_id: "sch-1", temporary_password: "TempPass123!" }),
        ),
      toggleSchoolStatus: vi.fn().mockReturnValue(of({ success: true })),
      addSchool: vi.fn().mockReturnValue(
        of({
          id: "sch-3",
          name: "New School",
          email: "new@school.com",
          phone: "",
          address: "",
          state: "Kano",
          studentCount: 0,
          activeLoans: 0,
          totalDisbursed: 0,
          status: "ACTIVE",
          apiToken: "token-3",
          createdAt: "2026-06-06T14:00:00Z",
          logoUrl: "",
        }),
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
    queryClient.setQueryData(["schools", { status: "" }], {
      items: mockSchools,
      nextCursor: null,
      hasMore: false,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SchoolsPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmService, useValue: confirmService },
      ],
    });

    fixture = TestBed.createComponent(SchoolsPageComponent);
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

  it("should calculate student enrollment and active loan aggregates", fakeAsync(() => {
    tick(10000);
    flush();

    expect(component.schools()).toEqual(mockSchools);
    expect(component.totalStudents()).toBe(23000);
    expect(component.totalActiveLoans()).toBe(37);
    expect(component.totalDisbursed()).toBe(1800000);
  }));

  it("should mask school api access token details", () => {
    expect(
      component.maskToken("extremely-long-secret-key-string-value-here"),
    ).toBe("extremel...here");
    expect(component.maskToken("short")).toBe("short");
  });

  it("should confirm reset login and show the one-time temporary password", async () => {
    await component.resetLogin(mockSchools[0]!);
    expect(confirmService.ask).toHaveBeenCalledWith(
      expect.objectContaining({ typeToConfirm: "RESET" }),
    );
    await vi.waitFor(() =>
      expect(adminService.regenerateSchoolToken).toHaveBeenCalledWith("sch-1"),
    );
    expect(adminService.regenerateSchoolToken).toHaveBeenCalledWith("sch-1");
    await vi.waitFor(() =>
      expect(component.temporaryPassword()).toEqual({
        school_id: "sch-1",
        temporary_password: "TempPass123!",
      }),
    );
  });

  it("should toggle status on action trigger", async () => {
    await component.toggleStatus(mockSchools[0]!);
    await vi.waitFor(() =>
      expect(adminService.toggleSchoolStatus).toHaveBeenCalledWith(
        "sch-1",
        "INACTIVE",
      ),
    );
    expect(adminService.toggleSchoolStatus).toHaveBeenCalledWith(
      "sch-1",
      "INACTIVE",
    );
    await vi.waitFor(() =>
      expect(toastService.show).toHaveBeenCalledWith(
        "success",
        "School status updated to INACTIVE",
      ),
    );
  });

  it("should trigger addSchool mutation on modal submit", async () => {
    const schoolData = {
      name: "New School",
      email: "new@school.com",
      phone: "",
      address: "",
      state: "Kano",
    };
    component.newSchool.set({ ...schoolData });
    component.addSchool();
    await vi.waitFor(() =>
      expect(adminService.addSchool).toHaveBeenCalledWith(schoolData),
    );
    expect(adminService.addSchool).toHaveBeenCalledWith(schoolData);
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "New School added successfully",
    );
  });

  it("should reject modal submit when required fields or email are invalid", () => {
    component.newSchool.set({
      name: "New School",
      email: "not-an-email",
      phone: "",
      address: "",
      state: "",
    });
    component.addSchool();
    expect(toastService.show).toHaveBeenCalledWith(
      "error",
      "Please fill in required fields",
    );
    expect(adminService.addSchool).not.toHaveBeenCalled();
  });

  it("should not change school status when confirmation is cancelled", async () => {
    confirmService.ask.mockResolvedValueOnce(null);
    await component.toggleStatus(mockSchools[0]!);
    expect(adminService.toggleSchoolStatus).not.toHaveBeenCalled();
  });

  it("should open the selected school detail modal", () => {
    component.viewSchool(mockSchools[0]!);
    expect(component.selectedSchool()).toEqual(mockSchools[0]);
  });
});
