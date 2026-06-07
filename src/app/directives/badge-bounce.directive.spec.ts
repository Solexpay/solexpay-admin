import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BadgeBounceDirective } from "./badge-bounce.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [BadgeBounceDirective],
  template: `<div [badgeBounce]="trigger">Badge</div>`,
})
class TestHostComponent {
  trigger: number | boolean = false;
}

describe("BadgeBounceDirective", () => {
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

  it("should apply animate-badge-bounce when badgeBounce triggers, and remove it after 500ms", () => {
    expect(element.classList.contains("animate-badge-bounce")).toBe(false);

    hostComponent.trigger = 1;
    fixture.detectChanges();
    expect(element.classList.contains("animate-badge-bounce")).toBe(true);

    // Fast-forward 550ms
    vi.advanceTimersByTime(550);
    fixture.detectChanges();
    expect(element.classList.contains("animate-badge-bounce")).toBe(false);
  });
});
