import { getToolBySlug } from "@/data/tools/registry";
import type { ToolDefinition } from "@/types/tools";

const tool = getToolBySlug("image-converter") as ToolDefinition;

export const IMAGE_CONVERTER_CONTENT = {
  tool,
  eyebrow: "Image Tools",
  heading: "Image Converter",
  lede: "Convert images to JPG, PNG, WebP, or AVIF entirely in your browser. Quality, resizing, and batch conversion included.",
  intro:
    "Upload one or more images and choose an output format. Every conversion happens on your device using the browser's built-in image decoding and encoding — your images are never uploaded to a server.",
  features: [
    {
      title: "Four output formats",
      body: "Convert to JPG, PNG, WebP, or AVIF. Output options that your browser cannot encode are disabled with an explanation instead of a silent fallback.",
    },
    {
      title: "Batch conversion",
      body: "Add multiple images at once. Each file is processed independently, with per-file status, result size, and individual or ZIP download.",
    },
    {
      title: "Quality control",
      body: "For JPG, WebP, and AVIF, set quality from 10 to 100. PNG output stays lossless.",
    },
    {
      title: "Built-in resizing",
      body: "Keep the original size, set exact dimensions, cap width or height, or scale by percentage — while maintaining aspect ratio by default.",
    },
    {
      title: "Honest transparency",
      body: "Transparency is preserved when the output supports it. Converting to JPG flattens transparent areas onto a background color you choose, with a clear warning.",
    },
    {
      title: "Local privacy",
      body: "All decoding and encoding happens in your browser. Nothing is uploaded, so nothing leaves your device.",
    },
  ],
  howItWorks: [
    {
      title: "Add images",
      body: "Drag and drop files or choose them from your device. Multiple files are supported.",
    },
    {
      title: "Set options",
      body: "Pick an output format, quality, and optional resize settings.",
    },
    {
      title: "Convert",
      body: "Each image is decoded, transformed, and re-encoded on your device.",
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
      body: "There is no sign-up and no quota. Convert as many images as you need, then the tool is done.",
    },
  ],
  privacy:
    "This tool processes images entirely in your browser using the browser's image decoder and encoder. Your files are not uploaded to FolioDesk servers, are not stored, and are not used for training. When you leave the page, no copy of your images remains in the app.",
  faqs: [
    {
      question: "Is Image Converter really free and private?",
      answer:
        "Yes. Files are decoded and re-encoded on your device with browser APIs. They are never uploaded to FolioDesk or stored anywhere.",
    },
    {
      question: "Why is AVIF sometimes disabled?",
      answer:
        "AVIF encoding depends on the browser. If your browser cannot encode AVIF, the option is disabled with a note rather than producing a different format.",
    },
    {
      question: "What happens to transparent areas when converting to JPG?",
      answer:
        "JPG cannot store transparency. Transparent pixels are composited onto the background color you choose (white by default), and you are warned before conversion.",
    },
    {
      question: "How does resizing work?",
      answer:
        "You can keep the original dimensions, enter exact width and height, cap the maximum width or height, or scale by a percentage. Aspect ratio is preserved by default so images are never distorted.",
    },
  ],
};
