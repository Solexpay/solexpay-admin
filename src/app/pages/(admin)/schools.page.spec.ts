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
import { of } from "rxjs";
import { vi } from "vitest";

describe("SchoolsPageComponent", () => {
  let component: SchoolsPageComponent;
  let fixture: ComponentFixture<SchoolsPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;

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
      getSchools: vi.fn().mockReturnValue(of(mockSchools)),
      regenerateSchoolToken: vi
        .fn()
        .mockReturnValue(of({ success: true, apiToken: "new-token" })),
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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    queryClient.setQueryData(["schools"], mockSchools);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SchoolsPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
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

  it("should trigger regenerateToken mutation on action", async () => {
    await component.regenerateTokenMutation.mutateAsync("sch-1");
    expect(adminService.regenerateSchoolToken).toHaveBeenCalledWith("sch-1");
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "API token regenerated successfully",
    );
  });

  it("should toggle status on action trigger", async () => {
    await component.toggleStatusMutation.mutateAsync({
      id: "sch-1",
      status: "INACTIVE",
    });
    expect(adminService.toggleSchoolStatus).toHaveBeenCalledWith(
      "sch-1",
      "INACTIVE",
    );
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "School status updated to INACTIVE",
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
    component.newSchool = { ...schoolData };
    await component.addSchoolMutation.mutateAsync(schoolData);
    expect(adminService.addSchool).toHaveBeenCalledWith(schoolData);
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "New School added successfully",
    );
  });

  it("should reject modal submit if validation fails", () => {
    component.newSchool = {
      name: "",
      email: "",
      phone: "",
      address: "",
      state: "",
    };
    component.addSchool();
    expect(toastService.show).toHaveBeenCalledWith(
      "error",
      "Please fill in required fields",
    );
  });
});
