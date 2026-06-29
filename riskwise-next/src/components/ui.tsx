import React from "react";
import { clsx } from "../lib/format";

/* ---------------------------------------------------------------- Card */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("card p-5 shadow-sm", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{children}</h3>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------- Button */
type BtnVariant = "primary" | "ghost" | "outline" | "danger" | "pos";
const btnStyles: Record<BtnVariant, string> = {
  primary:
    "bg-brand text-slate-950 hover:brightness-110 font-bold shadow-sm shadow-brand/20",
  pos: "bg-pos text-slate-950 hover:brightness-110 font-bold",
  danger: "bg-neg/15 text-neg hover:bg-neg/25 border border-neg/30",
  outline: "border border-border text-text hover:bg-surface-2",
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
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
    pos: "bg-pos/10 text-pos border-pos/30",
    neg: "bg-neg/10 text-neg border-neg/30",
    warn: "bg-warn/10 text-warn border-warn/30",
    brand: "bg-brand/10 text-brand border-brand/30",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
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
      <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-faint">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 placeholder:text-faint";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputBase, props.className)} />;
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
    <div className="inset flex rounded-xl p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
            value === o.value ? "bg-brand text-slate-950 shadow-sm" : "text-muted hover:text-text"
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
    <div className="inset rounded-xl p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className={clsx("num mt-1 text-2xl font-black", color)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-faint">{sub}</div>}
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card animate-fade-in relative z-10 w-full max-w-lg p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-black text-text">{title}</h3>
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="mb-3 text-faint">{icon}</div>
      <p className="font-bold text-text">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
