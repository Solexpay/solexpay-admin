import "../../test";
import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { ToastService } from "./toast.service";

describe("ToastService", () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  it("should show a toast and dismiss it after 4 seconds", fakeAsync(() => {
    service.show("success", "Operation completed");

    const currentToasts = service.toasts();
    expect(currentToasts.length).toBe(1);
    expect(currentToasts[0]!.type).toBe("success");
    expect(currentToasts[0]!.message).toBe("Operation completed");
    expect(currentToasts[0]!.id).toBeDefined();

    // Advance time by 4000ms to test auto-dismiss
    tick(4000);
    expect(service.toasts().length).toBe(0);
  }));

  it("should allow manual dismissal of a toast", () => {
    service.show("error", "Something went wrong");
    const currentToasts = service.toasts();
    expect(currentToasts.length).toBe(1);

    const id = currentToasts[0]!.id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });
});
