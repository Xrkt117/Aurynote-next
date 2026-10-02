import type { Ref } from "react";
import { arrangeChange, type SongChart } from "./progression";
import { noteName } from "./music";
import { tuningInfo, type Tuning } from "./tuning";

export default function ProgressionChart({
  song,
  tuning,
  written,
  active = -1,
  chartRef,
}: {
  song: SongChart;
  tuning: Tuning;
  written: boolean;
  active?: number;
  chartRef?: Ref<SVGSVGElement>;
}) {
  const height = 164 + Math.ceil(song.changes.length / 4) * 286;
  const title = song.title.trim() || "My chord changes";
  return (
    <svg
      ref={chartRef}
      className="progression-chart"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 1000 ${height}`}
      width="1000"
      height={height}
      role="img"
      aria-label={`${title}: chord changes and notes`}
      fontFamily="Arial, sans-serif"
    >
      <title>{title}</title>
      <desc>
        {song.changes
          .map((change, i) => {
            const { symbol, tones } = arrangeChange(change, tuning, written);
            return `${i + 1}. ${symbol}: ${tones.map((t) => t.name).join(", ")}`;
          })
          .join(". ")}
      </desc>
      <rect width="1000" height={height} fill="#f8f8f5" />
      <text x="32" y="42" fill="#60645d" fontSize="12" letterSpacing="2">
        AURYNOTE / CHORD CHANGES
      </text>
      <text
        x="32"
        y="80"
        fill="#252622"
        fontSize={Math.min(28, 920 / (title.length * 0.96))}
        fontWeight="600"
      >
        {title}
      </text>
      <text x="32" y="108" fill="#60645d" fontSize="14">
        {written
          ? `Written notes · ${tuningInfo(tuning).examples}`
          : "Concert notes"}{" "}
        · {song.changes.length} changes
      </text>
      {song.changes.map((change, i) => {
        const { symbol, tones, pattern } = arrangeChange(
          change,
          tuning,
          written,
        );
        return (
          <g
            key={i}
            transform={`translate(${32 + (i % 4) * 238}, ${132 + Math.floor(i / 4) * 286})`}
          >
            <rect
              data-chart-cell="true"
              width="222"
              height="270"
              rx="6"
              fill={active === i ? "#eaf0e0" : "#fff"}
              stroke={active === i ? "#596b46" : "#d1d4ca"}
            />
            <text x="18" y="27" fill="#60645d" fontSize="12">
              CHANGE {String(i + 1).padStart(2, "0")}
            </text>
            <text x="18" y="66" fill="#252622" fontSize="32" fontWeight="600">
              {symbol}
            </text>
            <text x="18" y="91" fill="#60645d" fontSize="12">
              Concert {noteName(change.root)}
              {pattern.symbol}
            </text>
            <line x1="18" x2="204" y1="108" y2="108" stroke="#d1d4ca" />
            {tones.map((tone, j) => (
              <g key={j}>
                <text
                  x="18"
                  y={134 + j * 23}
                  fill="#252622"
                  fontSize="19"
                  fontWeight={j === 0 ? "600" : "400"}
                >
                  {tone.name}
                </text>
                <text x="90" y={134 + j * 23} fill="#60645d" fontSize="12">
                  {tone.degree === "1" ? "Root" : `Degree ${tone.degree}`}
                </text>
                <text
                  x="204"
                  y={134 + j * 23}
                  textAnchor="end"
                  fill="#60645d"
                  fontSize="12"
                >
                  {Math.floor(tone.midi / 12) - 1}
                </text>
              </g>
            ))}
          </g>
        );
      })}
      <text x="32" y={height - 13} fill="#60645d" fontSize="12">
        Read left to right. Right-hand numbers show note octaves. Each change
        uses a root-position voicing.
      </text>
    </svg>
  );
}
