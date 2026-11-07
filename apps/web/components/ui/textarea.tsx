import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn("min-h-24 w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-[#718625]", className)} {...props}/>; }
