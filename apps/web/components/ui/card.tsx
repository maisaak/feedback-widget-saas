import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) { return <section className={cn("rounded-xl border bg-white shadow-[0_1px_2px_#24241c08]", className)} {...props}/>; }
