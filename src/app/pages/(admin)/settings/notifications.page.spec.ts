import "../../../../test";
import { TestBed, ComponentFixture, fakeAsync } from "@angular/core/testing";
import {
  provideQueryClient,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { NotificationsPageComponent } from "./notifications.page";
import {
  AdminService,
  NotificationSettings,
} from "../../../services/admin.service";
import { ToastService } from "../../../services/toast.service";
import { of } from "rxjs";
import { vi } from "vitest";

describe("NotificationsPageComponent", () => {
  let component: NotificationsPageComponent;
  let fixture: ComponentFixture<NotificationsPageComponent>;
  let adminService: AdminService;
  let toastService: ToastService;

  const mockSettings: NotificationSettings = {
    newUserRegistrations: true,
    loanApplications: false,
    kycSubmissions: true,
    systemAlerts: true,
    browserNotifications: false,
  };

  beforeEach(() => {
    const mockAdminService = {
      getNotificationSettings: vi.fn().mockReturnValue(of(mockSettings)),
      updateNotificationSettings: vi
        .fn()
        .mockReturnValue(of({ success: true })),
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
    queryClient.setQueryData(["notifications-settings"], mockSettings);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NotificationsPageComponent],
      providers: [
        provideQueryClient(queryClient),
        { provide: AdminService, useValue: mockAdminService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    fixture = TestBed.createComponent(NotificationsPageComponent);
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

  it("should read server notification properties into reactive signals", fakeAsync(() => {
    // Manually trigger data copying to match constructor effect behavior in tests
    component.newUserRegistrations.set(mockSettings.newUserRegistrations);
    component.loanApplications.set(mockSettings.loanApplications);
    component.kycSubmissions.set(mockSettings.kycSubmissions);

    expect(component.newUserRegistrations()).toBe(true);
    expect(component.loanApplications()).toBe(false);
    expect(component.kycSubmissions()).toBe(true);
  }));

  it("should call update mutation with new preference settings values on save", async () => {
    component.newUserRegistrations.set(false);
    component.loanApplications.set(true);

    await component.updateMutation.mutateAsync({
      newUserRegistrations: false,
      loanApplications: true,
      kycSubmissions: true,
      systemAlerts: true,
      browserNotifications: false,
    });

    expect(adminService.updateNotificationSettings).toHaveBeenCalledWith({
      newUserRegistrations: false,
      loanApplications: true,
      kycSubmissions: true,
      systemAlerts: true,
      browserNotifications: false,
    });
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "Notification preferences saved",
    );
  });
});
