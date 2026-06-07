import "../../../test";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { StatusChipComponent } from "./status-chip.component";

describe("StatusChipComponent", () => {
  let component: StatusChipComponent;
  let fixture: ComponentFixture<StatusChipComponent>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [StatusChipComponent],
    });
    fixture = TestBed.createComponent(StatusChipComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should return correct chip classes for statuses", () => {
    component.status = "SUCCESS";
    expect(component.chipClass).toBe(
      "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    );

    component.status = "PENDING";
    expect(component.chipClass).toBe(
      "bg-secondary-fixed text-on-secondary-fixed-variant",
    );

    component.status = "FAILED";
    expect(component.chipClass).toBe(
      "bg-error-container text-on-error-container",
    );

    component.status = "INACTIVE";
    expect(component.chipClass).toBe(
      "bg-surface-container-high text-on-surface-variant",
    );

    component.status = "UNKNOWN_STATUS";
    expect(component.chipClass).toBe(
      "bg-surface-container-high text-on-surface-variant",
    );
  });

  it("should render the status text", () => {
    component.status = "APPROVED";
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const span = compiled.querySelector("span");
    expect(span?.textContent?.trim()).toBe("APPROVED");
  });
});
