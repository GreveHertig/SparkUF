import { describe, expect, it } from "vitest";
import { sizeClassFor } from "./sizeClass";

describe("sizeClassFor", () => {
  it.each([
    [1, "1–4"],
    [5, "5–9"],
    [9, "5–9"],
    [10, "10–19"],
    [19, "10–19"],
    [20, "20–49"],
    [250, "50+"],
  ])("%i anställda ligger i klassen %s", (employees, range) => {
    expect(sizeClassFor(employees)?.range).toBe(range);
  });

  it("ger ingen klass för 0 eller negativa tal", () => {
    expect(sizeClassFor(0)).toBeNull();
    expect(sizeClassFor(-3)).toBeNull();
  });
});
