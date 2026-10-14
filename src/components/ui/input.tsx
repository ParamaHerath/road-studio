import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
