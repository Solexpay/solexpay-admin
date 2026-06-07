import "../../test";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { CountUpDirective } from "./count-up.directive";
import { vi } from "vitest";

@Component({
  standalone: true,
  imports: [CountUpDirective],
  template: `
    <div id="default" [countUp]="1000" [duration]="1000">0</div>
    <div
      id="custom"
      [countUp]="5000"
      prefix="$"
      suffix="USD"
      [compact]="true"
      [duration]="1000"
    >
      0
    </div>
  `,
})
class TestHostComponent {}

describe("CountUpDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should create directive", () => {
    const directive = fixture.debugElement
      .query(By.directive(CountUpDirective))
      .injector.get(CountUpDirective);
    expect(directive).toBeTruthy();
  });

  it("should animate number counting up to target and apply formatting", () => {
    const el = fixture.debugElement.query(By.css("#default")).nativeElement;

    // Advance 500ms
    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    // Intermediate value should be formatted to Nigerian currency format (toLocaleString)
    expect(el.textContent).not.toBe("0");
    expect(el.textContent).not.toBe("1,000");

    // Advance remaining duration to reach target
    vi.advanceTimersByTime(550);
    fixture.detectChanges();

    expect(el.textContent).toBe("1,000");
  });

  it("should apply custom prefix, suffix, and compact format", () => {
    const el = fixture.debugElement.query(By.css("#custom")).nativeElement;

    // Fast-forward to end
    vi.advanceTimersByTime(1100);
    fixture.detectChanges();

    expect(el.textContent).toBe("$5.0KUSD");
  });
});
