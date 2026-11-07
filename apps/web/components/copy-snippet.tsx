"use client";
import { useState } from "react";
export function CopySnippet({ value, label, copiedLabel, ariaLabel }: { value: string; label: string; copiedLabel: string; ariaLabel: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }
  return <><button type="button" aria-label={ariaLabel} onClick={() => void copy()} className="shrink-0 rounded-md border border-white/15 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#c8f751]">{copied ? copiedLabel : label}</button><span className="sr-only" aria-live="polite">{copied ? copiedLabel : ""}</span></>;
}
