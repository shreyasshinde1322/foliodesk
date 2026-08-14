import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "Help",
  "Help for FolioDesk tools.",
);

export default function HelpPage() {
  return (
    <ContentPage title="Help">
      <p>
        Start with search in the header, or open{" "}
        <Link href="/kdp-cover-calculator">KDP Cover Calculator</Link>. Category
        pages list live and planned tools.
      </p>
      <h2>Cover calculator</h2>
      <p>
        Choose paperback, interior, paper, trim, and page count. Fix any field
        errors, then copy dimensions or download a template. Confirm the same
        configuration in KDP.
      </p>
      <p>
        More detail: <Link href="/guides">Guides</Link> and{" "}
        <Link href="/faq">FAQ</Link>.
      </p>
    </ContentPage>
  );
}
