import "../../../test";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ToastOutletComponent } from "./toast-outlet.component";
import { ToastService, Toast } from "../../services/toast.service";
import { vi } from "vitest";
import { signal } from "@angular/core";

describe("ToastOutletComponent", () => {
  let component: ToastOutletComponent;
  let fixture: ComponentFixture<ToastOutletComponent>;
  let mockToastService: {
    toasts: ReturnType<typeof signal<Toast[]>>;
    dismiss: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    mockToastService = {
      toasts: signal<Toast[]>([]),
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ToastOutletComponent],
      providers: [{ provide: ToastService, useValue: mockToastService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastOutletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create toast outlet component", () => {
    expect(component).toBeTruthy();
  });

  it("should render no toasts initially", () => {
    const toastContainers = fixture.debugElement.queryAll(
      By.css(".flex.items-center"),
    );
    expect(toastContainers.length).toBe(0);
  });

  it("should render toasts and dismiss them", () => {
    const testToasts: Toast[] = [
      { id: "1", type: "success", message: "Task succeeded" },
      { id: "2", type: "error", message: "Task failed" },
    ];
    mockToastService.toasts.set(testToasts);
    fixture.detectChanges();

    const toastContainers = fixture.debugElement.queryAll(
      By.css(".flex.items-center"),
    );
    expect(toastContainers.length).toBe(2);

    console.log(
      "RENDERED TOAST 1 HTML:",
      toastContainers[0]!.nativeElement.outerHTML,
    );
    console.log(
      "RENDERED TOAST 2 HTML:",
      toastContainers[1]!.nativeElement.outerHTML,
    );

    expect(toastContainers[0]!.nativeElement.textContent).toContain(
      "Task succeeded",
    );
    expect(toastContainers[0]!.nativeElement.className).toContain("flex");
    expect(toastContainers[0]!.nativeElement.className).toContain(
      "items-center",
    );

    expect(toastContainers[1]!.nativeElement.textContent).toContain(
      "Task failed",
    );
    expect(toastContainers[1]!.nativeElement.className).toContain("flex");
    expect(toastContainers[1]!.nativeElement.className).toContain(
      "items-center",
    );

    // Click dismiss button of first toast
    const dismissBtns = fixture.debugElement.queryAll(By.css("button"));
    dismissBtns[0]!.triggerEventHandler("click", null);
    expect(mockToastService.dismiss).toHaveBeenCalledWith("1");
  });
});
