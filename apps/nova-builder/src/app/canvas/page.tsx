"use client";
import { ClientOnly } from "@/components/ClientOnly";
// /canvas — public iframe page; no auth redirect.
// Loaded as the iframe src from /builder/[projectId].
// Data arrives via __webstudioSharedSyncEmitter__ injected by the builder.
//
// Constraint: this page MUST remain public. Middleware explicitly whitelists /canvas.
// The canvas has no HTTP session; its data comes from the sync emitter only.

import dynamic from "next/dynamic";
import "../globals.css";
import { animationKeyframesCss } from "@/lib/animationKeyframes";

// Force client-side rendering: Canvas uses window APIs and the sync emitter.
const CanvasClient = dynamic(
  () => import("@/canvas/canvas").then((m) => ({ default: m.Canvas })),
  { ssr: false }
);

const canvasStyles = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
  [data-ws-selected] {
    outline: 2px solid #7c3aed !important;
    outline-offset: 1px;
  }
  [data-ws-hovered]:not([data-ws-selected]) {
    outline: 1px dashed rgba(124,58,237,0.5) !important;
    outline-offset: 1px;
  }
  ${animationKeyframesCss()}
`;

import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $isPreviewMode } from "@/lib/nano-states";

function DiagnosticsOverlay() {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      setErrors((prev) => [...prev, `[Error] ${e.message} at ${e.filename}:${e.lineno}`]);
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg = reason ? (reason.message || String(reason)) : "";
      if (!msg || msg.includes("[object Event]")) return; // ignore benign extension events
      setErrors((prev) => [...prev, `[Promise Rejection] ${msg}`]);
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Override console.error safely
    const origError = console.error;
    console.error = (...args: any[]) => {
      origError(...args);
      const msg = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
      // Filter out harmless hydration warnings
      if (msg.includes("hydration") || msg.includes("Hydration")) return;
      setErrors((prev) => [...prev, `[Console.error] ${msg}`.slice(0, 300)]);
    };

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      console.error = origError;
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 16,
      right: 16,
      width: 360,
      maxHeight: 300,
      overflowY: "auto",
      background: "rgba(220, 38, 38, 0.95)",
      color: "#fff",
      padding: 12,
      borderRadius: 8,
      zIndex: 999999,
      fontSize: 12,
      fontFamily: "monospace",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      border: "1px solid #ef4444"
    }}>
      <div style={{ fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 4, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        {/* i18n-ignore — developer diagnostics overlay */}
        <span>Canvas Diagnostic Errors ({errors.length})</span>
        <button onClick={() => setErrors([])} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Clear{/* i18n-ignore */}</button>
      </div>
      {errors.map((err, i) => (
        <div key={i} style={{ marginBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4 }}>
          {err}
        </div>
      ))}
    </div>
  );
}

function CanvasPage() {
  const isPreview = useStore($isPreviewMode);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const t = searchParams.get("theme");
    if (t === "light" || t === "dark" || t === "elder") {
      setTheme(t);
    }
  }, []);

  // Build className after hydration to avoid SSR/client mismatch.
  // On the server, isPreview and theme are not yet resolved from the URL,
  // so we start with a minimal class list that matches both branches.
  const className = isPreview
    ? "min-h-screen relative"
    : `${theme} text-foreground bg-background min-h-screen relative`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: canvasStyles }} />
      <div className={className} suppressHydrationWarning>
        <CanvasClient />
        {!isPreview && <DiagnosticsOverlay />}
      </div>
    </>
  );
}

// Client-only: skip server rendering (Worker CPU, Error 1102).
export default function Page() {
  return (
    <ClientOnly>
      <CanvasPage />
    </ClientOnly>
  );
}
