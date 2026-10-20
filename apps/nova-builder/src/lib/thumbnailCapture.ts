"use client";

import { $instances } from "@/lib/data-stores";
import { $brandingName } from "@/lib/nano-states";
import type { Instance } from "@webstudio-is/sdk";

export function extractProjectPreviewData(instances: Map<string, Instance>): {
  title: string;
  subtitle: string;
} {
  let title = "";
  let subtitle = "";

  for (const inst of instances.values()) {
    if (!title && inst.component === "Heading") {
      const textChild = inst.children.find((c) => c.type === "text") as { type: "text"; value: string } | undefined;
      if (textChild?.value?.trim()) {
        title = textChild.value.trim();
      }
    }
    if (!subtitle && (inst.component === "Paragraph" || inst.component === "Text")) {
      const textChild = inst.children.find((c) => c.type === "text") as { type: "text"; value: string } | undefined;
      if (textChild?.value?.trim()) {
        subtitle = textChild.value.trim();
      }
    }
    if (title && subtitle) break;
  }

  return {
    title: title || "Untitled Website",
    subtitle: subtitle || "Designed with Nova",
  };
}

export function generateProjectThumbnailSvg({
  title,
  subtitle,
  brand,
  theme = "light",
  accentColor = "#7c3aed",
}: {
  title: string;
  subtitle?: string;
  brand?: string;
  theme?: string;
  accentColor?: string;
}): string {
  const isDark = theme === "dark";
  const bg = isDark ? "#0f172a" : "#ffffff";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#f8fafc";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const text = isDark ? "#ffffff" : "#0f172a";
  const textMuted = isDark ? "#94a3b8" : "#64748b";

  const safeBrand = (brand || "Nova").replace(/[<>&"]/g, "");
  const safeTitle = (title || "Untitled Website").replace(/[<>&"]/g, "").slice(0, 48);
  const safeSub = (subtitle || "Designed with Nova AI").replace(/[<>&"]/g, "").slice(0, 75);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" fill="none">
    <rect width="640" height="360" rx="8" fill="${bg}"/>
    <defs>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="${border}" stroke-width="0.75" stroke-opacity="0.6"/>
      </pattern>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.04"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" rx="8" fill="url(#glow)"/>
    <rect width="640" height="360" fill="url(#grid)"/>

    <rect x="24" y="20" width="592" height="28" rx="6" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
    <circle cx="40" cy="34" r="4" fill="#ef4444" fill-opacity="0.7"/>
    <circle cx="54" cy="34" r="4" fill="#f59e0b" fill-opacity="0.7"/>
    <circle cx="68" cy="34" r="4" fill="#10b981" fill-opacity="0.7"/>
    <rect x="86" y="26" width="120" height="16" rx="4" fill="${border}" fill-opacity="0.4"/>
    <text x="146" y="38" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="${textMuted}" text-anchor="middle">${safeBrand}</text>

    <rect x="270" y="72" width="100" height="20" rx="10" fill="${accentColor}" fill-opacity="0.12" stroke="${accentColor}" stroke-opacity="0.25"/>
    <text x="320" y="86" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="${accentColor}" text-anchor="middle">✦ ${safeBrand}</text>

    <text x="320" y="140" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="${text}" text-anchor="middle" letter-spacing="-0.02em">${safeTitle}</text>
    <text x="320" y="175" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="400" fill="${textMuted}" text-anchor="middle">${safeSub}</text>

    <rect x="220" y="205" width="96" height="30" rx="6" fill="${accentColor}"/>
    <text x="268" y="224" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Get Started</text>

    <rect x="326" y="205" width="96" height="30" rx="6" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
    <text x="374" y="224" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="${text}" text-anchor="middle">Learn More</text>

    <g transform="translate(64, 255)">
      <rect x="0" y="0" width="156" height="72" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
      <rect x="14" y="16" width="24" height="24" rx="6" fill="${accentColor}" fill-opacity="0.15"/>
      <rect x="46" y="18" width="70" height="8" rx="2" fill="${text}" fill-opacity="0.8"/>
      <rect x="46" y="30" width="94" height="6" rx="2" fill="${textMuted}" fill-opacity="0.5"/>

      <rect x="178" y="0" width="156" height="72" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
      <rect x="192" y="16" width="24" height="24" rx="6" fill="${accentColor}" fill-opacity="0.15"/>
      <rect x="224" y="18" width="70" height="8" rx="2" fill="${text}" fill-opacity="0.8"/>
      <rect x="224" y="30" width="94" height="6" rx="2" fill="${textMuted}" fill-opacity="0.5"/>

      <rect x="356" y="0" width="156" height="72" rx="8" fill="${cardBg}" stroke="${border}" stroke-width="1"/>
      <rect x="370" y="16" width="24" height="24" rx="6" fill="${accentColor}" fill-opacity="0.15"/>
      <rect x="402" y="18" width="70" height="8" rx="2" fill="${text}" fill-opacity="0.8"/>
      <rect x="402" y="30" width="94" height="6" rx="2" fill="${textMuted}" fill-opacity="0.5"/>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function captureCurrentProjectThumbnail(): string {
  const instances = $instances.get();
  const { title, subtitle } = extractProjectPreviewData(instances);
  const brand = $brandingName.get() || "Nova";
  const theme = "dark";

  return generateProjectThumbnailSvg({
    title,
    subtitle,
    brand,
    theme,
  });
}
