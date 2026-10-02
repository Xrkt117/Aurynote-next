import { describe, expect, it } from "vitest";
import {
  arrangeChange,
  decodeSong,
  emptySong,
  maxChanges,
  moveChange,
} from "../src/progression";
import { decode, fresh } from "../src/store";

describe("song chord changes", () => {
  it("spells extended and altered chords by degree", () => {
    const tones = arrangeChange(
      { root: 0, chord: "Dominant thirteenth" },
      "c",
      true,
    ).tones;
    expect(tones.map((t) => t.name)).toEqual(["C", "E", "G", "B♭", "D", "A"]);
    expect(tones.map((t) => t.degree)).toEqual([
      "1",
      "3",
      "5",
      "♭7",
      "9",
      "13",
    ]);
    expect(
      arrangeChange(
        { root: 0, chord: "Diminished seventh" },
        "c",
        true,
      ).tones.map((t) => t.name),
    ).toEqual(["C", "E♭", "G♭", "B♭♭"]);
  });

  it("transposes written symbols and notes without changing the sound", () => {
    const change = { root: 0, chord: "Dominant seventh" };
    const written = arrangeChange(change, "tenor", true);
    const concert = arrangeChange(change, "tenor", false);
    expect(written.symbol).toBe("D7");
    expect(written.tones.map((t) => t.name)).toEqual(["D", "F♯", "A", "C"]);
    expect(concert.symbol).toBe("C7");
    expect(written.tones.map((t) => t.sound)).toEqual(
      concert.tones.map((t) => t.sound),
    );
  });

  it("moves duplicate chords by position without losing changes", () => {
    const changes = [
      { root: 0, chord: "Major" },
      { root: 7, chord: "Dominant seventh" },
      { root: 0, chord: "Major" },
    ];
    expect(moveChange(changes, 1, 0)).toEqual([
      changes[1],
      changes[0],
      changes[2],
    ]);
    expect(moveChange(changes, 0, -1)).toBe(changes);
    expect(changes[0].root).toBe(0);
  });

  it("restores a saved chart and defaults older profiles safely", () => {
    const song = {
      title: "My tune",
      changes: [{ root: 2, chord: "Minor seventh" }],
    };
    expect(decode(JSON.stringify({ ...fresh(), song })).song).toEqual(song);
    expect(decode(JSON.stringify({ version: 2 })).song).toEqual(emptySong());
    expect(
      decodeSong({
        title: 5,
        changes: [
          null,
          { root: 12, chord: "Major" },
          { root: 0, chord: "unknown" },
          ...song.changes,
        ],
      }),
    ).toEqual({ title: "My chord changes", changes: song.changes });
    expect(
      decodeSong({
        title: "x".repeat(80),
        changes: Array(80).fill(song.changes[0]),
      }).changes,
    ).toHaveLength(maxChanges);
  });
});
