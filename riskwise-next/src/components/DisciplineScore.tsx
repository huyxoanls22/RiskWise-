import type { DisciplineScore as Score } from "../lib/analytics";
import { clsx } from "../lib/format";

const toneColor = (tone: Score["tone"]) =>
  tone === "pos" ? "rgb(var(--brand))" : tone === "warn" ? "rgb(var(--warn))" : tone === "neg" ? "rgb(var(--neg))" : "rgb(var(--text-faint))";

/**
 * The signature element: a credit-score-style ring summarizing trading
 * discipline, with a breakdown of the four contributing behaviours.
 */
export default function DisciplineScore({ data }: { data: Score }) {
  const r = 78;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, data.score)) / 100;
  const offset = circ * (1 - pct);
  const color = toneColor(data.tone);

  return (
    <div className="card relative overflow-hidden p-6">
      {/* ambient glow keyed to the score tone */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
        style={{ background: color, opacity: 0.14 }}
      />
      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Gauge */}
        <div className="relative shrink-0">
          <svg width="184" height="184" viewBox="0 0 184 184" className="-rotate-90">
            <circle cx="92" cy="92" r={r} fill="none" stroke="rgb(var(--surface-2))" strokeWidth="12" />
            <circle
              cx="92"
              cy="92"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.2,0.7,0.2,1)", filter: `drop-shadow(0 0 6px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl font-bold leading-none text-text">{data.grade === "—" ? "—" : data.score}</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-faint">/ 100</span>
          </div>
        </div>

        {/* Label + components */}
        <div className="w-full flex-1">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg font-display text-lg font-bold"
              style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
            >
              {data.grade}
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-faint">Điểm kỷ luật</div>
              <div className="font-display text-lg font-bold" style={{ color }}>
                {data.label}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {data.components.map((c) => (
              <div key={c.key}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-muted">{c.label}</span>
                  <span className="num font-semibold text-text">{c.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={clsx("h-full rounded-full")}
                    style={{
                      width: `${c.value}%`,
                      background: c.value >= 70 ? "rgb(var(--brand))" : c.value >= 45 ? "rgb(var(--warn))" : "rgb(var(--neg))",
                      transition: "width 0.9s cubic-bezier(0.2,0.7,0.2,1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
