import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  Headphones,
  LayoutGrid,
  Mic,
  Music2,
  ScanLine,
  Settings2,
  X,
} from "lucide-react";

const steps = [
  {
    target: "studio",
    icon: LayoutGrid,
    title: "Find your next step",
    copy: "Your studio brings your next lesson, daily goal, and practice shortcuts together. Begin with two notes and build up at your own pace.",
    hint: "Start with “Start first lesson” on Your studio.",
  },
  {
    target: "setup",
    icon: Settings2,
    title: "Make it sound like you",
    copy: "Choose your instrument in the top bar so the written notes match what you play. Open Settings to change the playback sound, volume, or written and concert notation.",
    hint: "Your instrument key and the sound you hear are separate choices.",
  },
  {
    target: "ear",
    icon: Headphones,
    title: "Listen, then name the note",
    copy: "Try a guided lesson or choose your own notes and session length. Tap the notes to learn their sounds, then start the quiz. Replay whenever you need.",
    hint: "Reference C gives you a familiar starting pitch. Score 80% to pass a guided lesson.",
  },
  {
    target: "staff",
    icon: ScanLine,
    title: "Turn symbols into sound",
    copy: "Read a note in treble or bass clef, then choose or type its name. Add sharps and flats when you’re ready. Hear the note to connect the page with its sound.",
    hint: "Use Pause after a mistake for more review time. Type F# or Bb; no octave number is needed.",
  },
  {
    target: "explore",
    icon: Music2,
    title: "Explore scales and chords",
    copy: "Pick a concert key and a scale or chord, then listen to its notes. In Chord changes, build a song’s progression and see every chord’s notes together in one chart.",
    hint: "Reorder your chord changes, play the sequence, and save the complete chart as an image.",
  },
  {
    target: "play",
    icon: Mic,
    title: "Play it back on your instrument",
    copy: "Hear the target, start the microphone, and play or sing one steady note. The pitch display shows what it hears and whether you’re flat or sharp.",
    hint: "Use headphones. Microphone access starts only when you ask; audio stays on your device.",
  },
  {
    target: "progress",
    icon: ChartNoAxesCombined,
    title: "See your practice add up",
    copy: "Your progress shows daily activity, accuracy, discovered pitches, and achievements. Set a manageable daily goal and export your saved progress whenever you like.",
    hint: "Everything saves on this device. You can replay this guide anytime from Quick tour.",
  },
] as const;

export default function QuickTour({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previous = useRef(document.activeElement as HTMLElement | null);
  const step = steps[index];
  const last = index === steps.length - 1;

  useLayoutEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    const scroll = { x: window.scrollX, y: window.scrollY };
    const navigation = document.querySelector(".sidebar nav");
    const navigationScroll = navigation?.scrollLeft ?? 0;
    document.body.style.overflow = "hidden";
    element?.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      window.scrollTo(scroll.x, scroll.y);
      if (navigation) navigation.scrollLeft = navigationScroll;
      const restore = previous.current?.isConnected
        ? previous.current
        : document.querySelector<HTMLElement>(".tour-trigger");
      restore?.focus({ preventScroll: true });
    };
  }, []);

  useLayoutEffect(() => {
    const element = document.querySelector<HTMLElement>(
      `[data-tour="${step.target}"]`,
    );
    element?.scrollIntoView({ block: "nearest", inline: "nearest" });
    function place() {
      const rect = element?.getBoundingClientRect();
      const panel = card.current?.getBoundingClientRect();
      if (!panel) return;
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const visible = rect && rect.bottom > 0 && rect.top < height;
      setTarget(visible ? rect : null);
      const beside =
        visible && width > 650 && rect.right + panel.width + 40 <= width;
      const left = visible
        ? beside
          ? rect.right + 24
          : rect.right - panel.width
        : (width - panel.width) / 2;
      const top = visible
        ? beside
          ? rect.top
          : rect.bottom + 24
        : (height - panel.height) / 2;
      setPosition({
        left: Math.max(16, Math.min(left, width - panel.width - 16)),
        top: Math.max(16, Math.min(top, height - panel.height - 16)),
      });
    }
    place();
    heading.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(place);
    if (card.current) observer.observe(card.current);
    if (element) observer.observe(element);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [step]);

  return (
    <dialog
      ref={dialog}
      className="tour-dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-copy"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      {target && (
        <div
          className="tour-highlight"
          aria-hidden="true"
          style={{
            left: target.left - 4,
            top: target.top - 4,
            width: target.width + 8,
            height: target.height + 8,
          }}
        />
      )}
      <div className="tour-card" ref={card} style={position}>
        <div className="tour-heading">
          <span className="eyebrow">
            QUICK TOUR · {index + 1} OF {steps.length}
          </span>
          <button
            className="icon-button"
            aria-label="Close tour"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        <div className="tour-icon" aria-hidden="true">
          <step.icon size={26} />
        </div>
        <h2 id="tour-title" key={index} ref={heading} tabIndex={-1}>
          {step.title}
        </h2>
        <p id="tour-copy">{step.copy}</p>
        <p className="tour-hint">{step.hint}</p>
        <progress
          aria-label="Tour progress"
          max={steps.length}
          value={index + 1}
        />
        <div className="tour-actions">
          <button className="text-button" onClick={onClose}>
            Skip tour
          </button>
          <div>
            {index > 0 && (
              <button onClick={() => setIndex((i) => i - 1)}>
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              className="primary"
              onClick={() => (last ? onClose() : setIndex((i) => i + 1))}
            >
              {last ? "Done" : "Next"}{" "}
              {last ? <Check size={15} /> : <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
