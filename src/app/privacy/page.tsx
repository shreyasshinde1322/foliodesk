import type { Metadata } from "next";
import { ContentPage, legalMetadata } from "@/components/layout/ContentPage";

export const metadata: Metadata = legalMetadata(
  "Privacy Policy",
  "How FolioDesk handles information. Processing differs by tool.",
);

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy">
      <p>
        FolioDesk is a catalog of file and publishing utilities. This policy
        describes the current website, not hypothetical future products.
      </p>
      <h2>Processing models</h2>
      <p>
        Tools are labeled Local processing or Server processing. Local tools,
        including the KDP Cover Calculator, run in your browser and do not
        upload your inputs to FolioDesk. Server processing is not used by any
        live tool in this version.
      </p>
      <h2>What we collect on the site</h2>
      <p>
        This static site does not operate an account system or a feedback
        database. If you email us, we receive whatever you send in that
        message.
      </p>
      <h2>Cookies</h2>
      <p>
        See the Cookie Policy. This version does not set advertising cookies.
      </p>
      <h2>Changes</h2>
      <p>
        When a tool starts using server processing, its page and this policy
        will say so before that tool goes live.
      </p>
    </ContentPage>
  );
}
