import Link from "next/link";
import { CATEGORY_META } from "@/data/tools/registry";
import { IconWell, ToolVisual } from "@/components/icons/ToolVisual";
import type { ToolDefinition } from "@/types/tools";

export function ToolCard({
  tool,
  popular = false,
}: {
  tool: ToolDefinition;
  popular?: boolean;
}) {
  const upcoming = tool.status !== "active";
  return (
    <Link
      className="group flex h-full flex-col rounded-xl border border-border bg-white p-5 transition-[border-color,box-shadow] duration-[var(--ease-fast)] hover:border-primary/25 hover:shadow-[var(--shadow-card)]"
      href={tool.route}
    >
      <div className="flex items-start justify-between gap-3">
        <IconWell size="sm" tool={tool}>
          <ToolVisual size="sm" tool={tool} />
        </IconWell>
        {popular ? (
          <span className="text-[11px] font-medium text-muted">Popular</span>
        ) : upcoming ? (
          <span className="text-[11px] font-medium text-muted">Soon</span>
        ) : null}
      </div>
      <h3 className="mt-5 text-sm font-semibold text-text">{tool.name}</h3>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
        {tool.description}
      </p>
    </Link>
  );
}

export function ToolListItem({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      className="group flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-paper-deep"
      href={tool.route}
    >
      <ToolVisual size="sm" tool={tool} />
      <span>
        <span className="block text-sm font-medium text-text">{tool.name}</span>
        <span className="mt-0.5 block text-xs text-muted">
          {CATEGORY_META[tool.category].label}
          {tool.status !== "active" ? " · Coming soon" : ""}
        </span>
      </span>
    </Link>
  );
}

export function FeaturedToolCard({
  tool,
}: {
  tool: ToolDefinition;
  notes?: string[];
}) {
  return <ToolCard popular={tool.popular} tool={tool} />;
}
