"use client";
// Which model answers: "Auto" walks the free models in turn (the server's fallback chain); the
// others are the providers that have a key on this server, with a plain description and the
// provider's own name. A provider without a key is shown greyed out and says why.
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n } from "@/lib/i18n";
import type { Provider } from "@/lib/aiChat/useAIChat";

type Props = { value: string; providers: Provider[] | null; onChange: (value: string) => void; disabled?: boolean };

const ORDER = ["groq", "mistral", "google", "openrouter", "openai", "anthropic"] as const;

export function ModelPicker({ value, providers, onChange, disabled }: Props) {
  const L = useI18n().t.tools.aiChat;
  const configured = new Map((providers ?? []).map((p) => [p.id, p.keyConfigured]));

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted, fontFamily: C.font, minWidth: 0 }}>
      <span>{L.modelLabel}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={L.modelLabel}
        style={{ background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: C.font, padding: "4px 6px", maxWidth: 190, minWidth: 0 }}
      >
        <option value="auto">{L.modelAuto} · {L.modelAutoHint}</option>
        {providers && ORDER.map((id) => {
          const ok = configured.get(id) === true;
          const info = L.providers[id];
          return (
            <option key={id} value={id} disabled={!ok}>
              {ok ? `${info.name} · ${info.hint}` : `${info.name} · ${L.modelUnavailable}`}
            </option>
          );
        })}
      </select>
    </label>
  );
}
