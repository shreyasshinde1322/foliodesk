import type { Metadata } from "next";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "Terms of Use",
  "Terms for using FolioDesk tools and catalog pages.",
);

export default function TermsPage() {
  return (
    <ContentPage title="Terms of Use">
      <p>
        By using FolioDesk you agree to these terms. The site is provided as-is
        for planning and file-preparation assistance.
      </p>
      <h2>No Amazon affiliation</h2>
      <p>
        FolioDesk is independent. Amazon, Kindle, and KDP are trademarks of
        their owners. Using this site does not create a relationship with
        Amazon.
      </p>
      <h2>Results</h2>
      <p>
        Calculator output follows published paperback specifications as
        implemented in this project. Print files can still be rejected. You are
        responsible for verifying files in KDP and for any content you create.
      </p>
      <h2>Planned tools</h2>
      <p>
        Catalog entries marked coming soon do not process files. Do not rely on
        them for conversion until they ship.
      </p>
    </ContentPage>
  );
}
