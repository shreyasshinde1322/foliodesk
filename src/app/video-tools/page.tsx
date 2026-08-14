import type { Metadata } from "next";
import { CategoryHub } from "@/components/layout/CategoryHub";

export const metadata: Metadata = {
  title: "Video & Media tools",
  description:
    "Convert, resize and optimize media files. Catalog listings for planned video tools.",
};

export default function VideoToolsPage() {
  return <CategoryHub category="video" />;
}
