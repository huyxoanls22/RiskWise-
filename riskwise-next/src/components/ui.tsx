import React from "react";
import { clsx } from "../lib/format";

/* ---------------------------------------------------------------- Card */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("card p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-5">
      <h3 className="font-serif text-lg text-text">{children}</h3>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Small all-caps overline label used throughout for a calm, editorial rhythm. */
export function Overline({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">{children}</span>;
}

/* -------------------------------------------------------------- Button */
type BtnVariant = "primary" | "ghost" | "outline" | "danger" | "pos";
const btnStyles: Record<BtnVariant, string> = {
  primary: "bg-brand text-[rgb(var(--brand-ink))] hover:brightness-[1.06]",
  pos: "bg-pos text-[rgb(var(--brand-ink))] hover:brightness-[1.06]",
  danger: "text-neg border border-neg/30 hover:bg-neg/8",
  outline: "border border-border-strong text-text hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: { variant?: BtnVariant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        btnStyles[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* --------------------------------------------------------------- Badge */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "pos" | "neg" | "warn" | "brand";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-surface-2 text-muted border-border",
    pos: "bg-pos/10 text-pos border-pos/25",
    neg: "bg-neg/10 text-neg border-neg/25",
    warn: "bg-warn/10 text-warn border-warn/25",
    brand: "bg-brand/10 text-brand border-brand/25",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Field */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="block text-xs text-faint">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/15 placeholder:text-faint";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputBase, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(inputBase, "resize-y leading-relaxed", props.className)} />;
}

export function NumberInput({
  value,
  onValue,
  className,
  ...rest
}: { value: number; onValue: (n: number) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onValue(e.target.value === "" ? 0 : parseFloat(e.target.value))}
      className={clsx(inputBase, "num", className)}
      {...rest}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(inputBase, "cursor-pointer", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-surface text-text">
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* --------------------------------------------------------- Segmented */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-surface-2/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
            value === o.value
              ? "bg-surface text-brand shadow-sm"
              : "text-muted hover:text-text"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ StatCard */
export function StatCard({
  label,
  value,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "pos" | "neg" | "brand" | "warn";
  sub?: string;
}) {
  const color =
    tone === "pos"
      ? "text-pos"
      : tone === "neg"
        ? "text-neg"
        : tone === "brand"
          ? "text-brand"
          : tone === "warn"
            ? "text-warn"
            : "text-text";
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 px-4 py-3.5">
      <Overline>{label}</Overline>
      <div className={clsx("figure mt-1.5 text-2xl", color)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Modal */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(38_35_30_/_0.45)] backdrop-blur-[2px]" onClick={onClose} />
      <div className="card animate-fade-in relative z-10 w-full max-w-lg p-7">
        <h3 className="mb-5 font-serif text-xl text-text">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Empty */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <div className="mb-3 text-faint">{icon}</div>
      <p className="font-serif text-lg text-text">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
