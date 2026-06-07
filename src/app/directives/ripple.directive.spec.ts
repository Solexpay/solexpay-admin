import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { RippleDirective } from "./ripple.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [RippleDirective],
  template: `<button sosoleRipple id="button" solexRipple>Click me</button>`,
})
class TestHostComponent {}

describe("RippleDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let buttonEl: HTMLButtonElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    buttonEl = fixture.debugElement.query(By.css("#button")).nativeElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(RippleDirective))
      .injector.get(RippleDirective);
    expect(directive).toBeTruthy();
  });

  it("should create ripple span on click, and remove it after 600ms", () => {
    // Check initially no spans
    expect(buttonEl.querySelector("span")).toBeNull();

    // Mock getBoundingClientRect
    vi.spyOn(buttonEl, "getBoundingClientRect").mockReturnValue({
      width: 100,
      height: 40,
      left: 10,
      top: 10,
      right: 110,
      bottom: 50,
      x: 10,
      y: 10,
      toJSON: () => ({}),
    });

    // Dispatch a real click event
    const event = new MouseEvent("click", {
      clientX: 20,
      clientY: 20,
      bubbles: true,
    });
    buttonEl.dispatchEvent(event);
    fixture.detectChanges();

    // Span should be created
    const rippleSpan = buttonEl.querySelector("span");
    expect(rippleSpan).not.toBeNull();
    expect(rippleSpan!.style.position).toBe("absolute");
    expect(rippleSpan!.style.borderRadius).toBe("50%");

    // Fast-forward 650ms
    vi.advanceTimersByTime(650);
    fixture.detectChanges();

    // Span should be removed
    expect(buttonEl.querySelector("span")).toBeNull();
  });
});
