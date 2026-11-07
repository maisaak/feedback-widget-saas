"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div role="tablist" className={cn("flex flex-wrap gap-1", className)} {...props}/>; }
export function Tab({ selected, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) { return <button type="button" role="tab" aria-selected={selected} className={cn("rounded-full px-3 py-2 text-xs font-medium transition", selected ? "bg-[#20211c] text-white" : "text-neutral-600 hover:bg-neutral-200", className)} {...props}/>; }
