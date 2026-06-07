import "../../test";
import { vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { firstValueFrom } from "rxjs";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    const mockRouter = { navigate: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        AuthService,
        { provide: Router, useValue: mockRouter },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should login and set session", async () => {
    expect(service.isAuthenticated()).toBe(false);
    const res = await firstValueFrom(
      service.login({ email: "admin@test.com", password: "password" }),
    );
    expect(res.token).toBe("dev.mock.jwt.token");
    expect(service.isAuthenticated()).toBe(true);
  });

  it("should logout and clear session", () => {
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
  });
});
