import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumb, type Crumb } from "@/components/site/Breadcrumb";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { FaqList } from "@/components/ui/FaqList";
import { GuideCard } from "@/components/ui/GuideCard";
import { ProcessingBadge } from "@/components/ui/ProcessingBadge";
import { SectionHeading } from "@/components/ui/PageShell";
import { ToolCard } from "@/components/ui/ToolCard";
import type { FaqItem } from "@/data/faq";
import type { GuideEntry } from "@/data/guides";
import { GUIDES } from "@/data/guides";
import { getToolBySlug } from "@/data/tools/registry";
import { IconWell, ToolVisual } from "@/components/icons/ToolVisual";
import type { ToolDefinition } from "@/types/tools";

export function ToolPageLayout({
  tool,
  breadcrumbs,
  lede,
  badges = [],
  formats,
  children,
  features,
  howItWorks,
  why,
  privacy,
  faqs,
  relatedSlugs,
  guideSlugs,
  extra,
}: {
  tool: ToolDefinition;
  breadcrumbs: Crumb[];
  lede: string;
  badges?: string[];
  formats?: string;
  children: ReactNode;
  features?: Array<{ title: string; body: string }>;
  howItWorks?: Array<{ title: string; body: string }>;
  why?: Array<{ title: string; body: string }>;
  privacy?: string;
  faqs?: FaqItem[];
  relatedSlugs?: string[];
  guideSlugs?: string[];
  extra?: ReactNode;
}) {
  const related = (relatedSlugs ?? tool.relatedTools)
    .map((slug) => getToolBySlug(slug))
    .filter((item): item is ToolDefinition => Boolean(item));
  const guides: GuideEntry[] = GUIDES.filter((guide) =>
    guideSlugs?.includes(guide.slug),
  );

  return (
    <main id="main">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <Breadcrumb items={breadcrumbs} />
        <header className="mt-6 flex max-w-4xl items-start gap-4">
          <IconWell size="lg" tool={tool}>
            <ToolVisual size="md" tool={tool} />
          </IconWell>
          <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            {tool.category === "kdp" ? "KDP & Publishing" : tool.category}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {tool.name}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{lede}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ProcessingBadge type={tool.processingType} />
            {badges.map((badge) => (
              <span
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted"
                key={badge}
              >
                {badge}
              </span>
            ))}
          </div>
          {formats ? (
            <p className="mt-3 text-sm text-muted">{formats}</p>
          ) : null}
          </div>
        </header>
        <div className="mt-6">
          <AdPlaceholder slot="hero" />
        </div>
        {children}
        <div className="mt-10">
          <AdPlaceholder slot="content" />
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-6xl space-y-16 px-4 sm:px-6">
        {features?.length ? (
          <section>
            <SectionHeading title="Key features" />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {features.map((item) => (
                <li key={item.title}>
                  <h3 className="font-serif text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {howItWorks?.length ? (
          <section>
            <SectionHeading title="How it works" />
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((item, index) => (
                <li
                  className="card-hover rounded-2xl border border-border bg-white p-5"
                  key={item.title}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-serif text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {why?.length ? (
          <section>
            <SectionHeading title="Why use this tool" />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {why.map((item) => (
                <li key={item.title}>
                  <h3 className="font-serif text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {privacy ? (
          <section className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
            <SectionHeading title="Technical & privacy information" />
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
              {privacy}
            </p>
            <Link
              className="mt-4 inline-block text-sm font-semibold text-primary"
              href="/privacy"
            >
              Privacy Policy →
            </Link>
          </section>
        ) : null}

        {faqs?.length ? (
          <section>
            <SectionHeading title="FAQs" />
            <div className="mt-8">
              <FaqList items={faqs} />
            </div>
          </section>
        ) : null}

        {related.length ? (
          <section>
            <SectionHeading title="Related tools" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ToolCard key={item.slug} tool={item} />
              ))}
            </div>
          </section>
        ) : null}

        {guides.length ? (
          <section>
            <SectionHeading title="Guides" />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {guides.map((guide) => (
                <GuideCard guide={guide} key={guide.slug} />
              ))}
            </div>
          </section>
        ) : null}

        {extra}
        <AdPlaceholder slot="lower" />
      </div>
    </main>
  );
}

export { ToolPageLayout as ToolPageShell };
