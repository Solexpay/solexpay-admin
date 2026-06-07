import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ShakeOnErrorDirective } from "./shake-on-error.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [ShakeOnErrorDirective],
  template: `<div [shakeOnError]="hasError">Test</div>`,
})
class TestHostComponent {
  hasError = false;
}

describe("ShakeOnErrorDirective", () => {
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
      .query(By.directive(ShakeOnErrorDirective))
      .injector.get(ShakeOnErrorDirective);
    expect(directive).toBeTruthy();
  });

  it("should add shake class when shakeOnError is true", () => {
    hostComponent.hasError = true;
    fixture.detectChanges();

    expect(element.classList.contains("animate-shake")).toBe(true);

    // Fast-forward 500ms using Vitest fake timers
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(element.classList.contains("animate-shake")).toBe(false);
  });
});
