import React, { createContext, useContext, useState } from "react";
import { Crown, Check, ShieldCheck, Copy, QrCode, X, KeyRound, Sparkles } from "lucide-react";
import { useSelector } from "../store/store";
import { actions } from "../store/actions";
import { useToast } from "./Toast";
import { Button, TextInput, Field, Badge } from "./ui";
import { verifyLicense } from "../lib/license";
import { clsx } from "../lib/format";

/**
 * Client-side premium gate. There is no server: "activation" simply flips a local
 * entitlement flag. Faithful to the original app's manual VietQR + key flow, but
 * restyled to the calm handbook aesthetic. Edit BANK_INFO for your real account.
 */
const BANK_INFO = {
  bank: "Techcombank",
  bin: "970407", // NAPAS bank BIN for VietQR
  account: "19050048400017",
  holder: "BE QUANG HUY",
};

// Where buyers send their receipt + email to receive an activation key.
const SUPPORT_CONTACT = "adminriskwise@gmail.com";

const PLANS = {
  yearly: { label: "Gói năm", price: "999.000đ", amount: 999000, note: "~83.000đ/tháng · tiết kiệm 58%", best: true },
  monthly: { label: "Gói tháng", price: "199.000đ", amount: 199000, note: "gia hạn từng tháng", best: false },
} as const;

/** Live, scannable VietQR (amount + memo pre-filled) via img.vietqr.io, with a graceful fallback. */
function VietQr({ amount, memo }: { amount: number; memo: string }) {
  const [errored, setErrored] = useState(false);
  const src = `https://img.vietqr.io/image/${BANK_INFO.bin}-${BANK_INFO.account}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(
    memo
  )}&accountName=${encodeURIComponent(BANK_INFO.holder)}`;
  if (errored) {
    return (
      <div className="mx-auto mb-2 grid h-32 w-32 place-items-center rounded-lg bg-surface-2 text-faint">
        <QrCode className="h-9 w-9" />
      </div>
    );
  }
  return (
    <img
      src={src}
      onError={() => setErrored(true)}
      alt="VietQR Techcombank"
      className="mx-auto mb-2 h-36 w-36 rounded-lg bg-white p-1.5"
    />
  );
}
type PlanId = keyof typeof PLANS;

const PERKS = [
  "Mở khoá tab Phân tích kỷ luật nâng cao (Expert System, equity curve, PnL theo cảm xúc)",
  "Tạo tối đa 5 bộ checklist tuỳ biến cho từng chiến lược",
  "Theo dõi điểm kỷ luật dài hạn để sửa thói quen giao dịch",
  "Ủng hộ một công cụ độc lập, không quảng cáo, dữ liệu nằm trên máy bạn",
];

const PaywallCtx = createContext<() => void>(() => {});
export const usePaywall = () => useContext(PaywallCtx);

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <PaywallCtx.Provider value={() => setOpen(true)}>
      {children}
      {open && <PaywallModal onClose={() => setOpen(false)} />}
    </PaywallCtx.Provider>
  );
}

/** Full-panel lock shown in place of a premium-only feature for free users. */
export function PremiumLock({ title, description }: { title: string; description: string }) {
  const openPaywall = usePaywall();
  return (
    <div className="card flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Crown className="h-7 w-7" />
      </div>
      <div>
        <p className="font-serif text-xl text-text">{title}</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{description}</p>
      </div>
      <Button onClick={openPaywall}>
        <Crown className="h-4 w-4" /> Mở khoá Premium
      </Button>
      <p className="text-[11px] text-faint">Từ 199.000đ · kích hoạt ngay trên máy bạn</p>
    </div>
  );
}

