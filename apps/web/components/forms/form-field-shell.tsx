import type { ReactNode } from "react";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type FieldStatus = "neutral" | "checking" | "valid";

export function FormFieldShell({
  label,
  htmlFor,
  error,
  helperText,
  status,
  statusText,
  children
}: {
  label: string;
  htmlFor: string;
  error?: string;
  helperText?: string;
  status?: FieldStatus;
  statusText?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-invalid={error ? true : undefined}
      className="flex flex-col gap-2"
    >
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium tracking-tight text-[var(--ink)]"
      >
        {label}
      </label>
      {children}
      <div className="min-h-5 text-[13px] leading-5">
        {error ? (
          <p className="text-[rgba(148,52,45,0.95)]">{error}</p>
        ) : status === "checking" ? (
          <p className="inline-flex items-center gap-2 text-[var(--muted)]">
            <CircleNotch className="text-sm animate-spin" weight="bold" />
            {statusText}
          </p>
        ) : status === "valid" && statusText ? (
          <p className="inline-flex items-center gap-2 text-[rgba(67,102,77,0.92)]">
            <CheckCircle className="text-sm" weight="fill" />
            {statusText}
          </p>
        ) : helperText ? (
          <p className={cn("text-[var(--muted)]", !statusText ? "opacity-100" : "opacity-0")}>
            {statusText ?? helperText}
          </p>
        ) : statusText ? (
          <p className="text-[var(--muted)]">{statusText}</p>
        ) : null}
      </div>
    </div>
  );
}
