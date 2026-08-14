import type { Metadata } from "next";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "About FolioDesk",
  "FolioDesk is an independent toolkit for documents, images, and books. Not affiliated with Amazon.",
);

export default function AboutPage() {
  return (
    <ContentPage title="About FolioDesk">
      <p>
        FolioDesk is an independent catalog of file and publishing utilities.
        The first live tool is a paperback cover calculator that uses Amazon
        KDP&apos;s published paperback cover formulas in the browser. It does
        not upload your files, create an account, or submit anything to KDP.
      </p>
      <p>
        Other tools appear in navigation so the product areas are clear. They
        are not processing engines yet.
      </p>
      <p>
        This project is not affiliated with or endorsed by Amazon.
        Specifications can change; always verify the final cover in KDP.
      </p>
    </ContentPage>
  );
}
