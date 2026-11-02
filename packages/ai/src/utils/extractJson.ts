// Reads the JSON object a model returned: fenced or bare, and repaired when the answer was
// cut off by a token limit. Shared by every agent that asks a provider for JSON.

/**
 * Attempt to repair a JSON string that was truncated mid-stream (e.g. due to
 * a max-token cutoff). Strategy:
 *  1. Strip the trailing partial token that caused the SyntaxError — anything
 *     after the last complete value delimiter (`,`, `}`, `]`, or a closing `"`).
 *  2. Close every unclosed `[` and `{` in LIFO order.
 * This produces a structurally valid (though possibly abbreviated) document
 * rather than throwing, allowing the validator downstream to work with
 * whatever nodes were fully generated.
 */
function repairTruncatedJson(raw: string): string {
  // Walk the string tracking open brackets/braces and whether we're inside a string.
  const stack: Array<"{" | "["> = [];
  let inString = false;
  let escaped = false;
  let lastSafePos = 0; // last position after a complete value delimiter

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') {
      inString = !inString;
      if (!inString) lastSafePos = i + 1; // closing quote = safe boundary
      continue;
    }
    if (inString) continue;

    if (ch === "{" || ch === "[") {
      stack.push(ch as "{" | "[");
    } else if (ch === "}" || ch === "]") {
      stack.pop();
      lastSafePos = i + 1;
    } else if (ch === "," || ch === ":") {
      lastSafePos = i; // after comma/colon the next token may be incomplete
    }
  }

  // Truncate to last known-safe position, then close open containers.
  let repaired = raw.slice(0, lastSafePos).trimEnd();
  // Remove trailing comma or colon before closing (would be invalid JSON)
  repaired = repaired.replace(/[,\s:]+$/, "");

  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === "{" ? "}" : "]";
  }
  return repaired;
}

export function extractJsonPatch(text: string): unknown {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch?.[1] != null ? fenceMatch[1].trim() : text.trim();
  const start = raw.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON found in response");
  const slice = raw.slice(start);

  // First attempt: parse as-is (fast path — handles well-formed output).
  try {
    return JSON.parse(slice);
  } catch {
    // Second attempt: repair truncated JSON and retry.
    const repaired = repairTruncatedJson(slice);
    return JSON.parse(repaired);
  }
}
