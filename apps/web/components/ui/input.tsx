import * as React from "react";
import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "min-h-12 w-full rounded-[1.35rem] border border-[var(--line)] bg-white/50 px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(81,96,68,0.18)] aria-[invalid=true]:border-[rgba(148,52,45,0.45)] aria-[invalid=true]:bg-[rgba(250,240,238,0.86)] aria-[invalid=true]:focus:border-[rgba(148,52,45,0.75)] aria-[invalid=true]:focus:ring-[rgba(148,52,45,0.14)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
