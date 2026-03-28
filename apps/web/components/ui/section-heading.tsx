export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h1 className="text-4xl tracking-tight md:text-5xl">{title}</h1>
      {description ? (
        <p className="max-w-[60ch] leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
