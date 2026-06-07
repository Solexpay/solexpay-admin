import "../../test";
import { TestBed, fakeAsync, tick, flush } from "@angular/core/testing";
import { ConfettiService } from "./confetti.service";

describe("ConfettiService", () => {
  let service: ConfettiService;

  let originalRAF: typeof window.requestAnimationFrame;
  let originalNow: typeof performance.now;
  let simulatedTime = 0;

  beforeEach(() => {
    simulatedTime = 1000;
    originalNow = performance.now;
    performance.now = () => simulatedTime;

    originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      // Advance simulated time by 16ms each frame
      simulatedTime += 16;
      return setTimeout(() => callback(simulatedTime), 16) as unknown as number;
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ConfettiService],
    });
    service = TestBed.inject(ConfettiService);
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRAF;
    performance.now = originalNow;
    // Clean up any remaining divs in document body if any
    document.body.innerHTML = "";
    TestBed.resetTestingModule();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create DOM element and particles for default celebrate options", fakeAsync(() => {
    service.celebrate({ duration: 1000, particleCount: 10 });

    // There should be a container div added to document.body
    const divs = document.body.querySelectorAll("div");
    expect(divs.length).toBeGreaterThan(0); // 1 container + particles

    // Flush all pending timers (including requestAnimationFrame loops)
    tick(1100);
    flush();

    const divsAfter = document.body.querySelectorAll("div");
    expect(divsAfter.length).toBe(0);
  }));

  it("should run preset functions without errors", fakeAsync(() => {
    service.quick();
    expect(document.body.querySelectorAll("div").length).toBeGreaterThan(0);
    tick(2100); // quick has duration 2000

    service.big();
    expect(document.body.querySelectorAll("div").length).toBeGreaterThan(0);
    tick(4100); // big has duration 4000

    service.success();
    expect(document.body.querySelectorAll("div").length).toBeGreaterThan(0);
    tick(3100); // success has duration 3000

    service.burst();
    expect(document.body.querySelectorAll("div").length).toBeGreaterThan(0);
    tick(3600); // burst has duration 3500

    flush();
  }));
});
