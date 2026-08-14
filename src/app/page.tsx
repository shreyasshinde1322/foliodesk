import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Sparkles, Workflow } from "lucide-react";
import { CHANGELOG } from "@/data/changelog";
import { HOME_FAQ } from "@/data/faq";
import { GUIDES } from "@/data/guides";
import {
  CATEGORY_META,
  CATEGORY_NAV,
  countActiveTools,
  FEATURED_DOCUMENT_SLUGS,
  FEATURED_KDP_SLUGS,
  getPopularTools,
  getToolBySlug,
  getToolsByCategory,
  getToolsBySlugs,
  QUICK_SEARCH_SLUGS,
} from "@/data/tools/registry";
import { FileWorkspace } from "@/components/home/FileWorkspace";
import { KdpBookVisual } from "@/components/home/KdpBookVisual";
import { FaqList } from "@/components/ui/FaqList";
import { GuideCard } from "@/components/ui/GuideCard";
import { PageShell, SectionHeading } from "@/components/ui/PageShell";
import { ToolCard } from "@/components/ui/ToolCard";
import { WorkflowSteps } from "@/components/ui/WorkflowSteps";
import { ToolVisual } from "@/components/icons/ToolVisual";
import { GlobalSearch } from "@/components/site/GlobalSearch";
import { SITE } from "@/lib/site";
import type { ToolCategory, ToolDefinition } from "@/types/tools";

export const metadata: Metadata = {
  title: "Everything you need to work with files",
  description: SITE.description,
};

