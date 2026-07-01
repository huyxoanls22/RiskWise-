import type { DisciplineScore as Score } from "../lib/analytics";

const toneColor = (tone: Score["tone"]) =>
  tone === "pos"
    ? "rgb(var(--pos))"
    : tone === "warn"
      ? "rgb(var(--warn))"
      : tone === "neg"
        ? "rgb(var(--neg))"
        : "rgb(var(--text-faint))";

const barColor = (v: number) =>
  v >= 70 ? "rgb(var(--pos))" : v >= 45 ? "rgb(var(--warn))" : "rgb(var(--neg))";

/**
 * The quiet centerpiece: a calm assessment of trading discipline — not a
 * gamified score, but a reflective gauge with the four behaviours behind it.
 */
export default function DisciplineScore({ data }: { data: Score }) {
  const r = 76;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, data.score)) / 100;
  const offset = circ * (1 - pct);
  const color = toneColor(data.tone);

  return (
    <div className="card p-7">
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
        {/* Gauge */}
        <div className="relative shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
            <circle cx="90" cy="90" r={r} fill="none" stroke="rgb(var(--border))" strokeWidth="3" />
            <circle
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.2,0.6,0.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="figure text-5xl text-text">{data.grade === "—" ? "—" : data.score}</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-faint">trên 100</span>
          </div>
        </div>

        {/* Label + components */}
        <div className="w-full flex-1">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Đánh giá kỷ luật</div>
            <div className="mt-0.5 flex items-baseline gap-2.5">
              <span className="font-serif text-2xl" style={{ color }}>
                {data.label}
              </span>
              <span className="font-serif text-base text-faint">hạng {data.grade}</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.components.map((c) => (
              <div key={c.key}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-muted">{c.label}</span>
                  <span className="num text-text">{c.value}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.value}%`,
                      background: barColor(c.value),
                      transition: "width 1s cubic-bezier(0.2,0.6,0.2,1)",
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
