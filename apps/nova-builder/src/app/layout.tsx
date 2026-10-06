import type { Metadata } from "next";
import { Inter, DM_Serif_Display, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastNotification } from "@/components/ToastNotification";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/types";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-serif",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

// ADR-NB-028 (supersedes ADR-NB-016): the layout no longer reads the locale
// cookie. cookies() forced every route to render per request on the Worker,
// which on Workers Free (10 ms CPU/request) caused intermittent Error 1102.
// Pages are now prerenderable; I18nProvider sets <html lang> on the client.
const DEFAULT_LOCALE: Locale = "en";
const { meta } = getDictionary(DEFAULT_LOCALE);
export const metadata: Metadata = { title: meta.title, description: meta.description };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = DEFAULT_LOCALE;

  return (
    // suppressHydrationWarning: browser extensions (e.g. Katalon) may inject
    // attributes onto <html> after SSR, causing a harmless hydration mismatch.
    <html lang={lang} className={`${inter.variable} ${dmSerifDisplay.variable} ${robotoMono.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <ToastNotification />
        </Providers>
      </body>
    </html>
  );
}
