import "../../test";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { Router } from "@angular/router";
import { LoginPageComponent } from "./login.page";
import { AuthService } from "../services/auth.service";
import { ToastService } from "../services/toast.service";
import { of, throwError } from "rxjs";
import { vi, type Mocked } from "vitest";

describe("LoginPageComponent - TOTP Enrollment Flow", () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authService: Mocked<AuthService>;
  let router: Router;
  let toastService: ToastService;

  const mockEnrollData = {
    secret: "JBSWY3DPEHPK3PXP",
    otpauthUrl:
      "otpauth://totp/SolexPay:admin@solexpay.com?secret=JBSWY3DPEHPK3PXP&issuer=SolexPay",
  };

  const mockConfirmSuccess = {
    token: "confirmed.access.jwt",
    refreshToken: "confirmed.refresh.jwt",
    expiresIn: 900,
    admin: {
      id: "adm-1",
      email: "admin@solexpay.com",
      firstName: "Admin",
      lastName: "User",
      role: "OPS",
    },
    user: {
      id: "adm-1",
      email: "admin@solexpay.com",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: vi.fn(),
      enrollTotp: vi.fn().mockReturnValue(of(mockEnrollData)),
      confirmTotp: vi.fn().mockReturnValue(of(mockConfirmSuccess)),
    };

    const mockToastService = {
      show: vi.fn(),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as Mocked<AuthService>;
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should transition to TOTP enrollment view when login returns enrollmentRequired", () => {
    authService.login.mockReturnValue(
      of({
        enrollmentRequired: true,
        enrollmentToken: "enroll-tok-999",
      }),
    );

    component.form.controls.email.setValue("admin@solexpay.com");
    component.form.controls.password.setValue("Password123!");

    component.login();
    fixture.detectChanges();

    // Must be in enrollment state
    expect(component.isEnrolling()).toBe(true);
    expect(component.enrollmentToken()).toBe("enroll-tok-999");
    expect(authService.enrollTotp).toHaveBeenCalledWith("enroll-tok-999");
    expect(component.enrollData()).toEqual(mockEnrollData);

    // Template displays the secret and otpauthUrl as text
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Setup Two-Factor Auth");
    expect(compiled.textContent).toContain(mockEnrollData.secret);
    expect(compiled.textContent).toContain(mockEnrollData.otpauthUrl);
  });

  it("should confirm enrollment code and navigate to /dashboard on success", () => {
    const navSpy = vi.spyOn(router, "navigate");

    // Put component into enrollment state
    component.isEnrolling.set(true);
    component.enrollmentToken.set("enroll-tok-999");
    component.enrollData.set(mockEnrollData);
    component.enrollConfirmCode.set("123456");

    component.confirmEnrollment();

    expect(authService.confirmTotp).toHaveBeenCalledWith(
      "enroll-tok-999",
      "123456",
    );
    expect(component.isEnrolling()).toBe(false);
    expect(toastService.show).toHaveBeenCalledWith(
      "success",
      "Two-factor authentication configured! Welcome.",
    );
    expect(navSpy).toHaveBeenCalledWith(["/dashboard"]);
  });

  it("should show error toast if confirm TOTP fails", () => {
    authService.confirmTotp.mockReturnValue(
      throwError(() => ({ error: { message: "Invalid code" } })),
    );

    component.isEnrolling.set(true);
    component.enrollmentToken.set("enroll-tok-999");
    component.enrollData.set(mockEnrollData);
    component.enrollConfirmCode.set("000000");

    component.confirmEnrollment();

    expect(component.isConfirmingEnroll()).toBe(false);
    expect(toastService.show).toHaveBeenCalledWith("error", "Invalid code");
    expect(component.isEnrolling()).toBe(true);
  });

  it("should directly login without enrollment if login response has token", () => {
    const navSpy = vi.spyOn(router, "navigate");
    authService.login.mockReturnValue(of(mockConfirmSuccess));

    component.form.controls.email.setValue("admin@solexpay.com");
    component.form.controls.password.setValue("Password123!");
    component.form.controls.totpCode.setValue("654321");

    component.login();

    expect(authService.login).toHaveBeenCalledWith(
      {
        email: "admin@solexpay.com",
        password: "Password123!",
        totpCode: "654321",
      },
      "ADMIN",
    );
    expect(component.isEnrolling()).toBe(false);
    expect(navSpy).toHaveBeenCalledWith(["/dashboard"]);
  });
});
