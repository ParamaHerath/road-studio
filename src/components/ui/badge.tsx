import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-800 text-zinc-100 border-zinc-700",
        secondary: "border-transparent bg-zinc-900 text-zinc-300 border-zinc-800",
        destructive: "border-transparent bg-rose-500/20 text-rose-300 border-rose-500/30",
        outline: "border-zinc-800 text-zinc-300",
        success: "border-transparent bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        warning: "border-transparent bg-amber-500/20 text-amber-300 border-amber-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
