"use client";
// Root error boundary for React render crashes. Server-side errors are captured
// by Cloudflare Workers Observability (wrangler.toml [observability]).
import { useEffect } from "react";
import { getDictionary, languageDetector, fmt } from "@/lib/i18n";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Rendered outside the root layout (no I18nProvider) — read the stored locale directly.
  const S = getDictionary(languageDetector.getStoredLocale() ?? "en").site;

  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#0f172a", color: "#e5e7eb", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h2 style={{ fontSize: 18 }}>{S.errorTitle}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{error.digest ? fmt(S.errorCode, { digest: error.digest }) : error.message}</p>
          <button onClick={reset} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "rgba(124,58,237,0.85)", color: "#fff", fontSize: 13, cursor: "pointer" }}>
            {S.errorRetry}
          </button>
        </div>
      </body>
    </html>
  );
}
