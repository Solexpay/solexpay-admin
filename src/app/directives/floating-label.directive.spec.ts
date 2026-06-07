import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { FloatingLabelDirective } from "./floating-label.directive";

@Component({
  standalone: true,
  imports: [FloatingLabelDirective],
  template: `
    <div id="parent">
      <input id="input" floatingLabel placeholder="Enter name" />
    </div>
  `,
})
class TestHostComponent {}

describe("FloatingLabelDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let inputEl: HTMLInputElement;
  let parentEl: HTMLElement;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    inputEl = fixture.debugElement.query(By.css("#input")).nativeElement;
    parentEl = fixture.debugElement.query(By.css("#parent")).nativeElement;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(FloatingLabelDirective))
      .injector.get(FloatingLabelDirective);
    expect(directive).toBeTruthy();
  });

  it("should create label with placeholder text and remove placeholder attribute on init", () => {
    const label = parentEl.querySelector("label");
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe("Enter name");
    expect(inputEl.getAttribute("placeholder")).toBeNull();

    // Label should be in default position initially (not floating)
    expect(label!.style.top).toBe("50%");
  });

  it("should float label on focus and return on blur if input is empty", () => {
    const label = parentEl.querySelector("label")!;

    // Focus
    inputEl.dispatchEvent(new Event("focus"));
    fixture.detectChanges();
    expect(label.style.top).toBe("12px");
    expect(label.style.color).toBe("rgb(0, 91, 191)"); // #005bbf converted to RGB in JSDOM

    // Blur (empty)
    inputEl.dispatchEvent(new Event("blur"));
    fixture.detectChanges();
    expect(label.style.top).toBe("50%");
  });

  it("should keep label floating on blur if input has value", () => {
    const label = parentEl.querySelector("label")!;

    // Focus
    inputEl.dispatchEvent(new Event("focus"));
    fixture.detectChanges();
    expect(label.style.top).toBe("12px");

    // Input value
    inputEl.value = "John Doe";
    inputEl.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    // Blur
    inputEl.dispatchEvent(new Event("blur"));
    fixture.detectChanges();
    expect(label.style.top).toBe("12px"); // Still floating
  });
});
