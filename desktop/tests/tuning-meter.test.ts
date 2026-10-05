import { describe, expect, it } from "vitest";
import { centsFromTarget } from "../src/audio";
describe("cents from target", () => {
  it("measures against the target, not the nearest note", () => {
    expect(centsFromTarget({ midi: 60, cents: 0 }, 60)).toBe(0);
    expect(centsFromTarget({ midi: 62, cents: 0 }, 60)).toBe(200);
    expect(centsFromTarget({ midi: 59, cents: 10 }, 60)).toBe(-90);
    expect(centsFromTarget({ midi: 60, cents: -34 }, 60)).toBe(-34);
    expect(centsFromTarget({ midi: 72, cents: 0 }, 60)).toBe(1200);
  });
});
