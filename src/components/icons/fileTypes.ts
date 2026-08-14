import type { FileFormat } from "@/types/tools";

export const FILE_TYPE_META: Record<
  FileFormat,
  { fill: string; label: string }
> = {
  pdf: { fill: "#E24B4A", label: "PDF" },
  word: { fill: "#2F6FED", label: "DOC" },
  excel: { fill: "#1B8A54", label: "XLS" },
  powerpoint: { fill: "#D24726", label: "PPT" },
  jpg: { fill: "#D39A12", label: "JPG" },
  png: { fill: "#1A8A9A", label: "PNG" },
  webp: { fill: "#0E8A78", label: "WEB" },
  gif: { fill: "#6A4DB8", label: "GIF" },
  avif: { fill: "#0E7490", label: "AVIF" },
  html: { fill: "#E25A12", label: "HTM" },
  pdfa: { fill: "#B83B34", label: "A" },
  epub: { fill: "#4F46B8", label: "EPB" },
  video: { fill: "#44516B", label: "VID" },
  image: { fill: "#D39A12", label: "IMG" },
  book: { fill: "#4A5568", label: "KDP" },
  id: { fill: "#3D4F5F", label: "ID" },
  audio: { fill: "#5B4B8C", label: "AUD" },
};

export const FORMAT_SHORT: Partial<Record<FileFormat, string>> = {
  word: "DOCX",
  excel: "XLSX",
  powerpoint: "PPTX",
  pdf: "PDF",
  jpg: "JPG",
  png: "PNG",
  webp: "WebP",
  gif: "GIF",
  avif: "AVIF",
  html: "HTML",
  pdfa: "PDF/A",
  epub: "EPUB",
};

export type IconSize = "sm" | "md" | "lg" | "xl";

export const ICON_PX: Record<IconSize, number> = {
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
};
