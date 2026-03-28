import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[1.35rem] text-sm font-medium transition-transform duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-strong)] text-white shadow-[0_14px_30px_-18px_rgba(22,32,25,0.55)]",
        secondary: "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)]",
        ghost: "text-[var(--muted)] hover:bg-black/5"
      },
      size: {
        default: "h-12 px-5 py-3",
        sm: "h-10 rounded-[1rem] px-4",
        lg: "h-14 rounded-[1.5rem] px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
