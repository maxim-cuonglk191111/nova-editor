"use client";
// Contains a render crash to one part of the UI (e.g. the canvas tree) instead of
// letting it bubble to global-error, which replaces the whole document. Document data
// lives in nanostores outside React, so a reset re-renders from the same data.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

interface Props {
  children: ReactNode;
  /** When this value changes (e.g. the instances map after an undo), the boundary retries. */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
}

function Fallback({ onRetry }: { onRetry: () => void }) {
  const S = useI18n().t.site;
  const btn = { padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" } as const;
  return (
    <div role="alert" style={{ margin: "64px auto", maxWidth: 440, padding: 24, textAlign: "center", border: "1px solid #d4d4d8", borderRadius: 8, background: "#fafaf9", color: "#18181b", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ fontSize: 17, margin: "0 0 8px" }}>{S.sectionErrorTitle}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "#3f3f46", margin: "0 0 16px" }}>{S.sectionErrorBody}</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button onClick={onRetry} style={{ ...btn, border: "none", background: "#18181b", color: "#fff" }}>{S.errorRetry}</button>
        <button onClick={() => window.location.reload()} style={{ ...btn, border: "1px solid #a1a1aa", background: "transparent", color: "#18181b" }}>{S.sectionErrorReload}</button>
      </div>
    </div>
  );
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[section-error]", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (this.state.error) return <Fallback onRetry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}
