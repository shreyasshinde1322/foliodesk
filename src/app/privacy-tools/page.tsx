import type { Metadata } from "next";
import { CategoryHub } from "@/components/layout/CategoryHub";

export const metadata: Metadata = {
  title: "Privacy & Security tools",
  description:
    "Redact and clean sensitive documents and media. Catalog listings for planned privacy tools.",
};

export default function PrivacyToolsPage() {
  return <CategoryHub category="privacy" />;
}
