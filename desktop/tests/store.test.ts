import { describe, expect, it } from "vitest";
import { decode, fresh, record } from "../src/store";

describe("saved progress", () => {
  it("counts each discovered pitch once and preserves valid progress", () => {
    const profile = record(fresh(), 7, true, "ear");
    const restored = decode(JSON.stringify({
      ...profile,
      learned: [7, 7, 0, -1, 12, "4", null],
    }));
    expect(restored.learned).toEqual([7, 0]);
    expect(restored.attempts).toEqual(profile.attempts);
  });

  it("excludes impossible dates from accuracy and daily activity", () => {
    const attempt = { target: 0, right: true, mode: "ear" };
    const restored = decode(JSON.stringify({
      ...fresh(),
      attempts: ["2026-02-30", "2026-13-01", "2024-02-29", "2026-09-30"]
        .map(day => ({ ...attempt, day })),
    }));
    expect(restored.attempts.map(a => a.day)).toEqual(["2024-02-29", "2026-09-30"]);
  });

  it("does not let staff or microphone answers change ear-training difficulty", () => {
    const missed = record(fresh(), 0, false, "ear");
    const played = record(missed, 0, true, "play");
    const read = record(played, 7, false, "staff");
    expect(read.errors).toEqual(missed.errors);
    expect(read.attempts).toHaveLength(3);
    expect(record(read, 0, true, "ear").errors[0]).toBe(1);
  });
});
