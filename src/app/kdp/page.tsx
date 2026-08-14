import type { Metadata } from "next";
import { CategoryHub } from "@/components/layout/CategoryHub";

export const metadata: Metadata = {
  title: "KDP & Publishing tools",
  description:
    "Independent KDP publishing tools. The cover calculator is available now.",
};

export default function KdpToolsPage() {
  return <CategoryHub category="kdp" />;
}
