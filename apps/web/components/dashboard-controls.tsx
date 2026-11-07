"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteFeedbackAction, updateStatusAction } from "../lib/actions";
import { format } from "../lib/format";
import type { FeedbackStatus } from "../lib/data";

type FilterLabels = { searchLabel: string; searchPlaceholder: string; filterGroupLabel: string; statuses: { all: string; new: string; inProgress: string; resolved: string } };
export function InboxFilters({ labels }: { labels: FilterLabels }) {
  const router = useRouter(); const pathname = usePathname(); const search = useSearchParams();
  const [query, setQuery] = useState(search.get("q") ?? ""); const [pending, startTransition] = useTransition();
  useEffect(() => { setQuery(search.get("q") ?? ""); }, [search]);
  useEffect(() => { const timer = window.setTimeout(() => { const params = new URLSearchParams(search.toString()); query ? params.set("q", query) : params.delete("q"); startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false })); }, 250); return () => window.clearTimeout(timer); }, [search, pathname, router, query]);
  const active = search.get("status") ?? "";
  function choose(value: string) { const params = new URLSearchParams(search.toString()); value ? params.set("status", value) : params.delete("status"); startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false })); }
  const tabs = [{ label: labels.statuses.all, value: "" }, { label: labels.statuses.new, value: "new" }, { label: labels.statuses.inProgress, value: "in_progress" }, { label: labels.statuses.resolved, value: "resolved" }];
  return <div className="relative"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><label className="sr-only" htmlFor="feedback-search">{labels.searchLabel}</label><input id="feedback-search" type="search" name="q" autoComplete="off" spellCheck={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.searchPlaceholder} className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-[#718625] sm:max-w-xs"/><div role="group" aria-label={labels.filterGroupLabel} className="flex flex-wrap gap-1">{tabs.map((tab) => <button key={tab.value} type="button" aria-pressed={active === tab.value} onClick={() => choose(tab.value)} className={`rounded-full px-3 py-2 text-xs font-medium transition ${active === tab.value ? "bg-[#20211c] text-white" : "text-neutral-600 hover:bg-neutral-200"}`}>{tab.label}</button>)}</div></div>{pending && <div className="pointer-events-none absolute inset-0 rounded-lg bg-white/45" aria-hidden="true"/>}</div>;
}
export function StatusSelect({ id, status, labels }: { id: string; status: FeedbackStatus; labels: { statusLabel: string; announcement: string; options: { new: string; inProgress: string; resolved: string } } }) {
  const [pending, startTransition] = useTransition(); const [announcement, setAnnouncement] = useState("");
  const statusNames: Record<FeedbackStatus, string> = { new: labels.options.new, in_progress: labels.options.inProgress, resolved: labels.options.resolved };
  return <><select aria-label={labels.statusLabel} disabled={pending} value={status} onChange={(event) => { const next = event.target.value as FeedbackStatus; startTransition(() => { void updateStatusAction(id, next).then(() => setAnnouncement(format(labels.announcement, { status: statusNames[next] }))); }); }} className="h-9 rounded-lg border bg-white text-neutral-900 px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#718625] disabled:opacity-60"><option value="new">{labels.options.new}</option><option value="in_progress">{labels.options.inProgress}</option><option value="resolved">{labels.options.resolved}</option></select><span className="sr-only" aria-live="polite">{announcement}</span></>;
}
export function DeleteFeedback({ id, labels }: { id: string; labels: { deleteFeedback: string; confirmDelete: string; delete: string; confirm: string; deleting: string } }) {
  const [confirm, setConfirm] = useState(false); const [pending, startTransition] = useTransition();
  useEffect(() => { if (!confirm) return; const timer = window.setTimeout(() => setConfirm(false), 3000); return () => window.clearTimeout(timer); }, [confirm]);
  function remove() { if (!confirm) { setConfirm(true); return; } startTransition(() => { void deleteFeedbackAction(id).then(() => setConfirm(false)); }); }
  return <button type="button" onClick={remove} disabled={pending} aria-label={confirm ? labels.confirmDelete : labels.deleteFeedback} className="rounded-md px-2 py-2 text-xs font-medium text-neutral-500 hover:bg-red-50 hover:text-red-800 focus-visible:ring-2 focus-visible:ring-red-700 disabled:opacity-50">{pending ? labels.deleting : confirm ? labels.confirm : labels.delete}</button>;
}
