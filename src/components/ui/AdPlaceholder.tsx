export function AdPlaceholder({
  slot = "content",
}: {
  slot?: "hero" | "content" | "lower";
}) {
  const minHeight = slot === "hero" ? "min-h-[90px]" : "min-h-[120px]";
  return (
    <aside
      aria-label="Advertisement placeholder"
      className={`flex ${minHeight} items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border bg-gradient-to-br from-paper-deep/70 to-primary-soft/40 px-4 py-6 text-center`}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Advertisement
        </p>
        <p className="mt-1 text-xs text-muted">
          Reserved placement. Ads are not loaded in this version.
        </p>
      </div>
    </aside>
  );
}
