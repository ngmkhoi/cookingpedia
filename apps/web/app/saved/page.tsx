import { SavedWorkspace } from "@/components/bookmarks/saved-workspace";

export default function SavedPage() {
  return (
    <main className="page-main">
      <div className="mb-8">
        <h1 className="text-4xl tracking-tight">Saved</h1>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-[var(--muted)]">
          Keep the recipes you want to revisit, then remove them when they no longer matter.
        </p>
      </div>
      <SavedWorkspace />
    </main>
  );
}
