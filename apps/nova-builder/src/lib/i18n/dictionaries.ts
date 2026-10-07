import { I18nDictionary, Locale } from "./types";
import { enDictionary } from "./locales/en";
import { viDictionary } from "./locales/vi";

export const DICTIONARIES: Record<Locale, I18nDictionary> = {
  en: enDictionary,
  vi: viDictionary,
};

export function getDictionary(locale: Locale): I18nDictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

/**
 * Dictionary for code outside React (toasts from feature helpers). The
 * I18nProvider keeps <html lang> in sync with the active locale, so it is the
 * single source of truth here.
 */
export function getActiveDictionary(): I18nDictionary {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "en";
  return getDictionary(lang === "vi" ? "vi" : "en");
}
