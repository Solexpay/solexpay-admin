import { vi } from "vitest";
import { Router } from "@angular/router";
import { AuthService } from "../app/services/auth.service";
import { ToastService } from "../app/services/toast.service";

export const mockRouter = () => ({
  provide: Router,
  useValue: { navigate: vi.fn() },
});

export const mockAuthService = () => ({
  provide: AuthService,
  useValue: {
    isAuthenticated: vi.fn().mockReturnValue(true),
    currentUser: vi.fn().mockReturnValue({ firstName: "Test", role: "ADMIN" }),
    logout: vi.fn(),
  },
});

export const mockToastService = () => ({
  provide: ToastService,
  useValue: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
});
