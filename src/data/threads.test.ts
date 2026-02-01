import { expect, test } from "bun:test";
import { formatUsername } from "./threads";
import { UnicodePeriod } from "../style";

test("usernames are formatted correctly", () => {
  const values = {
    noryasta: "noryasta",
    "jules.jpg": `jules${UnicodePeriod}jpg`,
    ___thatonegamer: "___thatonegamer",
    _thegodminecraft_: "_thegodminecraft_",
    "": "unknown",
  };

  for (const [input, expectation] of Object.entries(values)) {
    expect(formatUsername(input)).toBe(expectation);
  }
});
