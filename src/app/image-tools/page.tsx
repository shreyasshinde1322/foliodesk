import type { Metadata } from "next";
import { CategoryHub } from "@/components/layout/CategoryHub";

export const metadata: Metadata = {
  title: "Image tools",
  description:
    "Compress, resize, convert and optimize images. Catalog listings for planned image tools.",
};

export default function ImageToolsPage() {
  return <CategoryHub category="image" />;
}
