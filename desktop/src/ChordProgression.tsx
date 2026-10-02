import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Music2,
  Pencil,
  Play,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import { useStudio } from "./context";
import { voice } from "./audio";
import { chords, notes, noteName } from "./music";
import {
  arrangeChange,
  maxChanges,
  moveChange,
  type ChordChange,
} from "./progression";
import ProgressionChart from "./ProgressionChart";

export default function ChordProgression() {
  const { profile, setProfile, notify, practicePaused } = useStudio();
  const { song } = profile;
  const [root, setRoot] = useState(0);
  const [chord, setChord] = useState(chords[0].name);
  const [editing, setEditing] = useState<number | null>(null);
  const [active, setActive] = useState(-1);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const chart = useRef<SVGSVGElement>(null);
  const composer = useRef<HTMLFormElement>(null);
  const generation = useRef(0);
  function stop() {
    generation.current++;
    voice.stop();
    setActive(-1);
  }
  useEffect(
    () => () => {
      generation.current++;
      voice.stop();
    },
    [],
  );
  useEffect(() => {
    if (practicePaused) stop();
  }, [practicePaused]);
  useEffect(() => {
    stop();
  }, [profile.tuning, profile.written]);

  function update(changes: ChordChange[], feedback: string) {
    stop();
    setEditing(null);
    setProfile((p) => ({ ...p, song: { ...p.song, changes } }));
    setMessage(feedback);
  }
  async function play(start = 0, single = false) {
    stop();
    const token = generation.current;
    try {
      for (let i = start; i < (single ? start + 1 : song.changes.length); i++) {
        if (token !== generation.current) return;
        setActive(i);
        const { tones } = arrangeChange(
          song.changes[i],
          profile.tuning,
          profile.written,
        );
        const finished = await voice.play(
          tones.map((t) => t.sound),
          profile.sound,
          undefined,
          true,
          1.2,
        );
        if (!finished) break;
      }
    } catch {
      notify("Audio unavailable. Check your output device.");
    } finally {
      if (token === generation.current) setActive(-1);
    }
  }
  async function exportImage() {
    if (!chart.current) return;
    setExporting(true);
    try {
      const svg = chart.current.cloneNode(true) as SVGSVGElement;
      svg.querySelectorAll("[data-chart-cell]").forEach((cell) => {
        cell.setAttribute("fill", "#fff");
        cell.setAttribute("stroke", "#d1d4ca");
      });
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth * 2;
      canvas.height = image.naturalHeight * 2;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image export unavailable");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("Image export failed")),
          "image/png",
        ),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        song.title
          .trim()
          .replace(/[^\p{L}\p{N} _-]/gu, "")
          .slice(0, 60) || "aurynote-chord-changes"
      }.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Your chord chart has been saved as a PNG image.");
    } catch {
      notify("The chart could not be saved as an image. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="song-builder">
      <section className="panel song-setup" aria-label="Build chord changes">
        <div className="song-intro">
          <div>
            <h2>Build your song’s chord changes</h2>
            <p>Add chords in order. See every note together in one chart.</p>
          </div>
          <span className="micro muted">Chart saved on this device</span>
        </div>
        <label className="song-title-field">
          Song or chart title
          <input
            maxLength={60}
            value={song.title}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                song: { ...p.song, title: e.target.value },
              }))
            }
          />
        </label>
        {editing !== null && (
          <p className="micro">
            Editing change {editing + 1}. Save your changes or{" "}
            <button className="text-button" onClick={() => setEditing(null)}>
              Cancel edit
            </button>
            .
          </p>
        )}
        <form
          ref={composer}
          className="chord-composer"
          onSubmit={(e) => {
            e.preventDefault();
            if (editing !== null)
              update(
                song.changes.map((change, i) =>
                  i === editing ? { root, chord } : change,
                ),
                `Updated change ${editing + 1}.`,
              );
            else if (song.changes.length < maxChanges)
              update(
                [...song.changes, { root, chord }],
                `Added ${noteName(root)} ${chord.toLowerCase()} as change ${song.changes.length + 1}.`,
              );
          }}
        >
          <label>
            Concert root
            <select
              aria-label="Concert root"
              value={root}
              onChange={(e) => setRoot(Number(e.target.value))}
            >
              {notes.map((note, i) => (
                <option key={note} value={i}>
                  {note}
                </option>
              ))}
            </select>
          </label>
          <label>
            Chord type
            <select
              aria-label="Chord type"
              value={chord}
              onChange={(e) => setChord(e.target.value)}
            >
              {chords.map((pattern) => (
                <option key={pattern.name} value={pattern.name}>
                  {pattern.name}
                  {pattern.symbol ? ` (${pattern.symbol})` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="primary"
            disabled={editing === null && song.changes.length >= maxChanges}
          >
            {editing === null ? <Plus size={17} /> : <Check size={17} />}
            {editing === null ? "Add chord" : "Save chord"}
          </button>
        </form>
        <p className="micro muted">
          Choose roots in concert pitch. The chart follows your instrument and
          notation settings. Up to {maxChanges} changes.
        </p>
        <p className="song-status" role="status">
          {active >= 0
            ? `Playing change ${active + 1}: ${arrangeChange(song.changes[active], profile.tuning, profile.written).symbol}`
            : message}
        </p>
      </section>
      {!song.changes.length ? (
        <section className="panel song-empty">
          <Music2 size={30} aria-hidden="true" />
          <h3>Your first chord goes here</h3>
          <p>
            Choose a root and chord type above, or start with a familiar
            progression.
          </p>
          <button
            onClick={() =>
              update(
                [
                  { root: 0, chord: "Major" },
                  { root: 9, chord: "Minor" },
                  { root: 5, chord: "Major" },
                  { root: 7, chord: "Major" },
                ],
                "Added the C–Am–F–G example.",
              )
            }
          >
            Try C–Am–F–G
          </button>
        </section>
      ) : (
        <>
          <section className="panel song-order" aria-label="Chord order">
            <div className="song-toolbar">
              <h3>
                {song.changes.length} chord{" "}
                {song.changes.length === 1 ? "change" : "changes"}
              </h3>
              <button onClick={() => (active >= 0 ? stop() : void play())}>
                {active >= 0 ? <Square size={16} /> : <Play size={16} />}
                {active >= 0 ? "Stop changes" : "Play changes"}
              </button>
            </div>
            <ol className="chord-order-list">
              {song.changes.map((change, i) => {
                const { symbol } = arrangeChange(
                  change,
                  profile.tuning,
                  profile.written,
                );
                return (
                  <li key={i} className={active === i ? "playing-change" : ""}>
                    <span className="change-number">{i + 1}</span>
                    <button
                      className="chord-listen"
                      aria-label={`Hear change ${i + 1}: ${symbol}`}
                      onClick={() => void play(i, true)}
                    >
                      <strong>{symbol}</strong>
                      <Play size={13} />
                    </button>
                    <span className="change-quality">{change.chord}</span>
                    <div className="change-actions">
                      <button
                        className="icon-button"
                        aria-label={`Edit change ${i + 1}: ${symbol}`}
                        onClick={() => {
                          stop();
                          setEditing(i);
                          setRoot(change.root);
                          setChord(change.chord);
                          composer.current?.scrollIntoView({ block: "center" });
                          composer.current
                            ?.querySelector("select")
                            ?.focus({ preventScroll: true });
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move change ${i + 1} earlier`}
                        disabled={i === 0}
                        onClick={() =>
                          update(
                            moveChange(song.changes, i, i - 1),
                            `Moved ${symbol} to change ${i}.`,
                          )
                        }
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move change ${i + 1} later`}
                        disabled={i === song.changes.length - 1}
                        onClick={() =>
                          update(
                            moveChange(song.changes, i, i + 1),
                            `Moved ${symbol} to change ${i + 2}.`,
                          )
                        }
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Remove change ${i + 1}: ${symbol}`}
                        onClick={() =>
                          update(
                            song.changes.filter((_, n) => n !== i),
                            `Removed change ${i + 1}: ${symbol}.`,
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
          <section
            className="panel song-chart-panel"
            aria-label="Full chord chart"
          >
            <div className="song-toolbar">
              <div>
                <h2>All your chords, all their notes</h2>
                <p>Read left to right. Scroll across on smaller screens.</p>
              </div>
              <button onClick={() => void exportImage()} disabled={exporting}>
                <Download size={16} />
                {exporting ? "Saving image…" : "Save chart as image"}
              </button>
            </div>
            <div
              className="song-chart-scroll"
              tabIndex={0}
              role="region"
              aria-label="Scrollable chord chart"
            >
              <ProgressionChart
                song={song}
                tuning={profile.tuning}
                written={profile.written}
                active={active}
                chartRef={chart}
              />
            </div>
            <p className="micro muted">
              A note chart for your chord sequence. Chords use root-position
              voicings; rhythm, inversions, and staff notation are not included.
              The 13th chord omits the 11th.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
