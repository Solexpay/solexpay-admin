import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { HighlightNewDirective } from "./highlight-new.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [HighlightNewDirective],
  template: `<div [highlightNew]="isNew" [highlightDelay]="delay">Test</div>`,
})
class TestHostComponent {
  isNew = false;
  delay = 0;
}

describe("HighlightNewDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css("div")).nativeElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(HighlightNewDirective))
      .injector.get(HighlightNewDirective);
    expect(directive).toBeTruthy();
  });

  it("should add highlight class when highlightNew is true", () => {
    hostComponent.isNew = true;
    fixture.detectChanges();

    // Advance timer to trigger outer setTimeout
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(element.classList.contains("animate-highlight")).toBe(true);

    // Advance remaining 1500ms
    vi.advanceTimersByTime(1500);
    fixture.detectChanges();
    expect(element.classList.contains("animate-highlight")).toBe(false);
  });

  it("should delay highlight when highlightDelay is provided", () => {
    // Set delay first and run detectChanges so directive gets the delay value
    hostComponent.delay = 500;
    fixture.detectChanges();

    // Now trigger isNew
    hostComponent.isNew = true;
    fixture.detectChanges();

    // Advance 200ms (not yet reached 500ms delay)
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(element.classList.contains("animate-highlight")).toBe(false);

    // Advance remaining 300ms to trigger highlight
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(element.classList.contains("animate-highlight")).toBe(true);

    // Advance remaining duration (1500ms)
    vi.advanceTimersByTime(1500);
    fixture.detectChanges();
    expect(element.classList.contains("animate-highlight")).toBe(false);
  });
});
