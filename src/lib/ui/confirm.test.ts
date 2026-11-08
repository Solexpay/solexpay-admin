import { beforeEach, describe, expect, it } from "vitest";
import {
  acceptConfirm,
  cancelConfirm,
  confirm,
  getLastConfirmReason,
} from "./confirm";

describe("Confirm store", () => {
  beforeEach(() => {
    cancelConfirm();
  });

  it("resolves true when acceptConfirm is called", async () => {
    const promise = confirm({
      title: "Confirm action?",
      message: "This cannot be undone.",
      tone: "danger",
    });

    acceptConfirm("Admin approved");
    const result = await promise;

    expect(result).toBe(true);
    expect(getLastConfirmReason()).toBe("Admin approved");
  });

  it("resolves false when cancelConfirm is called", async () => {
    const promise = confirm({
      title: "Confirm action?",
    });

    cancelConfirm();
    const result = await promise;

    expect(result).toBe(false);
  });

  it("superseded request resolves to false", async () => {
    const firstPromise = confirm({
      title: "First request",
    });

    const secondPromise = confirm({
      title: "Second request",
    });

    const firstResult = await firstPromise;
    expect(firstResult).toBe(false);

    acceptConfirm();
    const secondResult = await secondPromise;
    expect(secondResult).toBe(true);
  });
});
