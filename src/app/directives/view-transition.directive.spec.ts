import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ViewTransitionDirective } from "./view-transition.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [ViewTransitionDirective],
  template: `
    <div [viewTransition]="'custom-transition'" [transitionDuration]="500">
      Transition Me
    </div>
  `,
})
class TestHostComponent {}

describe("ViewTransitionDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let element: HTMLElement;
  let rafCallback: () => void;

  beforeEach(async () => {
    // Stub requestAnimationFrame to capture callback and call synchronously
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn().mockImplementation((cb) => {
        rafCallback = cb;
        return 1;
      }),
    );

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css("div")).nativeElement;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(ViewTransitionDirective))
      .injector.get(ViewTransitionDirective);
    expect(directive).toBeTruthy();
  });

  it("should set view transition name and transition styles on init", () => {
    expect(
      (element.style as CSSStyleDeclaration & { viewTransitionName?: string })
        .viewTransitionName,
    ).toBe("custom-transition");
    expect(element.style.transition).toContain(
      "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
    );
  });

  it("should set initial invisible styles on init", () => {
    expect(element.style.opacity).toBe("0");
    expect(element.style.transform).toContain("translateY(10px)");
    expect(element.style.transform).toContain("scale(0.98)");
  });

  it("should animate in by updating opacity and transform on requestAnimationFrame", () => {
    expect(rafCallback).toBeDefined();

    // Trigger the captured requestAnimationFrame callback
    rafCallback();
    fixture.detectChanges();

    expect(element.style.opacity).toBe("1");
    expect(element.style.transform).toBe("translateY(0) scale(1)");
  });
});
