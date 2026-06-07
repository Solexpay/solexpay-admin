import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { HoverScaleDirective } from "./hover-scale.directive";

@Component({
  standalone: true,
  imports: [HoverScaleDirective],
  template: `
    <div id="default" hoverScale>Test 1</div>
    <div id="small" hoverScale="sm">Test 2</div>
    <div id="lift" hoverScale [hoverLift]="true">Test 3</div>
  `,
})
class TestHostComponent {}

describe("HoverScaleDirective", () => {
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

  it("should apply correct classes for default hoverScale", () => {
    const el = fixture.debugElement.query(By.css("#default")).nativeElement;
    expect(el.classList.contains("hover-scale")).toBe(true);
    expect(el.classList.contains("hover-scale-sm")).toBe(false);
    expect(el.style.cursor).toBe("pointer");
  });

  it("should apply hover-scale-sm class when size is sm", () => {
    const el = fixture.debugElement.query(By.css("#small")).nativeElement;
    expect(el.classList.contains("hover-scale")).toBe(true);
    expect(el.classList.contains("hover-scale-sm")).toBe(true);
  });

  it("should apply hover-lift and remove hover-scale when hoverLift is true", () => {
    const el = fixture.debugElement.query(By.css("#lift")).nativeElement;
    expect(el.classList.contains("hover-lift")).toBe(true);
    expect(el.classList.contains("hover-scale")).toBe(false);
  });
});
