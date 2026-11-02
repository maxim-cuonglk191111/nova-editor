"use client";
import { useI18n } from "@/lib/i18n";
import { LEGACY_COPY, type LegacyCopy } from "./legacyCopy";

/** The old landing's strings in the visitor's language. */
export function useLegacyCopy(): LegacyCopy {
  const { locale } = useI18n();
  return LEGACY_COPY[locale === "vi" ? "vi" : "en"];
}
