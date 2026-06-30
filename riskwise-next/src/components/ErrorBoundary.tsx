import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere below it and shows a recoverable fallback
 * instead of a blank white page. Without this, a single thrown error (e.g. an
 * invalid Intl currency code) unmounts the whole React tree.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface for debugging; in production this could go to a logging service.
    console.error("Render error caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neg/10 text-neg">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-lg font-black text-text">Đã xảy ra lỗi hiển thị</h1>
            <p className="mt-1 max-w-md text-sm text-muted">
              Ứng dụng gặp sự cố khi vẽ giao diện. Dữ liệu của bạn vẫn được lưu an toàn trên trình duyệt.
            </p>
          </div>
          <pre className="inset max-w-md overflow-x-auto rounded-xl p-3 text-left text-[11px] text-neg">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-[rgb(var(--brand-ink))] transition hover:brightness-110"
          >
            <RotateCcw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
