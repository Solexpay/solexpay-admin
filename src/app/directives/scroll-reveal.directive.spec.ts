import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ScrollRevealDirective } from "./scroll-reveal.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `<div scrollReveal>Reveal me</div>`,
})
class TestHostComponent {}

type IntersectionCallback = (
  entries: { isIntersecting: boolean; target: Element }[],
) => void;

describe("ScrollRevealDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let element: HTMLElement;
  let observerCallback: IntersectionCallback;

  beforeEach(async () => {
    // Mock IntersectionObserver and capture callback to trigger manually
    window.IntersectionObserver = class {
      constructor(callback: IntersectionCallback) {
        observerCallback = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as unknown as typeof IntersectionObserver;

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css("div")).nativeElement;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(ScrollRevealDirective))
      .injector.get(ScrollRevealDirective);
    expect(directive).toBeTruthy();
  });

  it("should set initial invisible styles on init", () => {
    expect(element.style.opacity).toBe("0");
    expect(element.style.transform).toBe("translateY(24px)");
  });

  it("should reveal element by changing styles when it intersects", () => {
    // Simulate intersection
    observerCallback([{ isIntersecting: true, target: element }]);
    fixture.detectChanges();

    expect(element.style.opacity).toBe("1");
    expect(element.style.transform).toBe("translateY(0)");
  });
});
