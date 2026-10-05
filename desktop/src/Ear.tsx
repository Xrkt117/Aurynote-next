import { shuffledNotes, resizePool, finishSession } from "./practice";
import CorrectPopup from "./CorrectPopup";
import { writtenOffset } from "./tuning";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  RotateCcw,
  Check,
  Minus,
  Plus,
  X,
  Volume2,
  Pause,
} from "lucide-react";
import { useStudio } from "./context";
import { lessons, noteName, sounding, weightedNote } from "./music";
import { record } from "./store";
import { voice } from "./audio";
import { Piano, Wave, Tag } from "./components";
type Phase = "learn" | "quiz" | "result" | "complete";
export default function Ear() {
  const { profile, setProfile, notify, go, practicePaused } = useStudio();
  const [phase, setPhase] = useState<Phase>("learn"),
    [busy, setBusy] = useState(false),
    [soundLabel, setSoundLabel] = useState(""),
    [target, setTarget] = useState(0),
    [choice, setChoice] = useState<number | null>(null),
    [active, setActive] = useState<number[]>([]),
    [results, setResults] = useState<boolean[]>([]),
    [degree, setDegree] = useState(false),
    [level, setLevel] = useState(profile.level),
    [custom, setCustom] = useState(false),
    [paused, setPaused] = useState(false);
  const natural = [0, 2, 4, 5, 7, 9, 11];
  const pool = custom
    ? degree
      ? resizePool(profile.customNotes, profile.customNotes.length, natural)
      : profile.customNotes
    : degree
      ? natural
      : lessons[level].notes;
  const goal = Math.max(profile.sessionLength, pool.length);
  const generation = useRef(0),
    queue = useRef<number[]>([]),
    answerLock = useRef(false),
    completedLock = useRef(false);
  useEffect(
    () => () => {
      generation.current++;
      voice.stop();
    },
    [],
  );
  useEffect(() => {
    if (phase !== "result" || paused || busy || practicePaused) return;
    const timer = setTimeout(next, choice === target ? 850 : 3200);
    return () => clearTimeout(timer);
  }, [phase, paused, busy, practicePaused]);
  const label = (n: number) =>
    degree
      ? `${[0, 2, 4, 5, 7, 9, 11].indexOf(n) + 1}${n === 0 ? " · root" : ""}`
      : noteName(n);
  async function play(values: number[], reveal = false, labels: string[] = []) {
    const token = ++generation.current;
    setBusy(true);
    let position = 0;
    try {
      await voice.play(
        values.map((n) => sounding(n, profile.tuning, profile.written)),
        profile.sound,
        (n) => {
          if (token === generation.current)
            setSoundLabel(
              n === null ? "" : (labels[position++] ?? "Listen to the note"),
            );
          if (token === generation.current && reveal)
            setActive(
              n === null
                ? []
                : [n + writtenOffset(profile.tuning, profile.written)],
            );
        },
        false,
        0.5,
      );
    } catch {
      notify("Audio could not start. Check your output device and try Replay.");
    } finally {
      if (token === generation.current) {
        setBusy(false);
        setSoundLabel("");
        setActive([]);
      }
    }
  }
  function ask(n: number) {
    setTarget(n);
    setChoice(null);
    setActive([]);
    setPhase("quiz");
    setPaused(false);
    answerLock.current = false;
    void play(
      degree
        ? [60, 64, 67, 72, 60 + n]
        : profile.reference
          ? [60, 60 + n]
          : [60 + n],
      false,
      degree
        ? [
            "Home key · C",
            "Home key · E",
            "Home key · G",
            "Home key · C",
            "Mystery note · your turn",
          ]
        : profile.reference
          ? ["Reference · C", "Mystery note · your turn"]
          : ["Mystery note · your turn"],
    );
  }
  function begin() {
    setResults([]);
    completedLock.current = false;
    queue.current = shuffledNotes(pool);
    ask(queue.current.shift()!);
  }
  function next() {
    generation.current++;
    voice.stop();
    setBusy(false);
    setActive([]);
    if (results.length >= goal) {
      setPhase("complete");
      if (!completedLock.current) {
        completedLock.current = true;
        setProfile((p) =>
          finishSession(p, !degree && !custom ? level : null, results),
        );
      }
      return;
    }
    ask(queue.current.shift() ?? weightedNote(pool, profile.errors));
  }
  function answer(n: number) {
    if (phase !== "quiz" || busy || answerLock.current) return;
    answerLock.current = true;
    setChoice(n);
    setResults((r) => [...r, n === target]);
    setProfile((p) => record(p, target, n === target, "ear"));
    setPhase("result");
    if (n !== target)
      void play([60 + n, 60 + target], true, [
        `Your answer · ${noteName(n)}`,
        `Correct note · ${noteName(target)}`,
      ]);
    else setActive([target]);
  }
  function configure(nextLevel = level) {
    generation.current++;
    voice.stop();
    setBusy(false);
    setActive([]);
    setSoundLabel("");
    setLevel(nextLevel);
    setPhase("learn");
    setResults([]);
    setChoice(null);
    setPaused(false);
  }
  function compare() {
    setPaused(true);
    void play([60 + choice!, 60 + target], true, [
      `Your answer · ${noteName(choice!)}`,
      `Correct note · ${noteName(target)}`,
    ]);
  }
  function resize(n: number) {
    configure();
    setProfile((p) => ({
      ...p,
      customNotes: resizePool(
        pool,
        Math.min(degree ? 7 : 12, Math.max(2, n)),
        degree ? natural : undefined,
      ),
    }));
  }
  const right = choice === target;
  if (phase === "complete")
    return (
      <div className="page session-complete">
        <div className="complete-symbol">
          <Check size={38} />
        </div>
        <span className="eyebrow">Results</span>
        <h1>Session complete</h1>
        <p>
          {Math.round((results.filter(Boolean).length / goal) * 100)}% correct ·{" "}
          {results.filter(Boolean).length} of {goal} answers across{" "}
          {pool.length} notes.
        </p>
        <div className="result-dots">
          {results.map((r, i) => (
            <i key={i} className={r ? "right" : "wrong"} />
          ))}
        </div>
        <p>
          {results.filter(Boolean).length / goal >= 0.8 &&
          !degree &&
          !custom &&
          level < 4
            ? "The next guided lesson is now available."
            : custom
              ? "Your custom-session results have been saved."
              : degree
                ? "Your scale-degree session has been saved."
                : profile.passedLessons.length === 5
                  ? "You have passed all five guided lessons."
                  : "Session saved. Aim for 80% to pass this guided lesson."}
        </p>
        <div className="button-row">
          {!custom &&
            !degree &&
            results.filter(Boolean).length / goal >= 0.8 &&
            level < 4 && (
              <button className="primary" onClick={() => configure(level + 1)}>
                Next lesson · {lessons[level + 1].notes.length} notes{" "}
                <ArrowRight size={16} />
              </button>
            )}
          <button onClick={() => go("studio")}>Back to practice</button>
          <button
            onClick={() => {
              configure();
            }}
          >
            Choose notes / practice again
          </button>
        </div>
      </div>
    );
  return (
    <div className="page lesson-page">
      {phase === "result" && right && !practicePaused && <CorrectPopup />}
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Ear training ·{" "}
            {custom
              ? "Custom practice"
              : `Lesson ${String(level + 1).padStart(2, "0")}`}
          </span>
          <h1>
            {degree
              ? "Identify scale degrees"
              : custom
                ? "Custom ear training"
                : lessons[level].name}
          </h1>
          <p>
            {phase === "learn"
              ? "Listen to each note before starting the session."
              : "Choose the note you hear. Replay is available."}
          </p>
        </div>
        <Tag>
          {pool.length} notes · {goal} questions
        </Tag>
      </div>

      <div className="lesson-layout">
        <section className="lesson-main panel">
          {phase === "learn" && (
            <section
              className="practice-config ear-toolbar"
              aria-label="Practice setup"
            >
              <div className="config-fields">
                <Seg
                  label="Practice mode"
                  options={[
                    ["Guided lessons", !custom],
                    ["Choose my own notes", custom],
                  ]}
                  onPick={(i) => {
                    configure();
                    setCustom(i === 1);
                  }}
                />
                {!custom && (
                  <Stepper
                    label="Lesson"
                    prev="Previous lesson"
                    next="Next lesson"
                    text={`Lesson ${level + 1} of ${lessons.length}`}
                    note={`${lessons[level].name} · ${lessons[level].notes.length} notes`}
                    wide
                    minusOff={degree || level <= 0}
                    plusOff={degree || level >= lessons.length - 1}
                    onMinus={() => configure(level - 1)}
                    onPlus={() => configure(level + 1)}
                  />
                )}
                {custom && (
                  <Stepper
                    label="Number of notes"
                    prev="Fewer notes"
                    next="More notes"
                    text={`${pool.length} notes`}
                    minusOff={pool.length <= 2}
                    plusOff={pool.length >= (degree ? 7 : 12)}
                    onMinus={() => resize(pool.length - 1)}
                    onPlus={() => resize(pool.length + 1)}
                  />
                )}
                <Seg
                  label="Session length"
                  unit="questions"
                  options={[...new Set([5, 10, 20, 40, profile.sessionLength])]
                    .sort((a, b) => a - b)
                    .map((n): [string, boolean] => [
                      String(n),
                      n === profile.sessionLength,
                    ])}
                  onPick={(i, text) =>
                    setProfile((p) => ({ ...p, sessionLength: Number(text) }))
                  }
                />
              </div>
              {custom && (
                <div className="note-picker" aria-label="Choose practice notes">
                  {Array.from({ length: 12 }, (_, n) => (
                    <button
                      key={n}
                      aria-pressed={pool.includes(n)}
                      disabled={
                        (degree && !natural.includes(n)) ||
                        (pool.length === 2 && pool.includes(n))
                      }
                      onClick={() => {
                        configure();
                        setProfile((p) => ({
                          ...p,
                          customNotes: pool.includes(n)
                            ? pool.filter((v) => v !== n)
                            : [...pool, n].sort((a, b) => a - b),
                        }));
                      }}
                    >
                      {noteName(n)}
                    </button>
                  ))}
                </div>
              )}
              <p className="micro muted">
                {pool.length} notes: {pool.map(noteName).join(" · ")}. {goal}{" "}
                questions.
                {goal > profile.sessionLength
                  ? " The session includes every selected note at least once."
                  : ""}
              </p>
            </section>
          )}
          <div className="panel-top">
            <span className="eyebrow">
              {phase === "learn"
                ? "Notes in this session"
                : `Question ${Math.min(results.length + (phase === "quiz" ? 1 : 0), goal)} / ${goal}`}
            </span>
            {phase !== "learn" && (
              <div className="tiny-dots">
                {Array.from({ length: goal }, (_, i) => (
                  <i
                    key={i}
                    className={
                      i < results.length ? (results[i] ? "right" : "wrong") : ""
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <div className="listen-area" key={`${phase}-${results.length}`}>
            <div className="listening-status" role="status">
              {busy
                ? soundLabel || "Preparing sound…"
                : phase === "quiz"
                  ? "Your turn · choose a note"
                  : phase === "learn"
                    ? "Tap a note to listen"
                    : "Review your answer"}
            </div>
            <Wave playing={busy} />
            <h2>
              {phase === "learn"
                ? "Preview the notes"
                : phase === "result"
                  ? right
                    ? "Correct"
                    : "Compare the notes"
                  : "Which note did you hear?"}
            </h2>
            <p>
              {phase === "learn"
                ? "Use the buttons or keyboard below to hear each pitch."
                : phase === "result"
                  ? `${noteName(choice!)} ${right ? "is correct." : `was your answer. The note was ${noteName(target)}.`}`
                  : degree
                    ? "A C-major pattern, then one mystery note."
                    : profile.reference
                      ? "Reference C first. Name the second note."
                      : "Listen to the mystery note."}
            </p>
          </div>
          <div className={`answer-grid ${pool.length > 7 ? "many" : ""}`}>
            {pool.map((n, i) => (
              <button
                key={n}
                disabled={phase === "result" || (phase === "quiz" && busy)}
                className={`note-choice ${phase === "result" && n === target ? "correct-choice" : ""} ${phase === "result" && n === choice && !right ? "wrong-choice" : ""}`}
                onClick={() =>
                  phase === "learn"
                    ? void play([60 + n], true, [`Playing · ${noteName(n)}`])
                    : answer(n)
                }
              >
                <span>{label(n)}</span>
                <small>
                  {phase === "learn" ? (
                    <Volume2 size={14} />
                  ) : phase === "result" && n === target ? (
                    "✓ Correct note"
                  ) : phase === "result" && n === choice ? (
                    "× Your answer"
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </small>
              </button>
            ))}
          </div>
          <Piano
            onlyPool
            active={active}
            pool={phase === "learn" ? pool : []}
            onPlay={
              phase === "learn"
                ? (n) => {
                    if (pool.includes(n))
                      void play([60 + n], true, [`Playing · ${noteName(n)}`]);
                  }
                : undefined
            }
          />
          {phase === "result" && !right && (
            <div className="feedback mistake" role="status">
              <div>
                <X size={19} />
                <strong>Not quite · {label(target)}</strong>
              </div>
              <span>
                {paused
                  ? "Paused for a closer listen."
                  : busy
                    ? "Comparing your note with the answer…"
                    : "Next question in 3.2 seconds"}
              </span>
              {!paused && !busy && (
                <i
                  className="countdown"
                  style={{ animationDuration: "3.2s" }}
                />
              )}
            </div>
          )}
          <div className="lesson-actions">
            {phase !== "learn" && (
              <button onClick={() => configure()}>Change practice</button>
            )}
            {phase === "learn" ? (
              <button className="primary" onClick={begin}>
                Start session <ArrowRight size={16} />
              </button>
            ) : phase === "quiz" ? (
              <button onClick={() => ask(target)} disabled={busy}>
                <RotateCcw size={15} />
                Replay note
              </button>
            ) : !right ? (
              <>
                <button onClick={() => setPaused((p) => !p)}>
                  <Pause size={15} />
                  {paused ? "Resume" : "Pause"}
                </button>
                {!right && (
                  <button onClick={compare}>
                    <Volume2 size={15} />
                    Compare again
                  </button>
                )}
                <button className="primary" onClick={next}>
                  Next <ArrowRight size={15} />
                </button>
              </>
            ) : null}
          </div>
        </section>
        <aside className="lesson-aside">
          <div className="settings-card">
            <span className="eyebrow">Options</span>
            <Seg
              label="Reference C"
              row
              disabled={phase !== "learn" || degree}
              options={[
                ["On", profile.reference],
                ["Off", !profile.reference],
              ]}
              onPick={(i) => setProfile((p) => ({ ...p, reference: i === 0 }))}
            />
            <Seg
              label="Scale-degree mode"
              row
              disabled={phase !== "learn"}
              options={[
                ["On", degree],
                ["Off", !degree],
              ]}
              onPick={(i) => {
                configure();
                setDegree(i === 0);
                setActive([]);
              }}
            />
            <p className="micro muted">
              Choose your instrument key above. Sound and notation are in
              Settings.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stepper({
  label,
  prev,
  next,
  text,
  note,
  wide,
  minusOff,
  plusOff,
  onMinus,
  onPlus,
}: {
  label: string;
  prev: string;
  next: string;
  text: string;
  note?: string;
  wide?: boolean;
  minusOff: boolean;
  plusOff: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="staff-control-group ear-seg">
      <span>{label}</span>
      <div
        className={`segmented ear-stepper${wide ? " wide" : ""}`}
        role="group"
        aria-label={label}
      >
        <button aria-label={prev} disabled={minusOff} onClick={onMinus}>
          <Minus size={14} />
        </button>
        <span>{text}</span>
        <button aria-label={next} disabled={plusOff} onClick={onPlus}>
          <Plus size={14} />
        </button>
      </div>
      {note && <small className="ear-stepper-note">{note}</small>}
    </div>
  );
}

function Seg({
  label,
  options,
  onPick,
  row,
  disabled,
  unit,
}: {
  label: string;
  options: [string, boolean][];
  onPick: (i: number, text: string) => void;
  unit?: string;
  row?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={`staff-control-group ear-seg${row ? " ear-seg-row" : ""}`}>
      <span>{label}</span>
      <div className="ear-seg-line">
        <div className="segmented" role="group" aria-label={label}>
          {options.map(([text, on], i) => (
            <button
              key={text}
              aria-pressed={on}
              disabled={disabled}
              className={on ? "selected" : ""}
              onClick={() => onPick(i, text)}
            >
              {text}
            </button>
          ))}
        </div>
        {unit && <small>{unit}</small>}
      </div>
    </div>
  );
}
