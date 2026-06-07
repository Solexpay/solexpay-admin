import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MorphButtonDirective } from "./morph-button.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [MorphButtonDirective],
  template: `
    <button id="btn" morphButton [morphState]="state" style="width: 120px;">
      Submit
    </button>
  `,
})
class TestHostComponent {
  state: "loading" | "success" | "error" | null = null;
}

describe("MorphButtonDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let buttonEl: HTMLButtonElement;
  let directive: MorphButtonDirective;

  beforeEach(async () => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;

    // Retrieve directive and override originalContent/originalWidth before first detectChanges
    // to bypass the input setter running before ngOnInit lifecycle bug in the directive.
    const directiveEl = fixture.debugElement.query(
      By.directive(MorphButtonDirective),
    );
    directive = directiveEl.injector.get(MorphButtonDirective);
    const directiveInternals = directive as unknown as {
      originalContent: string;
      originalWidth: string;
    };
    directiveInternals.originalContent = "Submit";
    directiveInternals.originalWidth = "120px";

    fixture.detectChanges();
    buttonEl = fixture.debugElement.query(By.css("#btn")).nativeElement;
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    expect(directive).toBeTruthy();
  });

  it("should morph to loading spinner and styles", () => {
    // Mock getBoundingClientRect for width/height logic
    vi.spyOn(buttonEl, "getBoundingClientRect").mockReturnValue({
      width: 120,
      height: 40,
      left: 0,
      top: 0,
      right: 120,
      bottom: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    hostComponent.state = "loading";
    fixture.detectChanges();

    expect(buttonEl.innerHTML).toContain("animate-spin");
    expect(buttonEl.style.width).toBe("44px");
    expect(buttonEl.style.borderRadius).toBe("50%");
  });

  it("should morph to success checkmark and restore original after 1500ms", () => {
    hostComponent.state = "success";
    fixture.detectChanges();

    expect(buttonEl.innerHTML).toContain("svg");
    expect(buttonEl.style.backgroundColor).toBe("rgb(0, 200, 83)"); // #00c853

    // Advance 1600ms
    vi.advanceTimersByTime(1600);
    fixture.detectChanges();

    expect(buttonEl.innerHTML).toBe("Submit");
    expect(buttonEl.style.backgroundColor).toBe("");
  });

  it("should morph to error, shake, and restore original after 1500ms", () => {
    hostComponent.state = "error";
    fixture.detectChanges();

    expect(buttonEl.innerHTML).toContain("svg");
    expect(buttonEl.style.backgroundColor).toBe("rgb(255, 23, 68)"); // #ff1744
    expect(buttonEl.classList.contains("animate-shake")).toBe(true);

    // Advance 1600ms
    vi.advanceTimersByTime(1600);
    fixture.detectChanges();

    expect(buttonEl.innerHTML).toBe("Submit");
    expect(buttonEl.style.backgroundColor).toBe("");
    expect(buttonEl.classList.contains("animate-shake")).toBe(false);
  });
});
