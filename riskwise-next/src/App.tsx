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
  Crown,
} from "lucide-react";
import { useSelector } from "./store/store";
import { actions } from "./store/actions";
import { downloadBackup, parseImport } from "./store/io";
import { computeDisciplineScore } from "./lib/analytics";
import { Button, Modal, Field, NumberInput } from "./components/ui";
import { ToastProvider, useToast } from "./components/Toast";
import { PaywallProvider, usePaywall } from "./components/Paywall";
import AffiliateMenu from "./components/AffiliateMenu";
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
  const color = score.tone === "pos" ? "rgb(var(--pos))" : score.tone === "warn" ? "rgb(var(--warn))" : "rgb(var(--neg))";
  return (
    <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 sm:flex">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span className="text-xs text-muted">
        Kỷ luật <span className="num font-medium text-text">{score.score}</span> · {score.label}
      </span>
    </div>
  );
}

const PRINCIPLES = [
  "Bảo toàn vốn là ưu tiên số một — lợi nhuận đến sau.",
  "Không bao giờ giao dịch khi đang mất bình tĩnh.",
  "Tôn trọng kế hoạch hơn tôn trọng cái tôi.",
  "Một lệnh thua đúng kỷ luật tốt hơn một lệnh thắng nhờ may rủi.",
  "Rủi ro bạn nhận phải là rủi ro bạn thật sự hiểu.",
  "Kiên nhẫn cũng là một vị thế.",
  "Thị trường vẫn còn đó ngày mai; tài khoản thì chưa chắc.",
];

function PrincipleBanner() {
  // Stable per calendar day so it reads like a daily creed, not random noise.
  const idx = new Date().getDate() % PRINCIPLES.length;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <p className="text-center font-serif text-[15px] italic text-muted">
        <span className="text-brand">“</span>
        {PRINCIPLES[idx]}
        <span className="text-brand">”</span>
      </p>
    </div>
  );
}

function UpgradeControl() {
  const premium = useSelector((d) => d.license.premium);
  const openPaywall = usePaywall();
  if (premium) {
    return (
      <span className="hidden items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs font-medium text-brand sm:flex">
        <Crown className="h-3.5 w-3.5" /> Premium
      </span>
    );
  }
  return (
    <button
      onClick={openPaywall}
      className="flex items-center gap-1.5 rounded-lg border border-brand/40 px-2.5 py-2 text-xs font-medium text-brand transition hover:bg-brand/10"
      title="Mở khoá tính năng Premium"
    >
      <Crown className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Nâng cấp</span>
    </button>
  );
}

function Header({ onSettings }: { onSettings: () => void }) {
  const theme = useSelector((d) => d.settings.theme);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-[rgb(var(--brand-ink))]">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </div>
          <div className="leading-tight">
            <h1 className="font-serif text-xl text-text">RiskWise</h1>
            <span className="text-[11px] text-faint">Sổ tay giao dịch kỷ luật</span>
          </div>
        </div>

        <DisciplinePill />

        <div className="flex items-center gap-1">
          <AffiliateMenu />
          <UpgradeControl />
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
  const license = useSelector((d) => d.license);
  const openPaywall = usePaywall();
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
        <Field label="Giới hạn rủi ro mỗi ngày (% tài khoản)" hint="Khi tổng rủi ro mở trong ngày vượt ngưỡng, lệnh mới sẽ bị giữ lại cho đến khi bạn xác nhận ghi đè">
          <NumberInput value={dailyLimit} onValue={(n) => actions.setDailyLimit(n)} min={0} step={0.5} />
        </Field>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Gói</p>
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Crown className={clsx("h-4 w-4", license.premium ? "text-brand" : "text-faint")} />
              <span className="text-sm text-text">{license.premium ? "Premium đang hoạt động" : "Bản miễn phí"}</span>
            </div>
            {license.premium ? (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm("Tắt Premium trên thiết bị này?")) {
                    actions.deactivatePremium();
                    toast("Đã tắt Premium.");
                  }
                }}
              >
                Tắt
              </Button>
            ) : (
              <Button variant="outline" onClick={openPaywall}>
                <Crown className="h-4 w-4" /> Nâng cấp
              </Button>
            )}
          </div>
        </div>

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

      <PrincipleBanner />

      {/* Tab navigation — minimal underline */}
      <nav className="mx-auto mt-6 max-w-6xl px-4">
        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  "-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition",
                  active
                    ? "border-brand text-text"
                    : "border-transparent text-muted hover:text-text"
                )}
              >
                <Icon className={clsx("h-4 w-4", active ? "text-brand" : "")} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-7">
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
        <PaywallProvider>
          <Shell />
        </PaywallProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