export default function HomePage() {
  const popular = getPopularTools().slice(0, 6);
  const featuredDocs = getToolsBySlugs([...FEATURED_DOCUMENT_SLUGS]);
  const featuredKdp = getToolsBySlugs([...FEATURED_KDP_SLUGS]);
  const quick = getToolsBySlugs([...QUICK_SEARCH_SLUGS]);
  const cover = getToolBySlug("kdp-cover-calculator");
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        type="application/ld+json"
      />
      <PageShell className="pb-8 pt-10 sm:pt-14">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-sm font-semibold text-primary shadow-[var(--shadow-subtle)]">
              <Sparkles className="h-3.5 w-3.5" />
              FolioDesk
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[2.6rem] font-semibold leading-[1.12] tracking-tight text-text sm:text-6xl">
              Everything you need to work with{" "}
              <span className="text-gradient">files</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Convert, compress, organize and prepare documents, images and
              books with practical tools built for everyday work.
            </p>
            <div className="mt-8 max-w-xl">
              <GlobalSearch variant="hero" />
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {quick.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    className="inline-flex rounded-full border border-border bg-white px-3.5 py-1.5 text-sm text-text shadow-[var(--shadow-subtle)] transition-colors hover:border-primary/40 hover:text-primary"
                    href={tool.route}
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface-raised rounded-2xl border border-border bg-white/80 p-6 sm:p-8">
            <FileWorkspace />
            <p className="mt-6 text-center text-xs text-muted">
              File tools are live in the browser — nothing is uploaded.
            </p>
          </div>
        </section>

        <section className="mt-20">
          <SectionHeading title="Popular tools" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((tool) => (
              <ToolCard key={tool.slug} popular={tool.popular} tool={tool} />
            ))}
          </div>
        </section>

        <section className="mt-24">
          <SectionHeading
            description="Counts reflect tools that are live today."
            title="Browse by category"
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {CATEGORY_NAV.map((item) => (
              <CategoryOverviewCard
                category={item.category}
                key={item.category}
              />
            ))}
          </div>
        </section>

        <section className="mt-24">
          <SectionHeading description="Only shipped work is listed here." title="What's new" />
          <div className="mt-10 grid gap-4">
              {CHANGELOG.map((entry) => {
                const tool = entry.slug ? getToolBySlug(entry.slug) : undefined;
                return (
                  <Link
                    className="group card-hover flex items-start gap-4 rounded-2xl border border-border bg-white p-5"
                    href={entry.href}
                    key={`${entry.date}-${entry.title}`}
                  >
                    {tool ? <ToolVisual size="md" tool={tool} /> : null}
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <time dateTime={entry.date}>{entry.date}</time>
                        {entry.badge ? (
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 font-semibold text-primary">
                            {entry.badge}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold">{entry.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {entry.description}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-primary">Open tool →</p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>

        <section className="mt-24">
          <SectionHeading title="Why FolioDesk" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {WHY.map((item) => (
              <li
                className="card-hover rounded-2xl border border-border bg-white p-6"
                key={item.title}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-soft to-paper-deep text-primary ring-1 ring-border/60">
                  <item.icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.75}
                  />
                </span>
                <h3 className="mt-4 font-serif text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24">
          <SectionHeading title="How it works" />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li className="card-hover rounded-2xl border border-border bg-white p-5" key={step.title}>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-24 surface-raised rounded-[var(--radius-lg)] border border-border bg-white p-6 sm:p-8">
          <SectionHeading
            description="Processing architecture differs by tool. Read the label on each tool page before you upload a file."
            title="Privacy & security"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-success/25 bg-success/[0.04] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-success">
                Local processing
              </p>
              <p className="mt-2 text-sm text-muted">
                Processed in your browser. The KDP Cover Calculator uses this
                model: your trim size and page count never leave this device.
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-info/25 bg-info/[0.04] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-info">
                Server processing
              </p>
              <p className="mt-2 text-sm text-muted">
                Temporarily processed on our processing infrastructure. Future
                conversion tools may use this model; they will say so clearly.
              </p>
            </div>
          </div>
          <Link
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            href="/privacy"
          >
            Learn about our privacy practices
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="mt-24 overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]">
          <div className="grid gap-8 border-b border-border bg-gradient-to-br from-primary-soft/70 via-white to-white p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {CATEGORY_META.kdp.label}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {CATEGORY_META.kdp.headline}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                {CATEGORY_META.kdp.description}
              </p>
              <WorkflowSteps current={0} steps={CATEGORY_META.kdp.workflow} />
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="btn-primary"
                  href="/kdp-cover-calculator"
                >
                  Open cover calculator
                </Link>
                <Link
                  className="btn-secondary"
                  href="/kdp"
                >
                  View all KDP tools
                </Link>
              </div>
            </div>
            <KdpBookVisual />
          </div>
          <div className="grid gap-4 bg-paper p-6 sm:grid-cols-2 lg:grid-cols-3 sm:p-8">
            {cover ? <ToolCard tool={cover} /> : null}
            {cover ? (
              <Link
                className="group card-hover flex h-full flex-col rounded-2xl border border-border bg-white p-5 hover:border-primary/30"
                href="/kdp-cover-calculator"
              >
                <div className="flex items-start justify-between gap-3">
                  <ToolVisual size="sm" tool={cover} />
                </div>
                <h3 className="mt-5 text-sm font-semibold text-text">
                  KDP Cover Template
                </h3>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
                  Download SVG, PDF, or PNG wrap guides from the same calculation.
                </p>
              </Link>
            ) : null}
            {featuredKdp
              .filter((tool) => tool.slug !== "kdp-cover-calculator")
              .map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
          </div>
        </section>

        <section className="mt-24">
          <SectionHeading title="Featured document tools" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredDocs.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-[var(--radius-lg)] border border-border bg-gradient-to-br from-white to-paper-deep/60 p-6 sm:p-8">
          <SectionHeading
            description="There are no verified public reviews yet. If a tool helped—or got in the way—tell us what to change."
            title="User feedback"
          />
          <Link
            className="mt-6 inline-flex btn-primary"
            href="/feedback"
          >
            Send Feedback
          </Link>
        </section>

        <section className="mt-24">
          <SectionHeading
            description="Articles that exist in this project today."
            title="Helpful guides"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {GUIDES.map((guide) => (
              <GuideCard guide={guide} key={guide.slug} />
            ))}
          </div>
        </section>

        <section className="mt-24">
          <SectionHeading title="Frequently asked questions" />
          <div className="mt-10">
            <FaqList items={HOME_FAQ} />
          </div>
        </section>

        <section className="mt-24 rounded-2xl border border-border bg-gradient-to-br from-primary-soft via-white to-primary-soft/60 px-6 py-12 text-center sm:px-10">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Start with the cover calculator
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted">
            It is the live tool today: paperback wrap math, a numbered preview,
            and SVG, PDF, or PNG templates generated in the browser.
          </p>
          <Link
            className="btn-primary mt-6"
            href="/kdp-cover-calculator"
          >
            Open KDP Cover Calculator
          </Link>
        </section>
      </PageShell>
    </>
  );
}

const WHY = [
  {
    icon: Shield,
    title: "Privacy-first",
    body: "Supported tools can process files directly in your browser. The cover calculator already does. Other tools will label local vs server processing.",
  },
  {
    icon: Sparkles,
    title: "Simple",
    body: "Clear interfaces designed for one task at a time, with helper text next to the controls that matter.",
  },
  {
    icon: CheckCircle2,
    title: "Flexible",
    body: "Useful options without unnecessary complexity. Units, paper, and template layers stay available without hiding the result.",
  },
  {
    icon: Workflow,
    title: "Designed for real workflows",
    body: "Search, convert, organize, or calculate a wrap — then move to the next step. Catalog tools stay visible until their engines exist.",
  },
];

const STEPS = [
  {
    title: "Choose a tool",
    body: "Search or open a category. Live tools run now; planned tools explain what they will do.",
  },
  {
    title: "Upload or enter information",
    body: "The cover calculator uses trim size and page count. File tools will ask for a document when they ship.",
  },
  {
    title: "Configure options",
    body: "Set units, paper, layers, or format options. Irrelevant fields stay hidden.",
  },
  {
    title: "Download your result",
    body: "Copy measurements or export a template. Future converters will return a file in the same panel.",
  },
];

function CategoryOverviewCard({ category }: { category: ToolCategory }) {
  const meta = CATEGORY_META[category];
  const active = countActiveTools(category);
  const featured = getToolsByCategory(category).slice(0, 3);
  return (
    <article className="flex flex-col rounded-[var(--radius-md)] border border-border bg-white p-7">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-text">{meta.label}</h3>
        <p className="shrink-0 text-xs text-muted">
          {active} live
        </p>
      </div>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{meta.description}</p>
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {featured.map((tool: ToolDefinition) => (
          <li key={tool.slug}>
            <Link
              className="flex items-center gap-3 py-3.5 text-sm font-medium text-text hover:text-primary"
              href={tool.route}
            >
              <ToolVisual size="sm" tool={tool} />
              {tool.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link className="mt-5 text-sm font-semibold text-primary" href={meta.href}>
        View all
      </Link>
    </article>
  );
}
