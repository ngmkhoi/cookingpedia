import { cn } from "../../lib/utils";

export function CardSurface({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("panel", className)}>{children}</div>;
}
