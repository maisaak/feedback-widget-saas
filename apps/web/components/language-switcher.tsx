"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, locales, type Locale } from "../lib/locale";

export function LanguageSwitcher({
  locale,
  label,
  english,
  russian,
  className = "",
}: {
  locale: Locale;
  label: string;
  english: string;
  russian: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center rounded-full border bg-white/70 p-0.5 ${className}`}
    >
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            aria-label={code === "en" ? english : russian}
            disabled={pending}
            onClick={() => choose(code)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.08em] transition ${
              active
                ? "bg-[#20211c] text-white"
                : "text-neutral-600 hover:text-neutral-900"
            } disabled:opacity-60`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
