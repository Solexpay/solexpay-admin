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

  beforeEach(async () => {
    vi.useFakeTimers();
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
