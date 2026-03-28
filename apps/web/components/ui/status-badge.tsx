import { cn } from "../../lib/utils";

const statusVariantMap = {
  DRAFT: "bg-stone-200 text-stone-700",
  PENDING: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700"
} as const;

export function StatusBadge({
  status,
  label
}: {
  status: keyof typeof statusVariantMap;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]",
        statusVariantMap[status]
      )}
    >
      {label ?? status}
    </span>
  );
}
