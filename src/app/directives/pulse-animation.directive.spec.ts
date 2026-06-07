import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { PulseAnimationDirective } from "./pulse-animation.directive";

@Component({
  standalone: true,
  imports: [PulseAnimationDirective],
  template: `
    <div id="default" pulseAnimation="ring" pulseColor="#00ff00">Default</div>
    <div id="soft" pulseAnimation="soft">Soft</div>
  `,
})
class TestHostComponent {}

describe("PulseAnimationDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(PulseAnimationDirective))
      .injector.get(PulseAnimationDirective);
    expect(directive).toBeTruthy();
  });

  it("should apply animate-pulse-ring class and color custom property for default type", () => {
    const el = fixture.debugElement.query(By.css("#default")).nativeElement;
    expect(el.classList.contains("animate-pulse-ring")).toBe(true);
    expect(el.style.getPropertyValue("--pulse-color")).toBe("#00ff00");
  });

  it("should apply animate-pulse-soft class when type is soft", () => {
    const el = fixture.debugElement.query(By.css("#soft")).nativeElement;
    expect(el.classList.contains("animate-pulse-soft")).toBe(true);
    expect(el.classList.contains("animate-pulse-ring")).toBe(false);
  });
});
