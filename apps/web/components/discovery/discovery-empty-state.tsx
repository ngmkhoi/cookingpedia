import Link from "next/link";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DiscoveryEmptyState() {
  return (
    <div className="panel flex min-h-[280px] flex-col items-start justify-between gap-6 rounded-[2.5rem] border border-[var(--line-subtle)] bg-[rgba(251,250,246,0.88)] p-8 shadow-[0_18px_45px_-24px_rgba(22,32,25,0.16)]">
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          Empty shelf
        </p>
        <h2 className="display-title max-w-[12ch] text-[clamp(2rem,4vw,3.2rem)]">
          No recipes match this combination yet.
        </h2>
        <p className="max-w-[56ch] text-sm leading-relaxed text-[var(--muted)]">
          Widen the shelf by clearing one filter or switch to a broader category
          to keep browsing.
        </p>
      </div>
      <Link
        href="/search"
        className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}
      >
        <ArrowCounterClockwise data-icon="inline-start" weight="duotone" />
        Reset discovery
      </Link>
    </div>
  );
}
