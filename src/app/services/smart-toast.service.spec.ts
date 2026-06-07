import "../../test";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { vi } from "vitest";
import { SmartToastService } from "./smart-toast.service";
import { ToastService } from "./toast.service";

describe("SmartToastService", () => {
  let service: SmartToastService;
  let toastService: ToastService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SmartToastService,
        {
          provide: ToastService,
          useValue: {
            show: vi.fn(),
            dismiss: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(SmartToastService);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should show toast with undo message and handle undo click", () => {
    const undoFn = vi.fn();
    const actionId = service.showWithUndo("Settings saved", undoFn);

    expect(toastService.show).toHaveBeenCalledWith(
      "info",
      "Settings saved (Click to undo)",
    );
    expect(actionId).toBeDefined();

    // Trigger undo
    const undone = service.undo(actionId);
    expect(undone).toBe(true);
    expect(undoFn).toHaveBeenCalled();
    expect(toastService.show).toHaveBeenCalledWith("success", "Action undone");
  });

  it("should handle undo timeout removal", fakeAsync(() => {
    const undoFn = vi.fn();
    const actionId = service.showWithUndo("Settings saved", undoFn, 3000);

    tick(3000);

    // After timeout, undo should return false and not call undoFn
    const undone = service.undo(actionId);
    expect(undone).toBe(false);
    expect(undoFn).not.toHaveBeenCalled();
  }));

  it("should confirm action after 3 seconds", fakeAsync(() => {
    const confirmFn = vi.fn();
    service.confirmAction("Are you sure?", confirmFn);

    expect(toastService.show).toHaveBeenCalledWith("info", "Are you sure?");
    expect(confirmFn).not.toHaveBeenCalled();

    tick(3000);
    expect(confirmFn).toHaveBeenCalled();
  }));
});
