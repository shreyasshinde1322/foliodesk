export const SITE = {
  name: "FolioDesk",
  tagline: "Tools for documents, images, and books",
  description:
    "Free browser tools for converting files, preparing KDP print covers, and organizing documents. Independent and not affiliated with Amazon.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
