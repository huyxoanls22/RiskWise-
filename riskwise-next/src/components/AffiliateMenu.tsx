import { useEffect, useRef, useState } from "react";
import { Sparkles, ChevronDown, ExternalLink } from "lucide-react";
import { BROKERS } from "../lib/affiliate";
import { clsx } from "../lib/format";

/** Header dropdown of broker referral links — "Ưu đãi sàn". */
export default function AffiliateMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-text",
          open && "bg-surface-2 text-text"
        )}
        title="Ưu đãi mở tài khoản sàn giao dịch"
      >
        <Sparkles className="h-3.5 w-3.5 text-brand" />
        <span className="hidden sm:inline">Ưu đãi sàn</span>
        <ChevronDown className={clsx("h-3 w-3 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="card animate-fade-in absolute right-0 z-50 mt-2 w-72 p-2 shadow-lg">
          <div className="px-2 pb-2 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Đăng ký sàn — ưu đãi đối tác</p>
            <p className="mt-0.5 text-[11px] text-muted">Dùng liên kết bên dưới để nhận ưu đãi phí giao dịch.</p>
          </div>
          <div className="space-y-0.5">
            {BROKERS.map((b) => (
              <a
                key={b.id}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-between gap-2 rounded-lg p-2 transition hover:bg-surface-2"
              >
                <span>
                  <span className="block text-sm font-medium text-text">{b.name}</span>
                  <span className="block text-[11px] text-faint">
                    {b.kind} · {b.discount}
                  </span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint" />
              </a>
            ))}
          </div>
          <p className="px-2 pb-1 pt-2 text-[10px] text-faint">
            Liên kết tiếp thị (affiliate) — không phải lời khuyên đầu tư.
          </p>
        </div>
      )}
    </div>
  );
}
