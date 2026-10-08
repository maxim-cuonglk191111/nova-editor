import { writeStyleProperty } from "@/lib/styleWriteHelper";
import { UI_VARS as C } from "@/lib/uiTheme";
import { useI18n, fmt } from "@/lib/i18n";

// ── Track list parsing ─────────────────────────────────────────────────────────

function parseTrackList(css: string): string[] {
  const trimmed = css.trim();
  if (!trimmed || trimmed === "none") return [];
  const tokens: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === "(") depth++;
    else if (trimmed[i] === ")") depth--;
    else if ((trimmed[i] === " " || trimmed[i] === "\t") && depth === 0) {
      const tok = trimmed.slice(start, i).trim();
      if (tok) tokens.push(tok);
      start = i + 1;
    }
  }
  const last = trimmed.slice(start).trim();
  if (last) tokens.push(last);
  return tokens;
}

function serializeTrackList(tracks: string[]): string {
  return tracks.length === 0 ? "none" : tracks.join(" ");
}

// ── Grid line parsing ──────────────────────────────────────────────────────────

function parseGridLine(css: string): { start: number; span: number } {
  if (!css || css === "auto") return { start: 1, span: 1 };
  const spanMatch = css.match(/^(\d+)\s*\/\s*span\s+(\d+)$/);
  if (spanMatch) return { start: parseInt(spanMatch[1]), span: parseInt(spanMatch[2]) };
  const lineMatch = css.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (lineMatch) {
    const start = parseInt(lineMatch[1]);
    const end = parseInt(lineMatch[2]);
    return { start, span: Math.max(1, end - start) };
  }
  const singleMatch = css.match(/^(\d+)$/);
  if (singleMatch) return { start: parseInt(singleMatch[1]), span: 1 };
  return { start: 1, span: 1 };
}

function serializeGridLine(start: number, span: number): string {
  if (span <= 1) return String(start);
  return `${start} / span ${span}`;
}

// ── Design tokens ──────────────────────────────────────────────────────────────


const numInputStyle: React.CSSProperties = {
  background: C.inputBg,
  border: `1px solid ${C.border}`,
  borderRadius: 3,
  color: C.codeVal,
  fontFamily: C.fontMono,
  fontSize: 12,
  padding: "2px 3px",
  outline: "none",
  width: 36,
  textAlign: "center",
};

// ── TrackSection ───────────────────────────────────────────────────────────────

function TrackSection({
  label,
  property,
  tracks,
  instanceId,
}: {
  label: string;
  property: "gridTemplateColumns" | "gridTemplateRows";
  tracks: string[];
  instanceId: string;
}) {
  const E = useI18n().t.inspector.editors;
  function updateTracks(next: string[]) {
    writeStyleProperty(instanceId, property, serializeTrackList(next));
  }
  // repeat(auto-fit, …) already creates as many tracks as fit; appending a
  // flexible track to it is invalid CSS and collapses the grid to one column.
  const autoRepeat = tracks.some((t) => /^repeat\(\s*auto-(fit|fill)/.test(t));

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, padding: "4px 8px 6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontFamily: C.font, color: C.textMuted, fontWeight: 600 }}>
          {label} ({tracks.length})
        </span>
        <button
          onClick={() => updateTracks([...tracks, "1fr"])}
          disabled={autoRepeat}
          title={autoRepeat ? E.autoTracks : fmt(E.addTrack, { label: label.toLowerCase() })}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            color: C.textMuted,
            fontSize: 15,
            width: 20,
            height: 20,
            cursor: "pointer",
            lineHeight: "18px",
            padding: 0,
          }}
        >+</button>
      </div>
      {autoRepeat && (
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: C.font, padding: "2px 0" }}>{E.autoTracks}</div>
      )}
      {tracks.length === 0 && (
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: C.font, padding: "2px 0" }}>
          {fmt(E.noTracks, { label: label.toLowerCase() })}
        </div>
      )}
      {tracks.map((track, index) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
          <span style={{ fontSize: 9, fontFamily: C.fontMono, color: C.textMuted, minWidth: 14, textAlign: "right" }}>
            {index + 1}
          </span>
          <input
            key={`${index}-${track}`}
            type="text"
            defaultValue={track}
            // Commit on blur/Enter, not per keystroke: one undo step per edit.
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (!v || v === track) return;
              const next = [...tracks];
              next[index] = v;
              updateTracks(next);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            style={{
              flex: 1,
              background: C.inputBg,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              color: C.codeVal,
              fontFamily: C.fontMono,
              fontSize: 12,
              padding: "2px 5px",
              outline: "none",
            }}
          />
          <button
            onClick={() => updateTracks(tracks.filter((_, i) => i !== index))}
            disabled={tracks.length <= 1}
            title={E.removeTrack}
            style={{
              background: "none",
              border: "none",
              cursor: tracks.length <= 1 ? "default" : "pointer",
              color: tracks.length <= 1 ? "rgba(255,255,255,0.12)" : "rgba(248,113,113,0.6)",
              fontSize: 13,
              padding: "0 2px",
              lineHeight: 1,
            }}
          >×</button>
        </div>
      ))}
    </div>
  );
}

