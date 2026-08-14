import type { Metadata } from "next";
import { CategoryHub } from "@/components/layout/CategoryHub";

export const metadata: Metadata = {
  title: "PDF & Document tools",
  description:
    "Convert, organize, edit and protect documents. Catalog listings for planned PDF tools.",
};

export default function PdfToolsPage() {
  return <CategoryHub category="pdf" />;
}
