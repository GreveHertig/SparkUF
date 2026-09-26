import { describe, expect, it } from "vitest";
import { suggestEmailFix } from "./emailTypos";

describe("suggestEmailFix", () => {
  it.each([
    ["sara@gmial.com", "sara@gmail.com"],
    ["sara@gmal.com", "sara@gmail.com"],
    ["sara@gamil.com", "sara@gmail.com"],
    ["sara@gmail.con", "sara@gmail.com"],
    ["sara@hotmial.com", "sara@hotmail.com"],
    ["sara@outlok.com", "sara@outlook.com"],
    ["sara@iclod.com", "sara@icloud.com"],
    ["sara@icoud.com", "sara@icloud.com"],
    ["sara@icloud.cm", "sara@icloud.com"],
    [" Sara.L@GMIAL.COM ", "Sara.L@gmail.com"],
  ])("föreslår %s → %s", (typed, expected) => {
    expect(suggestEmailFix(typed)).toBe(expected);
  });

  it.each(["sara@gmail.com", "sara@hotmail.se", "sara@outlook.se", "sara@foretag.se", "sara@", "sara", "sara@gmial"])(
    "föreslår inget för %j",
    (typed) => {
      expect(suggestEmailFix(typed)).toBeNull();
    },
  );
});
