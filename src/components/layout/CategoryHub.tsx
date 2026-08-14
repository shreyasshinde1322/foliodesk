import Link from "next/link";
import { Breadcrumb } from "@/components/site/Breadcrumb";
import { PageShell } from "@/components/ui/PageShell";
import { ToolCard } from "@/components/ui/ToolCard";
import { WorkflowSteps } from "@/components/ui/WorkflowSteps";
import {
  CATEGORY_META,
  getGroupedTools,
  getToolsByCategory,
} from "@/data/tools/registry";
import type { ToolCategory } from "@/types/tools";

export function CategoryHub({ category }: { category: ToolCategory }) {
  const meta = CATEGORY_META[category];
  const groups = getGroupedTools(category);
  const tools = getToolsByCategory(category);
  const live = tools.filter((tool) => tool.status === "active").length;

  return (
    <PageShell className="pb-16 pt-8">
      <Breadcrumb items={[{ href: "/", label: "Home" }, { label: meta.label }]} />
      <header className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-white to-primary-soft/50 p-6 shadow-[var(--shadow-card)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {meta.label}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="max-w-2xl font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {meta.headline}
          </h1>
          <p className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted">
            {live} live {live === 1 ? "tool" : "tools"}
          </p>
        </div>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {meta.description}
        </p>
        <WorkflowSteps current={0} steps={meta.workflow} />
        {category === "kdp" ? (
          <Link
            className="btn-primary mt-6"
            href="/kdp-cover-calculator"
          >
            Open cover calculator
          </Link>
        ) : null}
      </header>
      <div className="mt-12 grid gap-12">
        {groups.map((group) => (
          <section key={group.id}>
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">{group.label}</h2>
              <p className="text-xs text-muted">
                {group.tools.length} {group.tools.length === 1 ? "tool" : "tools"}
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