// ── GridContainerPanel ─────────────────────────────────────────────────────────

export function GridContainerPanel({
  instanceId,
  columnsCss,
  rowsCss,
}: {
  instanceId: string;
  columnsCss: string;
  rowsCss: string;
}) {
  const E = useI18n().t.inspector.editors;
  const columns = parseTrackList(columnsCss);
  const rows = parseTrackList(rowsCss);

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", padding: "5px 12px", background: C.sectionBg }}>
        <span style={{
          fontSize: 12, color: C.textMuted, fontFamily: C.font,
          fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", flex: 1,
        }}>
          {E.gridTracks}
          {(columns.length > 0 || rows.length > 0) && (
            <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 6 }}>
              {columns.length}×{rows.length}
            </span>
          )}
        </span>
      </div>
      <TrackSection label={E.columns} property="gridTemplateColumns" tracks={columns} instanceId={instanceId} />
      <TrackSection label={E.rows} property="gridTemplateRows" tracks={rows} instanceId={instanceId} />
    </div>
  );
}

// ── GridChildPanel ─────────────────────────────────────────────────────────────

export function GridChildPanel({
  instanceId,
  rowCss,
  columnCss,
}: {
  instanceId: string;
  rowCss: string;
  columnCss: string;
}) {
  const E = useI18n().t.inspector.editors;
  // Both axes write grid-column / grid-row styles, which work in any CSS grid.
  const col = parseGridLine(columnCss);
  const row = parseGridLine(rowCss);

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", padding: "5px 12px", background: C.sectionBg }}>
        <span style={{
          fontSize: 12, color: C.textMuted, fontFamily: C.font,
          fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
        }}>
          {E.gridPlacement}
        </span>
      </div>
      <div style={{ padding: "6px 12px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: C.textMuted, fontFamily: C.font, marginBottom: 3 }}>
            {E.colStartSpan}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              type="number" min={1} value={col.start}
              onChange={(e) =>
                writeStyleProperty(instanceId, "gridColumn",
                  serializeGridLine(parseInt(e.target.value) || 1, col.span))
              }
              style={numInputStyle} title={E.columnStartLine}
            />
            <input
              type="number" min={1} value={col.span}
              onChange={(e) =>
                writeStyleProperty(instanceId, "gridColumn",
                  serializeGridLine(col.start, parseInt(e.target.value) || 1))
              }
              style={numInputStyle} title={E.columnSpan}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: C.textMuted, fontFamily: C.font, marginBottom: 3 }}>
            {E.rowStartSpan}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              type="number" min={1} value={row.start}
              onChange={(e) =>
                writeStyleProperty(instanceId, "gridRow",
                  serializeGridLine(parseInt(e.target.value) || 1, row.span))
              }
              style={numInputStyle} title={E.rowStartLine}
            />
            <input
              type="number" min={1} value={row.span}
              onChange={(e) =>
                writeStyleProperty(instanceId, "gridRow",
                  serializeGridLine(row.start, parseInt(e.target.value) || 1))
              }
              style={numInputStyle} title={E.rowSpan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
