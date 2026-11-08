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
    expect(component.chipClass).toBe("ui-badge-success");

    component.status = "PENDING";
    expect(component.chipClass).toBe("ui-badge-warning");

    component.status = "FAILED";
    expect(component.chipClass).toBe("ui-badge-danger");

    component.status = "INACTIVE";
    expect(component.chipClass).toBe("ui-badge-neutral");

    component.status = "UNKNOWN_STATUS";
    expect(component.chipClass).toBe("ui-badge-neutral");
  });

  it("should render the status text", () => {
    fixture.componentRef.setInput("status", "APPROVED");
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const span = compiled.querySelector("span");
    expect(span?.textContent?.trim()).toBe("Approved");
    expect(span?.className).toContain("ui-badge-success");

    fixture.componentRef.setInput("status", "UNDER_REVIEW");
    fixture.detectChanges();
    expect(span?.textContent?.trim()).toBe("Under review");
  });
});
