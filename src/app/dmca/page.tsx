import type { Metadata } from "next";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "DMCA",
  "Copyright notice procedure for FolioDesk.",
);

export default function DmcaPage() {
  return (
    <ContentPage title="DMCA">
      <p>
        FolioDesk currently hosts software and documentation, not a user-upload
        library. If you believe material on this site infringes copyright, send
        a notice through the Contact page with:
      </p>
      <p>
        your contact details, a description of the work, the URL of the
        material, a statement of good-faith belief, and a statement that the
        information is accurate under penalty of perjury.
      </p>
    </ContentPage>
  );
}
