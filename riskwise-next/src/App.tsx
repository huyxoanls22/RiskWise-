import { useRef, useState } from "react";
import {
  Calculator as CalcIcon,
  Briefcase,
  ClipboardList,
  Brain,
  Sun,
  Moon,
  Settings,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useSelector } from "./store/store";
import { actions } from "./store/actions";
import { downloadBackup, parseImport } from "./store/io";
import { computeDisciplineScore } from "./lib/analytics";
import { Button, Modal, Field, NumberInput } from "./components/ui";
import { ToastProvider, useToast } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { clsx } from "./lib/format";
import Calculator from "./features/Calculator";
import Portfolio from "./features/Portfolio";
import Plans from "./features/Plans";
import Journal from "./features/Journal";

type Tab = "calculator" | "portfolio" | "plans" | "journal";

const TABS: { id: Tab; label: string; icon: typeof CalcIcon }[] = [
  { id: "calculator", label: "Tính toán", icon: CalcIcon },
  { id: "portfolio", label: "Danh mục", icon: Briefcase },
  { id: "plans", label: "Kế hoạch", icon: ClipboardList },
  { id: "journal", label: "Phân tích", icon: Brain },
];

function DisciplinePill() {
  const trades = useSelector((d) => d.trades);
  const score = computeDisciplineScore(trades);
  if (score.grade === "—") return null;
  const color = score.tone === "pos" ? "rgb(var(--brand))" : score.tone === "warn" ? "rgb(var(--warn))" : "rgb(var(--neg))";
  return (
    <div
      className="hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex"
      style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: color, animation: "ringPulse 2s ease-in-out infinite" }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
        Kỷ luật {score.score} · {score.label}
      </span>
    </div>
  );
}

function Header({ onSettings }: { onSettings: () => void }) {
  const theme = useSelector((d) => d.settings.theme);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="glow-brand flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-emerald-600 text-[#04140d]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-none tracking-tight text-text">
              Risk<span className="text-brand">Wise</span>
            </h1>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-faint">Discipline OS</span>
          </div>
        </div>

        <DisciplinePill />

        <div className="flex items-center gap-1">
          <button
            onClick={() => actions.setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-text"
            aria-label="toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={onSettings}
            className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-text"
            aria-label="settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dailyLimit = useSelector((d) => d.settings.dailyLimitPercent);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseImport(text);
      actions.importData(data);
      toast("Khôi phục dữ liệu thành công.");
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Tập tin không hợp lệ.", "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cài đặt & dữ liệu">
      <div className="space-y-5">
        <Field label="Giới hạn rủi ro mỗi ngày (% tài khoản)" hint="Dùng để cảnh báo khi tổng rủi ro trong ngày vượt ngưỡng">
          <NumberInput value={dailyLimit} onValue={(n) => actions.setDailyLimit(n)} min={0} step={0.5} />
        </Field>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Sao lưu & khôi phục</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => downloadBackup()}>
              <Download className="h-4 w-4" /> Xuất JSON
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Nhập JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (confirm("Xoá toàn bộ dữ liệu và khôi phục mặc định?")) {
                actions.resetAll();
                toast("Đã đặt lại toàn bộ dữ liệu.");
                onClose();
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> Đặt lại toàn bộ dữ liệu
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Shell() {
  const [tab, setTab] = useState<Tab>("calculator");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-full">
      <Header onSettings={() => setSettingsOpen(true)} />

      {/* Tab navigation */}
      <nav className="mx-auto max-w-6xl px-4 pt-5">
        <div className="inset flex gap-1 rounded-2xl p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  tab === t.id
                    ? "bg-gradient-to-br from-brand to-emerald-600 text-[#04140d] glow-brand"
                    : "text-muted hover:bg-surface-2 hover:text-text"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden font-display sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div key={tab} className="animate-fade-in">
          {tab === "calculator" && <Calculator />}
          {tab === "portfolio" && <Portfolio />}
          {tab === "plans" && <Plans />}
          {tab === "journal" && <Journal />}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 text-center text-[11px] text-faint">
        RiskWise Next · Dữ liệu lưu cục bộ trên trình duyệt của bạn · Không phải lời khuyên đầu tư
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </ErrorBoundary>
  );
}
