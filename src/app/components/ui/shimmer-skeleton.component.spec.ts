import "../../../test";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { ShimmerSkeletonComponent } from "./shimmer-skeleton.component";

describe("ShimmerSkeletonComponent", () => {
  let component: ShimmerSkeletonComponent;
  let fixture: ComponentFixture<ShimmerSkeletonComponent>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ShimmerSkeletonComponent],
    });
    fixture = TestBed.createComponent(ShimmerSkeletonComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should apply wrapperClass to the wrapper div", () => {
    component.wrapperClass = "h-10 w-full rounded";
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const wrapper = compiled.querySelector(".shimmer-wrapper");
    expect(wrapper?.classList.contains("h-10")).toBe(true);
    expect(wrapper?.classList.contains("w-full")).toBe(true);
    expect(wrapper?.classList.contains("rounded")).toBe(true);
  });
});
