import { useState } from "react";
import { ShieldCheck, LogIn, UserPlus, Loader2, MailCheck } from "lucide-react";
import { authActions } from "./AuthProvider";
import { Button, Field, TextInput } from "./ui";
import { useToast } from "./Toast";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast("Nhập email và mật khẩu (tối thiểu 6 ký tự).", "error");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await authActions.signIn(email, password);
        if (error) throw error;
        // On success, the AuthProvider picks up the session and swaps the screen.
      } else {
        const { data, error } = await authActions.signUp(email, password);
        if (error) throw error;
        // If email confirmation is on, there's no session yet.
        if (!data.session) setCheckEmail(true);
      }
    } catch (err) {
      toast(err instanceof Error ? translateAuthError(err.message) : "Có lỗi xảy ra.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (checkEmail) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pos/15 text-pos">
            <MailCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-serif text-xl text-text">Kiểm tra email của bạn</h1>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
              Mình đã gửi liên kết xác nhận tới <span className="text-text">{email}</span>. Bấm vào link đó rồi
              quay lại đăng nhập.
            </p>
          </div>
          <Button variant="outline" onClick={() => { setCheckEmail(false); setMode("signin"); }}>
            Quay lại đăng nhập
          </Button>
        </div>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-[rgb(var(--brand-ink))]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-text">RiskWise</h1>
          <p className="text-[13px] text-muted">Sổ tay giao dịch kỷ luật</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@gmail.com"
          />
        </Field>
        <Field label="Mật khẩu" hint={mode === "signup" ? "Tối thiểu 6 ký tự." : undefined}>
          <TextInput
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signin" ? (
            <LogIn className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === "signin" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-medium text-brand hover:underline"
        >
          {mode === "signin" ? "Đăng ký" : "Đăng nhập"}
        </button>
      </p>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-faint">
        Dữ liệu của bạn được lưu an toàn trên tài khoản và đồng bộ giữa các thiết bị.
      </p>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-7">{children}</div>
    </div>
  );
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email hoặc mật khẩu không đúng.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Email này đã được đăng ký. Hãy đăng nhập.";
  if (m.includes("password")) return "Mật khẩu chưa đạt yêu cầu (tối thiểu 6 ký tự).";
  if (m.includes("email") && m.includes("invalid")) return "Email không hợp lệ.";
  return msg;
}
