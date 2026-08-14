import { KDP_COVER_CALCULATOR_CONTENT } from "@/data/tools/kdp-cover-calculator.content";
import { FormulaSection, HowToSection } from "@/components/kdp/EducationSections";
import { CoverCalculator } from "@/components/kdp/PaperbackCoverCalculator";
import { ToolPageLayout } from "@/components/layout/ToolPageShell";
import { KDP_SOURCES } from "@/data/kdp/specifications";
import { metadataFromSeo } from "@/lib/seo/metadata";
import { SITE } from "@/lib/site";

const content = KDP_COVER_CALCULATOR_CONTENT;
const tool = content.tool;

export const metadata = metadataFromSeo(tool.seo);

export default function KdpCoverCalculatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "KDP Tools",
          item: `${SITE.url}/kdp`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: tool.name,
          item: `${SITE.url}${tool.route}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      applicationCategory: "DesignApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: tool.seo.description,
      url: `${SITE.url}${tool.route}`,
      isAccessibleForFree: true,
      provider: { "@type": "Organization", name: SITE.name },
    },
  ];

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <ToolPageLayout
        badges={["Paperback live", "Hardcover coming soon", "Browser template"]}
        breadcrumbs={[
          { href: "/", label: "Home" },
          { href: "/kdp", label: "KDP & Publishing" },
          { label: tool.name },
        ]}
        extra={
          <>
            <HowToSection />
            <FormulaSection />
            <p className="text-sm text-muted">
              Confirm files with the{" "}
              <a
                className="text-primary underline underline-offset-2"
                href={KDP_SOURCES.coverCalculator}
                rel="noreferrer"
                target="_blank"
              >
                official KDP cover calculator
              </a>{" "}
              before you publish.
            </p>
          </>
        }
        faqs={content.faqs}
        features={content.features}
        formats="Outputs: on-screen dimensions plus SVG, PDF, and PNG wrap templates."
        guideSlugs={["kdp-paperback-cover", "kdp-spine-width"]}
        howItWorks={content.howItWorks}
        lede={content.lede}
        privacy={content.privacy}
        tool={tool}
        why={content.why}
      >
        <CoverCalculator />
      </ToolPageLayout>
    </>
  );
}
