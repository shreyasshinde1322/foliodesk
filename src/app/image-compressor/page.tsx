import { ImageCompressor } from "@/components/image/ImageCompressor";
import { ToolPageLayout } from "@/components/layout/ToolPageShell";
import { IMAGE_COMPRESSOR_CONTENT } from "@/data/tools/image-compressor.content";
import { metadataFromSeo } from "@/lib/seo/metadata";
import { SITE } from "@/lib/site";

const content = IMAGE_COMPRESSOR_CONTENT;
const tool = content.tool;

export const metadata = metadataFromSeo(tool.seo);

export default function ImageCompressorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "Image Tools",
          item: `${SITE.url}/image-tools`,
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
      applicationCategory: "GraphicsApplication",
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
        badges={["Live", "Browser-side", "No uploads"]}
        breadcrumbs={[
          { href: "/", label: "Home" },
          { href: "/image-tools", label: "Images" },
          { label: tool.name },
        ]}
        faqs={content.faqs}
        features={content.features}
        formats="Inputs: JPG, PNG, WebP, GIF, AVIF, HEIC, HEIF, PSD, BMP, ICO, SVG. Outputs: WebP, JPG, or the original format."
        guideSlugs={[]}
        howItWorks={content.howItWorks}
        lede={content.lede}
        privacy={content.privacy}
        tool={tool}
        why={content.why}
      >
        <ImageCompressor />
      </ToolPageLayout>
    </>
  );
}
