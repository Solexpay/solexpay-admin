import "../../../test";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { TopBarComponent } from "./topbar.component";
import { AuthService } from "../../services/auth.service";
import { vi } from "vitest";
import { signal } from "@angular/core";

type MockCurrentUser = { firstName: string; lastName: string } | null;

describe("TopBarComponent", () => {
  let component: TopBarComponent;
  let fixture: ComponentFixture<TopBarComponent>;
  let mockAuth: {
    logout: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof signal<MockCurrentUser>>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    mockAuth = {
      logout: vi.fn(),
      currentUser: signal<MockCurrentUser>({
        firstName: "Admin",
        lastName: "User",
      }),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TopBarComponent],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create topbar component", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle sidebar output when menu button is clicked", () => {
    const toggleSpy = vi.spyOn(component.toggleSidebar, "emit");
    const menuBtn = fixture.debugElement.query(By.css("button.lg\\:hidden"));
    menuBtn.triggerEventHandler("click", null);
    expect(toggleSpy).toHaveBeenCalled();
  });

  it("should navigate to settings notifications when showNotifications is called", () => {
    component.showNotifications();
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      "/settings/notifications",
    ]);
  });

  it("should navigate to settings profile when goToSettings is called", () => {
    component.goToSettings();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/settings/profile"]);
  });

  it("should call auth logout when logout button is clicked", () => {
    // Find logout button (text contains Logout or has logout icon)
    const logoutBtn = fixture.debugElement.query(By.css("button.bg-primary"));
    logoutBtn.triggerEventHandler("click", null);
    expect(mockAuth.logout).toHaveBeenCalled();
  });
});
