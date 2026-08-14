import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "Contact",
  "How to reach FolioDesk.",
);

export default function ContactPage() {
  return (
    <ContentPage title="Contact">
      <p>
        There is no support inbox wired into this build. Use the{" "}
        <Link href="/feedback">feedback form</Link> to draft a message you can
        copy, or open an issue in your own notes for now.
      </p>
      <p>
        For KDP print questions, the official Amazon KDP help pages remain the
        source of record.
      </p>
    </ContentPage>
  );
}
