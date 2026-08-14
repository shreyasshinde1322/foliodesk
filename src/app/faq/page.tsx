import type { Metadata } from "next";
import { FaqList } from "@/components/ui/FaqList";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";
import { HOME_FAQ } from "@/data/faq";

export const metadata: Metadata = legalMetadata(
  "FAQ",
  "Answers about FolioDesk, local processing, and the KDP cover calculator.",
);

export default function FaqPage() {
  return (
    <ContentPage title="FAQ">
      <FaqList items={HOME_FAQ} />
    </ContentPage>
  );
}
