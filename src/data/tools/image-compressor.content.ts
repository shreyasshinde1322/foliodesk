import { getToolBySlug } from "@/data/tools/registry";
import type { ToolDefinition } from "@/types/tools";

const tool = getToolBySlug("image-compressor") as ToolDefinition;

export const IMAGE_COMPRESSOR_CONTENT = {
  tool,
  eyebrow: "Image Tools",
  heading: "Image Compressor",
  lede: "Shrink image file sizes entirely in your browser. Pick a quality level and download smaller JPG, PNG, WebP, or AVIF files — your images never leave your device.",
  intro:
    "Upload one or more images, choose a quality level, and let the compressor re-encode them on your device. You see the exact size saved per file before you download, and with WebP as the default output most images shrink dramatically.",
  features: [
    {
      title: "One-slider compression",
      body: "A single Quality slider controls the trade-off between file size and visual quality. Drag it down and watch the per-file savings update automatically.",
    },
    {
      title: "WebP by default",
      body: "WebP compresses photos and graphics far better than JPG at equal quality, so it is the default output. JPG and Keep format are available when you need a specific extension.",
    },
    {
      title: "Keep your format",
      body: "Choose 'Keep format' to re-compress JPG, PNG, WebP, and AVIF files in place. HEIC and PSD photos re-encode to WebP, and other inputs (GIF, BMP, ICO, SVG) come out as PNG.",
    },
    {
      title: "Real per-file savings",
      body: "Every finished file shows its compressed size and the percentage saved. A summary bar adds up the total reduction before you download anything.",
    },
    {
      title: "Batch compression",
      body: "Add as many images as you like. Each one is compressed independently, and you can download them one by one or as a single ZIP archive.",
    },
    {
      title: "Honest results",
      body: "If a re-encoded file would end up larger than the original, the tool says so instead of hiding it. PNG recompression is lossless but often minimal — choosing WebP gives the biggest reduction.",
    },
    {
      title: "Local privacy",
      body: "All decoding and encoding happens in your browser. Nothing is uploaded, so nothing leaves your device.",
    },
  ],
  howItWorks: [
    {
      title: "Add images",
      body: "Drag and drop files or choose them from your device. JPG, PNG, WebP, GIF, AVIF, HEIC, HEIF, PSD, BMP, ICO, and SVG are supported.",
    },
    {
      title: "Pick a quality level",
      body: "Move the Quality slider and choose WebP, JPG, or Keep format. Files re-compress automatically whenever you change a setting.",
    },
    {
      title: "Review the savings",
      body: "Each file shows its compressed size and percentage saved, with a running total for the whole batch.",
    },
    {
      title: "Download",
      body: "Save files individually or download everything as a ZIP archive.",
    },
  ],
  why: [
    {
      title: "Nothing is uploaded",
      body: "This tool uses browser-side processing. Your images are never sent to FolioDesk or any other server.",
    },
    {
      title: "No accounts or limits",
      body: "There is no sign-up and no quota. Compress as many images as you need, then the tool is done.",
    },
  ],
  privacy:
    "This tool processes images entirely in your browser. Decoding, re-encoding, and size calculation all run on your device, including HEIC and PSD decoding via WebAssembly. Your files are not uploaded to FolioDesk servers, are not stored, and are not used for training. When you leave the page, no copy of your images remains in the app.",
  faqs: [
    {
      question: "Is Image Compressor really free and private?",
      answer:
        "Yes. Files are decoded and re-encoded on your device with browser APIs. They are never uploaded to FolioDesk or stored anywhere.",
    },
    {
      question: "Which format gives the smallest file?",
      answer:
        "WebP usually gives the best size at the same visual quality, which is why it is the default. Try the Quality slider and compare the percentage saved shown for each file.",
    },
    {
      question: "Does 'Keep format' change my files?",
      answer:
        "It keeps the same extension where possible: JPG, PNG, WebP, and AVIF are re-encoded in place. HEIC and HEIF photos come out as WebP, and other inputs like GIF, BMP, ICO, or SVG come out as PNG.",
    },
    {
      question: "Why does my PNG not get much smaller?",
      answer:
        "PNG is a lossless format, so re-compressing it only saves what the encoder can squeeze out — often little. For big savings on PNG files, switch to WebP instead.",
    },
    {
      question: "What happens if the compressed file is larger than the original?",
      answer:
        "The tool shows the real result and marks it as larger rather than hiding it. Lower the quality or switch to WebP to get a smaller file.",
    },
  ],
};
