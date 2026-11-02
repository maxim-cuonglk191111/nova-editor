"use client";
import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import { $aiPanelOpen } from "@/lib/nano-states";

const STORAGE_KEY = "nova-coachmarks-seen";

type Props = { visible: boolean };

export function CoachMarks({ visible }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  // New sites open straight into AI generation; the tour's click-blocking
  // backdrop must not cover the AI panel's Apply button, so wait until it closes.
  const aiPanelOpen = useStore($aiPanelOpen);

  const MARKS = [
    {
      id: "generate",
      title: t.coachmarks.generate.title,
      body: t.coachmarks.generate.body,
      anchor: "top-right",
    },
    {
      id: "canvas",
      title: t.coachmarks.canvas.title,
      body: t.coachmarks.canvas.body,
      anchor: "center",
    },
    {
      id: "publish",
      title: t.coachmarks.publish.title,
      body: t.coachmarks.publish.body,
      anchor: "top-right",
    },
  ];

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) setDismissed(true);
  }, []);

  function next() {
    if (step < MARKS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  if (!visible || dismissed || aiPanelOpen) return null;

  const mark = MARKS[step];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(17,17,17,0.35)" }}
      />

      {/* Tooltip */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mark.title}
        style={{
          position: "fixed",
          top: mark.anchor === "center" ? "50%" : 64,
          left: mark.anchor === "center" ? "50%" : undefined,
          right: mark.anchor === "top-right" ? 24 : undefined,
          transform: mark.anchor === "center" ? "translate(-50%, -50%)" : undefined,
          zIndex: 9999,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: 22,
          width: 320,
          boxShadow: C.shadowPop,
          fontFamily: C.font,
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: C.text, marginBottom: 8 }}>{mark.title}</div>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, margin: "0 0 18px" }}>{mark.body}</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>
            {step + 1} / {MARKS.length}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={dismiss}
              style={{ height: 36, padding: "0 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textDim, fontSize: 14, cursor: "pointer", fontFamily: C.font }}
            >
              {t.coachmarks.skip}
            </button>
            <button
              onClick={next}
              style={{ height: 36, padding: "0 16px", borderRadius: 10, border: "none", background: C.primary, color: C.onPrimary, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}
            >
              {step < MARKS.length - 1 ? t.coachmarks.next : t.coachmarks.done}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
