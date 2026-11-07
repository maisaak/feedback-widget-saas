import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const styles = cva("inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { primary: "bg-[#c8f751] text-[#20211c] hover:bg-[#b6e33e]", dark: "bg-[#20211c] text-white hover:bg-[#3b3d32]", outline: "border bg-white text-neutral-900 hover:bg-neutral-50", ghost: "text-neutral-700 hover:bg-neutral-100" }, size: { sm: "px-3 py-2 text-xs", md: "px-5 py-3" } }, defaultVariants: { variant: "primary", size: "md" } });
type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles>;
export function Button({ className, variant, size, ...props }: Props) { return <button className={cn(styles({ variant, size }), className)} {...props}/>; }
