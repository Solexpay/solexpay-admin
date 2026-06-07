import "../../../test";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { MetricCardComponent } from "./metric-card.component";

describe("MetricCardComponent", () => {
  let component: MetricCardComponent;
  let fixture: ComponentFixture<MetricCardComponent>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [MetricCardComponent],
    });
    fixture = TestBed.createComponent(MetricCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display compact numbers", () => {
    expect(component.compactValue(1500000)).toBe("1.5M");
    expect(component.compactValue(990)).toBe("990");
    expect(component.compactValue(2500)).toBe("2.5K");
    expect(component.compactValue(1800000000)).toBe("1.8B");
  });

  it("should compute correct border color class", () => {
    component.color = "primary";
    expect(component.borderColorClass).toBe("border-primary");

    component.color = "secondary";
    expect(component.borderColorClass).toBe("border-secondary");

    component.color = "tertiary";
    expect(component.borderColorClass).toBe("border-tertiary");

    component.color = "error";
    expect(component.borderColorClass).toBe("border-error");
  });

  it("should render details correctly", () => {
    component.label = "Total Earnings";
    component.value = 5000;
    component.prefix = "₦";
    component.suffix = "NGN";
    component.trend = -5.4;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("p")?.textContent?.trim()).toBe(
      "Total Earnings",
    );
    expect(
      compiled
        .querySelector("span.material-symbols-outlined")
        ?.textContent?.trim(),
    ).toBe("trending_down");
  });
});
