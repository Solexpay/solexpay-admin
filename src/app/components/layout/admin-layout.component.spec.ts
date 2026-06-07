import "../../../test";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { RouterTestingModule } from "@angular/router/testing";
import { Title } from "@angular/platform-browser";
import { AdminLayoutComponent } from "./admin-layout.component";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";
import { vi } from "vitest";
import { signal, Component } from "@angular/core";

@Component({ standalone: true, template: "" })
class DummyComponent {}

describe("AdminLayoutComponent", () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let titleService: Title;

  beforeEach(async () => {
    TestBed.resetTestingModule();

    const mockAuth = {
      logout: vi.fn(),
      currentUser: signal({ firstName: "Admin" }),
    };

    const mockToast = {
      toasts: signal([]),
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminLayoutComponent,
        RouterTestingModule.withRoutes([
          { path: "dashboard", component: DummyComponent },
          { path: "users", component: DummyComponent },
          { path: "kyc", component: DummyComponent },
          { path: "loans", component: DummyComponent },
          { path: "transactions", component: DummyComponent },
          { path: "schools", component: DummyComponent },
        ]),
      ],
      providers: [
        Title,
        { provide: AuthService, useValue: mockAuth },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create admin layout component", () => {
    expect(component).toBeTruthy();
  });

  it("should set page title on init", () => {
    const titleSpy = vi.spyOn(titleService, "setTitle");
    component.ngOnInit();
    expect(titleSpy).toHaveBeenCalledWith("Solexpay Admin Portal");
  });

  it("should have sidebar closed initially", () => {
    expect(component.sidebarOpen()).toBe(false);
  });

  it("should open and close sidebar when events occur", () => {
    // Initially closed
    let overlay = fixture.debugElement.query(By.css(".fixed.inset-0.z-40"));
    expect(overlay).toBeNull();

    // Open sidebar
    component.sidebarOpen.set(true);
    fixture.detectChanges();

    overlay = fixture.debugElement.query(By.css(".fixed.inset-0.z-40"));
    expect(overlay).not.toBeNull();

    // Click overlay to close
    overlay.triggerEventHandler("click", null);
    fixture.detectChanges();

    expect(component.sidebarOpen()).toBe(false);
  });
});