function PaywallModal({ onClose }: { onClose: () => void }) {
  const premium = useSelector((d) => d.license.premium);
  const toast = useToast();
  const [plan, setPlan] = useState<PlanId>("yearly");
  const [tab, setTab] = useState<"activate" | "transfer">("activate");
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const memo = `RISKWISE ${plan.toUpperCase()} ${(email.trim() || "EMAIL").toUpperCase()}`;

  const copyMemo = () => {
    navigator.clipboard?.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Unlock requires an email + key that cryptographically match (see lib/license.ts).
  const activate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !key.trim()) {
      toast("Nhập email và key kích hoạt.", "error");
      return;
    }
    setVerifying(true);
    const ok = await verifyLicense(cleanEmail, key);
    setVerifying(false);
    if (!ok) {
      toast("Email và key không khớp. Hãy nhập đúng email bạn đã dùng khi mua.", "error");
      return;
    }
    actions.activatePremium({ key: key.trim(), email: cleanEmail.toLowerCase(), plan });
    toast("Đã kích hoạt Premium. Cảm ơn bạn!", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(38_35_30_/_0.55)] backdrop-blur-[2px]" onClick={onClose} />
      <div className="card animate-fade-in relative z-10 grid max-h-[92vh] w-full max-w-3xl grid-cols-1 overflow-y-auto p-0 md:grid-cols-12">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-faint transition hover:bg-surface-2 hover:text-text"
          aria-label="close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left — value proposition */}
        <div className="space-y-5 p-7 md:col-span-7">
          <Badge tone="brand">
            <Crown className="h-3.5 w-3.5" /> RiskWise Premium
          </Badge>
          <h2 className="font-serif text-2xl text-text">
            Mở khoá bộ não phân tích kỷ luật
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Bản miễn phí giúp bạn dựng thói quen ghi chép và quản trị rủi ro. Bản Premium mở khoá phần phân
            tích hành vi để bạn nhìn thẳng vào kỷ luật của chính mình — và sửa nó.
          </p>
          <ul className="space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-text">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-pos" />
                <span className="leading-snug">{p}</span>
              </li>
            ))}
          </ul>
          <div className="inset flex items-start gap-3 rounded-xl p-3 text-xs leading-relaxed text-muted">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            95% trader thua không phải vì phân tích sai, mà vì giao dịch vội vã, trả thù hay buông xuôi sau chuỗi thua.
          </div>
        </div>

        {/* Right — checkout */}
        <div className="border-t border-border bg-surface-2/40 p-6 md:col-span-5 md:border-l md:border-t-0">
          {premium ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
              <ShieldCheck className="h-12 w-12 text-pos" />
              <p className="font-serif text-lg text-text">Bạn đang dùng Premium</p>
              <p className="text-sm text-muted">Cảm ơn bạn đã ủng hộ. Mọi tính năng đã được mở khoá.</p>
              <Button variant="outline" className="mt-2" onClick={onClose}>
                Đóng
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan selector */}
              <div className="space-y-2">
                {(Object.keys(PLANS) as PlanId[]).map((id) => {
                  const p = PLANS[id];
                  const active = plan === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setPlan(id)}
                      className={clsx(
                        "relative flex w-full items-center justify-between rounded-xl border p-3 text-left transition",
                        active ? "border-brand bg-brand/5" : "border-border hover:border-border-strong"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={clsx(
                            "flex h-4 w-4 items-center justify-center rounded-full border",
                            active ? "border-brand" : "border-border-strong"
                          )}
                        >
                          {active && <span className="h-2 w-2 rounded-full bg-brand" />}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-text">{p.label}</p>
                          <p className="text-[11px] text-faint">{p.note}</p>
                        </div>
                      </div>
                      <span className="figure text-sm text-brand">{p.price}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tabs: activate (email+key) vs transfer instructions */}
              <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
                <button
                  onClick={() => setTab("activate")}
                  className={clsx(
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                    tab === "activate" ? "bg-surface-2 text-text" : "text-muted hover:text-text"
                  )}
                >
                  Nhập key
                </button>
                <button
                  onClick={() => setTab("transfer")}
                  className={clsx(
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                    tab === "transfer" ? "bg-surface-2 text-text" : "text-muted hover:text-text"
                  )}
                >
                  Cách mua
                </button>
              </div>

              {tab === "activate" ? (
                <form onSubmit={activate} className="space-y-3">
                  <Field label="Email" hint="Đúng email bạn đã dùng khi mua — key gắn với email này.">
                    <TextInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@gmail.com"
                    />
                  </Field>
                  <Field label="Key kích hoạt">
                    <TextInput value={key} onChange={(e) => setKey(e.target.value)} placeholder="RWP1-…" />
                  </Field>
                  <Button type="submit" className="w-full" disabled={verifying}>
                    <KeyRound className="h-4 w-4" /> {verifying ? "Đang kiểm tra…" : "Kích hoạt Premium"}
                  </Button>
                  <p className="text-center text-[10px] text-faint">
                    Kiểm tra ngay trên máy · không gửi dữ liệu đi đâu
                  </p>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-dashed border-border-strong bg-surface p-3 text-center">
                    <div className="mb-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-faint">
                      <QrCode className="h-3.5 w-3.5" /> Quét VietQR / chuyển khoản
                    </div>
                    <VietQr amount={PLANS[plan].amount} memo={memo} />
                    <p className="num text-[11px] leading-relaxed text-muted">
                      {BANK_INFO.bank} · <span className="text-text">{BANK_INFO.account}</span>
                      <br />
                      {BANK_INFO.holder} · <span className="text-brand">{PLANS[plan].price}</span>
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <span className="num select-all rounded-md bg-surface-2 px-2 py-0.5 text-[11px] text-text">
                        {memo}
                      </span>
                      <button type="button" onClick={copyMemo} className="text-faint hover:text-brand" title="Sao chép nội dung CK">
                        {copied ? <Check className="h-3.5 w-3.5 text-pos" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <ol className="list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-muted">
                    <li>Chuyển khoản đúng số tiền, ghi nội dung như trên (kèm email của bạn).</li>
                    <li>
                      Gửi biên lai + email tới <span className="text-text">{SUPPORT_CONTACT}</span> để nhận
                      <span className="text-text"> key kích hoạt</span>.
                    </li>
                    <li>Mở tab “Nhập key”, nhập email + key để mở khoá.</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
