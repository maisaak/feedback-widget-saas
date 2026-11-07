import "server-only";

import { cookies } from "next/headers";
import { en, type Messages } from "../messages/en";
import { ru } from "../messages/ru";
import { defaultLocale, intlLocale, isLocale, LOCALE_COOKIE, type Locale } from "./locale";

export { LOCALE_COOKIE, defaultLocale, intlLocale, isLocale, locales, type Locale } from "./locale";

const dictionaries: Record<Locale, Messages> = { en, ru };

export function getMessagesFor(locale: Locale): Messages {
  return dictionaries[locale];
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getI18n(): Promise<{
  locale: Locale;
  t: Messages;
  intl: string;
}> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale], intl: intlLocale[locale] };
}
