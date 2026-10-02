import { arrangement, chords } from "./music";
import type { Tuning } from "./tuning";

export const maxChanges = 32;
export interface ChordChange {
  root: number;
  chord: string;
}
export interface SongChart {
  title: string;
  changes: ChordChange[];
}
export const emptySong = (): SongChart => ({
  title: "My chord changes",
  changes: [],
});

export function decodeSong(value: unknown): SongChart {
  if (!value || typeof value !== "object") return emptySong();
  const song = value as Partial<SongChart>;
  return {
    title:
      typeof song.title === "string"
        ? song.title.slice(0, 60)
        : emptySong().title,
    changes: Array.isArray(song.changes)
      ? song.changes
          .filter(
            (change) =>
              change &&
              Number.isInteger(change.root) &&
              change.root >= 0 &&
              change.root < 12 &&
              chords.some((p) => p.name === change.chord),
          )
          .slice(0, maxChanges)
          .map(({ root, chord }) => ({ root, chord }))
      : [],
  };
}

export function arrangeChange(
  change: ChordChange,
  tuning: Tuning,
  written: boolean,
) {
  const pattern = chords.find((p) => p.name === change.chord) ?? chords[0];
  const tones = arrangement(change.root, pattern, tuning, written);
  return { tones, symbol: `${tones[0].name}${pattern.symbol ?? ""}`, pattern };
}

export function moveChange(changes: ChordChange[], from: number, to: number) {
  if (from < 0 || from >= changes.length || to < 0 || to >= changes.length)
    return changes;
  const result = [...changes];
  const [change] = result.splice(from, 1);
  result.splice(to, 0, change);
  return result;
}
