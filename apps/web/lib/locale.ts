export const LOCALE_COOKIE = "loopback_locale";

export const locales = ["en", "ru"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const intlLocale: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
