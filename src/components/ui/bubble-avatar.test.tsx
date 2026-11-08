import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BubbleAvatar, bubbleColourFor } from "./bubble-avatar";

describe("bubbleColourFor", () => {
  it("defaults to 'rose' when seed is empty or whitespace", () => {
    expect(bubbleColourFor("")).toBe("rose");
    expect(bubbleColourFor("   ")).toBe("rose");
    expect(bubbleColourFor("\n\t")).toBe("rose");
  });

  it("produces the same colour for 'Ada' and 'ada lovelace'", () => {
    expect(bubbleColourFor("Ada")).toBe("rose");
    expect(bubbleColourFor("ada lovelace")).toBe("rose");
    expect(bubbleColourFor("  ada   lovelace  ")).toBe("rose");
  });

  it("computes the exact colour for 'Chidi' and 'Ada'", () => {
    // "ada": 97 + 100 + 97 = 294; 294 % 6 = 0 -> "rose"
    expect(bubbleColourFor("Ada")).toBe("rose");

    // "chidi": 99 + 104 + 105 + 100 + 105 = 513; 513 % 6 = 3 -> "violet"
    expect(bubbleColourFor("Chidi")).toBe("violet");
  });
});

describe("BubbleAvatar", () => {
  it("renders a plain img with the computed bubble colour and size", () => {
    const { container } = render(<BubbleAvatar seed="Chidi" size={40} />);
    const img = container.querySelector("img");

    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "/avatars/bubble_violet.png");
    expect(img).toHaveAttribute("width", "40");
    expect(img).toHaveAttribute("height", "40");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("aria-hidden", "true");
  });

  it("renders with fallback 'rose' when seed is omitted", () => {
    const { container } = render(<BubbleAvatar />);
    const img = container.querySelector("img");

    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "/avatars/bubble_rose.png");
  });
});
