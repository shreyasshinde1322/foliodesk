import type { Metadata } from "next";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "Acceptable Use",
  "Rules for using FolioDesk.",
);

export default function AcceptableUsePage() {
  return (
    <ContentPage title="Acceptable Use">
      <p>
        Use FolioDesk for lawful file preparation and publishing planning. Do
        not use the site to attack systems, distribute malware, or process
        content you do not have rights to handle.
      </p>
      <p>
        When server-side tools exist, automated abuse, excessive load, and
        attempts to bypass limits will be treated as a violation of these rules.
      </p>
    </ContentPage>
  );
}
