import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-[#718625]", className)} {...props}/>; }
