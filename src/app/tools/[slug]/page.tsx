import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/site/Breadcrumb";
import { ProcessingBadge } from "@/components/ui/ProcessingBadge";
import { PageShell } from "@/components/ui/PageShell";
import { IconWell, ToolVisual } from "@/components/icons/ToolVisual";
import { CATEGORY_META, getToolBySlug, TOOLS } from "@/data/tools/registry";
import { metadataFromSeo } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return TOOLS.filter((tool) => tool.route.startsWith("/tools/")).map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool" };
  return metadataFromSeo({
    ...tool.seo,
    title: `${tool.seo.title}${tool.status === "active" ? "" : " (Coming soon)"}`,
  });
}

export default async function PlannedToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();
  if (tool.status === "active" && !tool.route.startsWith("/tools/")) {
    redirect(tool.route);
  }

  const category = CATEGORY_META[tool.category];

  return (
    <PageShell className="py-10">
      <Breadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: category.href, label: category.label },
          { label: tool.name },
        ]}
      />
      <div className="mt-6 flex items-start gap-4">
        <span className="shrink-0">
          <IconWell size="lg" tool={tool}>
            <ToolVisual size="md" tool={tool} />
          </IconWell>
        </span>
        <div>
          <h1 className="font-serif text-4xl tracking-tight">{tool.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{tool.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ProcessingBadge type={tool.processingType} />
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
              Coming soon
            </span>
          </div>
        </div>
      </div>
      <p className="mt-8 max-w-2xl text-sm text-muted">
        This tool is in the catalog so you can find it in search and navigation.
        File processing is not implemented yet. The KDP Cover Calculator is the
        live tool today.
      </p>
    </PageShell>
  );
}
