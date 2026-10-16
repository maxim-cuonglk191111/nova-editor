#!/usr/bin/env node
/**
 * Screenshot Storage & Pruning Utility
 *
 * Keeps `doc/screenshots` lightweight to prevent git repo bloat and disk filling.
 * Scans `doc/VERIFIED.md` and `docs/tasks/*.md` for active references.
 * Automatically prunes unreferenced or obsolete screenshot artifacts if size/count limits are exceeded.
 *
 * Usage:
 *   node scripts/prune-screenshots.mjs [--max-mb=30] [--max-count=25] [--dry-run]
 *   pnpm prune:screenshots
 */

import { readdirSync, statSync, unlinkSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SCREENSHOTS_DIR = join(ROOT, "doc", "screenshots");
const VERIFIED_FILE = join(ROOT, "doc", "VERIFIED.md");
const TASKS_DIR = join(ROOT, "docs", "tasks");

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const maxMbArg = args.find((a) => a.startsWith("--max-mb="));
const maxCountArg = args.find((a) => a.startsWith("--max-count="));

const MAX_TOTAL_BYTES = (maxMbArg ? parseFloat(maxMbArg.split("=")[1]) : 30) * 1024 * 1024;
const MAX_FILE_COUNT = maxCountArg ? parseInt(maxCountArg.split("=")[1], 10) : 25;

function getActiveReferences() {
  const referencedFiles = new Set();

  if (existsSync(VERIFIED_FILE)) {
    const content = readFileSync(VERIFIED_FILE, "utf-8");
    for (const match of content.matchAll(/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)/g)) {
      referencedFiles.add(match[0]);
    }
  }

  if (existsSync(TASKS_DIR)) {
    for (const file of readdirSync(TASKS_DIR)) {
      if (file.endsWith(".md")) {
        const content = readFileSync(join(TASKS_DIR, file), "utf-8");
        for (const match of content.matchAll(/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)/g)) {
          referencedFiles.add(match[0]);
        }
      }
    }
  }

  return referencedFiles;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function runPrune() {
  if (!existsSync(SCREENSHOTS_DIR)) {
    console.log("No screenshot directory found at doc/screenshots. Nothing to prune.");
    process.exit(0);
  }

  const activeRefs = getActiveReferences();
  const entries = readdirSync(SCREENSHOTS_DIR);

  const images = entries
    .filter((name) => /\.(png|jpg|jpeg|webp)$/i.test(name))
    .map((name) => {
      const fullPath = join(SCREENSHOTS_DIR, name);
      const stat = statSync(fullPath);
      return {
        name,
        fullPath,
        size: stat.size,
        mtime: stat.mtimeMs,
        isReferenced: activeRefs.has(name),
      };
    });

  let totalSize = images.reduce((acc, img) => acc + img.size, 0);
  console.log(`\n=== Screenshot Storage Audit ===`);
  console.log(`Directory:   doc/screenshots/`);
  console.log(`Total files: ${images.length} / max ${MAX_FILE_COUNT}`);
  console.log(`Total size:  ${formatBytes(totalSize)} / max ${formatBytes(MAX_TOTAL_BYTES)}`);
  console.log(`Referenced:  ${images.filter((i) => i.isReferenced).length} files\n`);

  const needsPruning = totalSize > MAX_TOTAL_BYTES || images.length > MAX_FILE_COUNT;

  if (!needsPruning) {
    console.log(`✓ Storage is healthy within budget limits. No files pruned.`);
    process.exit(0);
  }

  console.log(`⚠ Storage limit exceeded! Pruning excess screenshot files...\n`);

  // Sort candidate files: unreferenced first, then oldest by mtime
  const sorted = [...images].sort((a, b) => {
    if (a.isReferenced !== b.isReferenced) {
      return a.isReferenced ? 1 : -1; // unreferenced first
    }
    return a.mtime - b.mtime; // oldest first
  });

  const pruned = [];
  let currentSize = totalSize;
  let currentCount = images.length;

  for (const item of sorted) {
    if (currentSize <= MAX_TOTAL_BYTES && currentCount <= MAX_FILE_COUNT) {
      break;
    }

    pruned.push(item);
    currentSize -= item.size;
    currentCount -= 1;

    if (!dryRun) {
      unlinkSync(item.fullPath);
    }
  }

  for (const item of pruned) {
    console.log(`  - ${dryRun ? "[DRY RUN] Would delete" : "Deleted"}: ${item.name} (${formatBytes(item.size)})${item.isReferenced ? " [REF]" : " [UNREF]"}`);
  }

  console.log(`\nPruned ${pruned.length} file(s). New size: ${formatBytes(currentSize)} in ${currentCount} file(s).\n`);
}

runPrune();
