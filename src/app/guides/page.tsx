import type { Metadata } from "next";
import { GuideCard } from "@/components/ui/GuideCard";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";
import { GUIDES } from "@/data/guides";

export const metadata: Metadata = legalMetadata(
  "Guides",
  "Publishing and file-prep guides that exist on FolioDesk.",
);

export default function GuidesPage() {
  return (
    <ContentPage title="Guides">
      <div className="grid gap-4 md:grid-cols-2">
        {GUIDES.map((guide) => (
          <GuideCard guide={guide} key={guide.slug} />
        ))}
      </div>
    </ContentPage>
  );
}
