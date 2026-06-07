import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GlowEffectDirective } from "./glow-effect.directive";

@Component({
  standalone: true,
  imports: [GlowEffectDirective],
  template: `
    <div id="always" glowEffect="always" glowColor="#ff0000">Always</div>
    <div id="hover" glowEffect="hover">Hover</div>
  `,
})
class TestHostComponent {}

describe("GlowEffectDirective", () => {
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

  it("should apply animate-glow class and custom color property when glowEffect is always", () => {
    const el = fixture.debugElement.query(By.css("#always")).nativeElement;
    expect(el.classList.contains("animate-glow")).toBe(true);
    expect(el.style.getPropertyValue("--glow-color")).toBe("#ff0000");
  });

  it("should toggle animate-glow class on mouseenter and mouseleave when glowEffect is hover", () => {
    const el = fixture.debugElement.query(By.css("#hover")).nativeElement;
    expect(el.classList.contains("animate-glow")).toBe(false);

    // Trigger mouseenter
    el.dispatchEvent(new MouseEvent("mouseenter"));
    fixture.detectChanges();
    expect(el.classList.contains("animate-glow")).toBe(true);

    // Trigger mouseleave
    el.dispatchEvent(new MouseEvent("mouseleave"));
    fixture.detectChanges();
    expect(el.classList.contains("animate-glow")).toBe(false);
  });
});
