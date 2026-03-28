import * as React from "react";
import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "min-h-12 w-full rounded-[1.35rem] border border-[var(--line)] bg-white/50 px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(81,96,68,0.18)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
