import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MagneticDirective } from "./magnetic.directive";

@Component({
  standalone: true,
  imports: [MagneticDirective],
  template: `<div magnetic style="width: 200px; height: 100px;">
    Magnetic Box
  </div>`,
})
class TestHostComponent {}

describe("MagneticDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css("div")).nativeElement;

    // Mock getBoundingClientRect for JSDOM
    element.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      right: 300,
      bottom: 200,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(MagneticDirective))
      .injector.get(MagneticDirective);
    expect(directive).toBeTruthy();
  });

  it("should apply transition on mouseenter", () => {
    element.dispatchEvent(new MouseEvent("mouseenter"));
    fixture.detectChanges();

    expect(element.style.transition).toContain("transform 0.1s ease-out");
  });

  it("should translate element on mousemove based on cursor position", () => {
    // clientX = 150 (relative center is -50)
    // clientY = 130 (relative center is -20)
    // strength = 0.3
    // expected x translation = -50 * 0.3 = -15px
    // expected y translation = -20 * 0.3 = -6px
    element.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 150,
        clientY: 130,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    expect(element.style.transform).toBe("translate(-15px, -6px)");
  });

  it("should reset transform on mouseleave", () => {
    element.dispatchEvent(new MouseEvent("mouseleave"));
    fixture.detectChanges();

    expect(element.style.transform).toBe("translate(0, 0)");
    expect(element.style.transition).toContain(
      "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    );
  });
});
