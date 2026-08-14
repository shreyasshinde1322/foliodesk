import type { Metadata } from "next";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "Disclaimer",
  "FolioDesk disclaimers for KDP calculations and planned tools.",
);

export default function DisclaimerPage() {
  return (
    <ContentPage title="Disclaimer">
      <p>
        FolioDesk does not guarantee that Amazon KDP, a printer, or any other
        service will accept files prepared with these tools. Specifications
        change. Always confirm with the official publisher tools and a printed
        proof.
      </p>
      <p>
        Planned tools are listed for navigation only. They do not convert,
        compress, or redact files yet.
      </p>
    </ContentPage>
  );
}
