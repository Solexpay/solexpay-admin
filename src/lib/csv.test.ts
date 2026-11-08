import { describe, expect, it } from "vitest";
import { cell } from "./csv";

describe("CSV cell escaping", () => {
  it("quotes commas, quotes, and line breaks while doubling embedded quotes", () => {
    expect(cell('a,"b"\nc')).toBe('"a,""b""\nc"');
  });
  it("guards spreadsheet formulas", () => {
    expect(cell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
  });
  it("renders nullish values as empty cells", () => {
    expect(cell(null)).toBe("");
  });
});
