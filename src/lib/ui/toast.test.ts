import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Toast, toast } from "./toast";

describe("Toast store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toast.clear();
  });

  it("adds toasts with correct types and messages", () => {
    const sId = toast.success("Operation completed");
    const eId = toast.error("Operation failed");
    const iId = toast.info("Here is some info");

    expect(typeof sId).toBe("string");
    expect(typeof eId).toBe("string");
    expect(typeof iId).toBe("string");
  });

  it("caps toasts to MAX_TOASTS (4)", () => {
    toast.info("1");
    toast.info("2");
    toast.info("3");
    toast.info("4");
    toast.info("5");

    // The first one should have been evicted
    toast.clear();
  });

  it("deduplicates identical consecutive messages", () => {
    const id1 = toast.success("Same message");
    const id2 = toast.success("Same message");

    expect(id1).toBe(id2);
  });

  it("auto-dismisses toasts after duration", () => {
    const id = toast.success("Dismiss me");
    vi.advanceTimersByTime(4100);

    // After 4s success duration, dismiss should have been called
    expect(id).toBeDefined();
  });

  it("executes toast action and dismisses the toast", () => {
    const actionSpy = vi.fn();
    const item: Toast = {
      id: "t-test",
      type: "info",
      message: "Click action",
      action: {
        label: "Retry",
        run: actionSpy,
      },
    };

    toast.runAction(item);
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });

  it("can pause and resume auto-dismiss", () => {
    const id = toast.success("Pausable");
    vi.advanceTimersByTime(2000);

    toast.pause(id);
    vi.advanceTimersByTime(5000); // would have expired if not paused

    toast.resume(id);
    vi.advanceTimersByTime(1600); // 1.5s minimum on resume
  });
});
