import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BounceOnDirective } from "./bounce-on.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [BounceOnDirective],
  template: `
    <div id="default" [bounceOn]="triggerDefault">Default</div>
    <div id="bounceIn" [bounceOn]="triggerBounceIn" bounceType="bounce-in">
      Bounce In
    </div>
  `,
})
class TestHostComponent {
  triggerDefault = false;
  triggerBounceIn = false;
}

describe("BounceOnDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should apply animate-bounce class when default bounceOn triggers, and remove it after 600ms", () => {
    const el = fixture.debugElement.query(By.css("#default")).nativeElement;
    expect(el.classList.contains("animate-bounce")).toBe(false);

    hostComponent.triggerDefault = true;
    fixture.detectChanges();
    expect(el.classList.contains("animate-bounce")).toBe(true);

    // Fast-forward 650ms using Vitest fake timers
    vi.advanceTimersByTime(650);
    fixture.detectChanges();
    expect(el.classList.contains("animate-bounce")).toBe(false);
  });

  it("should apply animate-bounce-in class when bounce-in bounceOn triggers, and remove it after 500ms", () => {
    const el = fixture.debugElement.query(By.css("#bounceIn")).nativeElement;
    expect(el.classList.contains("animate-bounce-in")).toBe(false);

    hostComponent.triggerBounceIn = true;
    fixture.detectChanges();
    expect(el.classList.contains("animate-bounce-in")).toBe(true);

    // Fast-forward 550ms
    vi.advanceTimersByTime(550);
    fixture.detectChanges();
    expect(el.classList.contains("animate-bounce-in")).toBe(false);
  });
});
