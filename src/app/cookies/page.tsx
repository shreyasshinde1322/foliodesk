import type { Metadata } from "next";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "Cookie Policy",
  "How FolioDesk uses cookies in the current website.",
);

export default function CookiesPage() {
  return (
    <ContentPage title="Cookie Policy">
      <p>
        This version of FolioDesk does not set advertising or analytics cookies.
        Your browser may still store technical data required to load the site.
      </p>
      <p>
        If advertising is added later, placeholders labeled Advertisement will
        be replaced only after a cookie notice is updated.
      </p>
    </ContentPage>
  );
}
