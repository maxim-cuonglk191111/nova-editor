#!/usr/bin/env node
/**
 * i18n Audit — finds user-visible hard-coded text in nova-builder TSX files.
 *
 * Flags:
 *   - JSX text nodes containing letters
 *   - string literals in placeholder= / title= / aria-label= / alt= attributes
 *   - string literals in `label:` object entries (menu / option tables rendered in UI)
 *
 * Text is "hard-coded" when it is not routed through the dictionary (`t.*`).
 * Comments are never scanned (the TypeScript AST drops them).
 *
 * Opt-out: put `i18n-ignore` in a comment on the same line or the line above
 * (for brand names, code samples, demo data that is user content, etc.).
 *
 * Run:  node scripts/i18n-audit.mjs [--max=N] [--summary] [--dir=<src dir>]
 * Or:   pnpm i18n:audit -- --max=N
 *
 * Exit 0 = total <= max (or no --max given); 1 = total > max.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── CONFIG ────────────────────────────────────────────────────────────────────

const CONFIG = {
  scanDir: join(ROOT, "apps", "nova-builder", "src"),
  // Path fragments (posix, relative to scanDir) that are never scanned.
  skip: [
    /(^|\/)__tests__\//,
    /\.test\.tsx$/,
    /\.stories\.tsx$/,
    /^lib\/i18n\/locales\//,
    // Canvas renderer internals render the user's own page content.
    /^canvas\//,
    // Component thumbnails + default instance text: sample content the user drops on the canvas.
    // (Panel chrome for this file — categories, descriptions — is localised via t.componentCatalog.)
    // Split per category into registry/ (task 007) — same sample content.
    /^builder\/left-sidebar\/components\/(ComponentRegistry\.tsx$|registry\/)/,
  ],
  attributes: new Set(["placeholder", "title", "aria-label", "alt", "label"]),
  objectKeys: new Set(["label"]),
  // Words that read the same in every supported locale. Text made only of these
  // (plus punctuation / numbers) is not flagged.
  universalWords: new Set([
    "ai", "css", "html", "js", "json", "jsx", "tsx", "react", "seo", "cms", "url", "urls",
    "api", "id", "px", "rem", "em", "vh", "vw", "svg", "png", "jpg", "nova", "webstudio",
    "github", "google", "gmail", "x", "y", "z", "rgb", "rgba", "hsl", "hex", "ok", "dns",
    "cname", "txt", "en", "vi", "deg", "true", "false", "fr", "http", "https", "www", "sm", "md", "lg", "xl", "auto", "ms", "s",
  ]),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory() && entry !== "node_modules" && !entry.startsWith(".")) out.push(...walk(full));
    else if (st.isFile() && extname(entry) === ".tsx") out.push(full);
  }
  return out;
}

const posix = (p) => p.replace(/\\/g, "/");

function needsTranslation(text) {
  const trimmed = text.replace(/&[a-z]+;|&#\d+;/gi, " ").replace(/\s+/g, " ").trim();
  if (!/\p{L}/u.test(trimmed)) return false;
  if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(trimmed) || /^(https?:\/\/|www\.)\S+$/.test(trimmed)) return false;
  const words = trimmed.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.every((w) => CONFIG.universalWords.has(w))) return false;
  // CSS pseudo-selectors (":hover") and HTTP verbs are syntax, not prose.
  if (/^:[a-z-]+$/.test(trimmed) || /^(GET|POST|PUT|PATCH|DELETE)$/.test(trimmed)) return false;
  // Single tokens that look like code / CSS identifiers (e.g. "flex", "#fff", "x-y").
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(trimmed)) return false;
  return true;
}

function isIgnored(lines, line) {
  return /i18n-ignore/.test(lines[line] ?? "") || /i18n-ignore/.test(lines[line - 1] ?? "");
}

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits = [];

  const report = (node, text) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    if (!needsTranslation(text) || isIgnored(lines, line)) return;
    hits.push({ line: line + 1, text: text.replace(/\s+/g, " ").trim() });
  };

  // Attribute value: "x" or {<child-literal expression>}.
  const attrLiterals = (init) => {
    if (!init) return [];
    if (ts.isStringLiteral(init)) return [init];
    if (ts.isJsxExpression(init) && init.expression) return childLiterals(init.expression);
    return [];
  };

  // String literals rendered directly as JSX children: {"x"}, {a ? "x" : "y"}, {a && "x"}, {a || "x"}.
  const childLiterals = (expr) => {
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return [expr];
    if (ts.isParenthesizedExpression(expr)) return childLiterals(expr.expression);
    if (ts.isConditionalExpression(expr)) return [...childLiterals(expr.whenTrue), ...childLiterals(expr.whenFalse)];
    if (ts.isBinaryExpression(expr) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(expr.operatorToken.kind)) {
      return childLiterals(expr.right);
    }
    return [];
  };

  // Raw text inside these elements is code, not prose.
  const CODE_TAGS = new Set(["style", "script", "code", "pre", "kbd"]);
  const insideCodeTag = (node) => {
    for (let p = node.parent; p; p = p.parent) {
      if (ts.isJsxElement(p) && CODE_TAGS.has(p.openingElement.tagName.getText(sf))) return true;
    }
    return false;
  };

  const visit = (node) => {
    if ((ts.isJsxText(node) || ts.isJsxExpression(node)) && insideCodeTag(node)) {
      // skip
    } else if (ts.isJsxText(node)) {
      report(node, node.text);
    } else if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      for (const lit of childLiterals(node.expression)) report(lit, lit.text);
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf);
      if (CONFIG.attributes.has(name)) {
        attrLiterals(node.initializer).forEach((lit) => report(lit, lit.text));
      }
    } else if (ts.isPropertyAssignment(node)) {
      const key = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : null;
      if (key && CONFIG.objectKeys.has(key)) {
        childLiterals(node.initializer).forEach((lit) => report(lit, lit.text));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const maxArg = args.find((a) => a.startsWith("--max="));
const max = maxArg ? Number(maxArg.slice("--max=".length)) : null;
const summaryOnly = args.includes("--summary");
const dirArg = args.find((a) => a.startsWith("--dir="));
if (dirArg) CONFIG.scanDir = dirArg.slice("--dir=".length);

const perFile = [];
let total = 0;
for (const file of walk(CONFIG.scanDir)) {
  const relToSrc = posix(relative(CONFIG.scanDir, file));
  if (CONFIG.skip.some((re) => re.test(relToSrc))) continue;
  const hits = scanFile(file);
  if (hits.length === 0) continue;
  const relPath = posix(relative(ROOT, file));
  perFile.push({ relPath, hits });
  total += hits.length;
}

perFile.sort((a, b) => a.relPath.localeCompare(b.relPath));
for (const { relPath, hits } of perFile) {
  if (summaryOnly) {
    console.log(`${String(hits.length).padStart(4)}  ${relPath}`);
    continue;
  }
  for (const h of hits) console.log(`${relPath}:${h.line}  ${h.text}`);
}

console.log(`\ni18n audit: ${total} hard-coded string(s) in ${perFile.length} file(s)`);
if (max != null && !Number.isNaN(max)) {
  if (total > max) {
    console.log(`FAIL — ${total} > --max=${max}. Move the new strings into lib/i18n/locales.`);
    process.exit(1);
  }
  console.log(`OK — ${total} <= --max=${max}`);
}
