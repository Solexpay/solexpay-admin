import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { CopyToClipboardDirective } from "./copy-to-clipboard.directive";
import { ToastService } from "../services/toast.service";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [CopyToClipboardDirective],
  template: `
    <div id="default" copyToClipboard>Text to copy</div>
    <button id="custom" [copyToClipboard]="customValue">Button</button>
  `,
})
class TestHostComponent {
  customValue = "Custom Value";
}

describe("CopyToClipboardDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let mockToast: { show: ReturnType<typeof vi.fn> };
  let clipboardSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();

    mockToast = {
      show: vi.fn(),
    };

    // Mock navigator.clipboard
    clipboardSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: clipboardSpy,
      },
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: ToastService, useValue: mockToast }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(CopyToClipboardDirective))
      .injector.get(CopyToClipboardDirective);
    expect(directive).toBeTruthy();
  });

  it("should copy textContent if no custom text is provided, show success toast, and apply feedback classes", async () => {
    const el = fixture.debugElement.query(By.css("#default")).nativeElement;

    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    fixture.detectChanges();

    // Since copyToClipboard is async, wait for the promises to resolve
    await fixture.whenStable();
    fixture.detectChanges();

    expect(clipboardSpy).toHaveBeenCalledWith("Text to copy");
    expect(el.classList.contains("animate-copy-feedback")).toBe(true);
    expect(mockToast.show).toHaveBeenCalledWith(
      "success",
      "Copied to clipboard!",
    );

    // Fast-forward 350ms
    vi.advanceTimersByTime(350);
    fixture.detectChanges();

    expect(el.classList.contains("animate-copy-feedback")).toBe(false);
  });

  it("should copy custom text if provided", async () => {
    const el = fixture.debugElement.query(By.css("#custom")).nativeElement;

    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(clipboardSpy).toHaveBeenCalledWith("Custom Value");
  });

  it("should show error toast if copying fails", async () => {
    clipboardSpy.mockRejectedValue(new Error("Write permission denied"));
    const el = fixture.debugElement.query(By.css("#default")).nativeElement;

    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockToast.show).toHaveBeenCalledWith("error", "Failed to copy");
  });
});
