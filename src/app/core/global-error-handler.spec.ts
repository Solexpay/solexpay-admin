import "../../test";
import { TestBed } from "@angular/core/testing";
import { GlobalErrorHandler } from "./global-error-handler";
import { ToastService } from "../services/toast.service";
import { vi } from "vitest";

describe("GlobalErrorHandler", () => {
  let errorHandler: GlobalErrorHandler;
  let toastService: ToastService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        {
          provide: ToastService,
          useValue: {
            show: vi.fn(),
          },
        },
      ],
    });

    errorHandler = TestBed.inject(GlobalErrorHandler);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    TestBed.resetTestingModule();
  });

  it("should be created", () => {
    expect(errorHandler).toBeTruthy();
  });

  it("should catch string errors and toast them", () => {
    errorHandler.handleError("Custom String Error");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Unhandled Global Exception Caught:",
      "Custom String Error",
    );
    expect(toastService.show).toHaveBeenCalledWith(
      "error",
      "Custom String Error",
    );
  });

  it("should handle AppError objects with message property", () => {
    const errorObj = { message: "Failed to complete transaction" };
    errorHandler.handleError(errorObj);
    expect(toastService.show).toHaveBeenCalledWith(
      "error",
      "Failed to complete transaction",
    );
  });

  it("should handle AppError objects with nested error message", () => {
    const errorObj = { error: { message: "Database failure" } };
    errorHandler.handleError(errorObj);
    expect(toastService.show).toHaveBeenCalledWith("error", "Database failure");
  });

  it("should handle AppError objects with error as string", () => {
    const errorObj = { error: "Network Connection Timeout" };
    errorHandler.handleError(errorObj);
    expect(toastService.show).toHaveBeenCalledWith(
      "error",
      "Network Connection Timeout",
    );
  });

  it("should fall back to default message if error format is unrecognized", () => {
    errorHandler.handleError(null);
    expect(toastService.show).toHaveBeenCalledWith(
      "error",
      "An unexpected error occurred.",
    );
  });
});
