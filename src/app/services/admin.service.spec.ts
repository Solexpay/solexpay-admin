import "../../test";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  AdminService,
  DashboardMetrics,
  SuccessResponse,
} from "./admin.service";
import { firstValueFrom } from "rxjs";

describe("AdminService", () => {
  let service: AdminService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), AdminService],
    });
    service = TestBed.inject(AdminService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should get dashboard metrics", async () => {
    const metrics: DashboardMetrics = await firstValueFrom(
      service.getDashboardMetrics(),
    );
    expect(metrics.totalUsers).toBeGreaterThan(0);
    expect(metrics.activeLoans).toBeDefined();
  });

  it("should suspend a user", async () => {
    const res: SuccessResponse = await firstValueFrom(
      service.suspendUser("usr-001"),
    );
    expect(res.success).toBe(true);
  });

  it("should get schools list", async () => {
    const schools = await firstValueFrom(service.getSchools());
    expect(schools.length).toBeGreaterThan(0);
    expect(schools[0]!.name).toBeDefined();
  });
});
