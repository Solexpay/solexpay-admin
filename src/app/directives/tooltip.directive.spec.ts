import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TooltipDirective } from "./tooltip.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `
    <button
      id="btn"
      tooltip="Help info"
      tooltipPosition="bottom"
      [tooltipDelay]="200"
    >
      Hover me
    </button>
  `,
})
class TestHostComponent {}

describe("TooltipDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let buttonEl: HTMLButtonElement;
  // Each test starts well after the previous one's last tooltip closed,
  // so the "warm neighbour" shortcut doesn't leak between tests.
  let clock = Date.now();

  beforeEach(async () => {
    vi.useFakeTimers();
    clock += 10_000;
    vi.setSystemTime(clock);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    buttonEl = fixture.debugElement.query(By.css("#btn")).nativeElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any remaining tooltips from document body
    const tooltips = document.body.querySelectorAll(".animate-tooltip-in");
    tooltips.forEach((t) => t.remove());
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(TooltipDirective))
      .injector.get(TooltipDirective);
    expect(directive).toBeTruthy();
  });

  it("should show tooltip on focus, and remove it on blur", () => {
    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();

    buttonEl.dispatchEvent(new Event("focus"));
    fixture.detectChanges();

    const tooltip = document.body.querySelector(
      ".animate-tooltip-in",
    ) as HTMLElement;
    expect(tooltip).not.toBeNull();
    expect(tooltip.textContent).toBe("Help info");

    buttonEl.dispatchEvent(new Event("blur"));
    fixture.detectChanges();

    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();
  });

  it("should remove its tooltip when the host is destroyed", () => {
    buttonEl.dispatchEvent(new Event("focus"));
    expect(document.body.querySelector(".animate-tooltip-in")).not.toBeNull();

    fixture.destroy();

    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();
  });

  it("should not show a pending tooltip after the host is destroyed", () => {
    buttonEl.dispatchEvent(new MouseEvent("mouseenter"));
    fixture.destroy();
    vi.advanceTimersByTime(200);

    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();
  });

  it("should show tooltip on mouseenter after delay, and remove it on mouseleave", () => {
    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();

    buttonEl.dispatchEvent(new MouseEvent("mouseenter"));
    fixture.detectChanges();

    // Not shown immediately due to 200ms delay
    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();

    // Advance 250ms
    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    const tooltip = document.body.querySelector(".animate-tooltip-in");
    expect(tooltip).not.toBeNull();

    // Mouseleave
    buttonEl.dispatchEvent(new MouseEvent("mouseleave"));
    fixture.detectChanges();

    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();
  });

  it("should skip the delay right after another tooltip closed", () => {
    buttonEl.dispatchEvent(new Event("focus"));
    buttonEl.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(100);

    buttonEl.dispatchEvent(new MouseEvent("mouseenter"));

    expect(document.body.querySelector(".animate-tooltip-in")).not.toBeNull();
  });

  it("should describe its host while shown", () => {
    buttonEl.dispatchEvent(new Event("focus"));
    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(buttonEl.getAttribute("aria-describedby")).toBe(tooltip?.id);

    buttonEl.dispatchEvent(new Event("blur"));
    expect(buttonEl.hasAttribute("aria-describedby")).toBe(false);
  });

  it("should cancel tooltip delay if mouseleave occurs before show", () => {
    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();

    buttonEl.dispatchEvent(new MouseEvent("mouseenter"));
    fixture.detectChanges();

    // Advance 100ms
    vi.advanceTimersByTime(100);
    fixture.detectChanges();

    // Mouseleave before delay completes
    buttonEl.dispatchEvent(new MouseEvent("mouseleave"));
    fixture.detectChanges();

    // Advance remaining 150ms
    vi.advanceTimersByTime(150);
    fixture.detectChanges();

    // Tooltip should not be shown
    expect(document.body.querySelector(".animate-tooltip-in")).toBeNull();
  });
});
