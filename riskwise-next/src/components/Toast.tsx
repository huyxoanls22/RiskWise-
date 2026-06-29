import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { clsx, uid } from "../lib/format";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

const ToastCtx = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const dismiss = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  const icon = {
    success: <CheckCircle2 className="h-4 w-4 text-pos" />,
    error: <AlertTriangle className="h-4 w-4 text-neg" />,
    info: <Info className="h-4 w-4 text-brand" />,
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "card animate-fade-in flex items-start gap-3 p-3.5 shadow-lg",
              t.kind === "error" && "border-neg/40",
              t.kind === "success" && "border-pos/40"
            )}
          >
            <div className="mt-0.5">{icon[t.kind]}</div>
            <p className="flex-1 text-sm text-text">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-faint hover:text-text">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
