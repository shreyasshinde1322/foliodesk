import { getToolBySlug } from "@/data/tools/registry";
import type { ToolDefinition } from "@/types/tools";

const tool = getToolBySlug("image-compressor") as ToolDefinition;

export const IMAGE_COMPRESSOR_CONTENT = {
  tool,
  eyebrow: "Image Tools",
  heading: "Image Compressor",
  lede: "Shrink JPG, WebP, and GIF file sizes entirely in your browser. Pick a compression mode — or a target file size — and download smaller files. Your images never leave your device.",
  intro:
    "Upload one or more JPG, WebP, or GIF images, choose a compression mode, and let the compressor re-encode them on your device. Compare the original and result side by side, inspect each file, and download exactly what you need. With modes from Best Quality to a specific Target Size, most images shrink dramatically — and nothing is ever uploaded.",
  features: [
    {
      title: "Compression modes",
      body: "Best Quality, Recommended, Maximum, or Target Size. Each mode sets the quality strategy for you — or set a custom quality slider when you want precise control.",
    },
    {
      title: "Target file size",
      body: "Pick a target like 100 KB or 1 MB per file and the tool searches quality and dimensions locally until each image fits, or tells you honestly when it cannot.",
    },
    {
      title: "Auto format",
      body: "Compare WebP, AVIF, and JPG per file and keep the smallest result. JPG is automatically excluded when a file has transparency.",
    },
    {
      title: "Compare before and after",
      body: "A draggable comparison slider shows the original next to the compressed result, with 100–400% pixel zoom to inspect quality up close.",
    },
    {
      title: "Never output larger files",
      body: "A file whose compressed result would be bigger is marked, kept out of the ZIP, and can still be downloaded as the original or compressed stronger.",
    },
    {
      title: "Inspect and verify",
      body: "Every file gets an image inspector (format, dimensions, aspect ratio, transparency, orientation, metadata) and a result report with the exact size saved.",
    },
    {
      title: "Duplicate detection",
      body: "Identical files are detected locally by content hash, so you can keep one of each instead of compressing the same image twice.",
    },
    {
      title: "Local privacy",
      body: "All decoding and encoding happens in your browser. Nothing is uploaded, so nothing leaves your device — metadata (EXIF, GPS) is removed during processing.",
    },
  ],
  howItWorks: [
    {
      title: "Add images",
      body: "Drag and drop JPG, WebP, GIF, AVIF, HEIC, HEIF, PSD, BMP, ICO, or SVG files. PNG files are detected and routed to the Image Converter instead.",
    },
    {
      title: "Choose a mode",
      body: "Pick Best, Recommended, Maximum, or a Target Size, and set the format, dimensions, and other options. Files re-compress automatically whenever you change a setting.",
    },
    {
      title: "Compare and inspect",
      body: "Drag the comparison slider and zoom to check quality. The inspector shows source details and each result reports its exact savings.",
    },
    {
      title: "Download",
      body: "Save files individually or download everything as a ZIP archive. Files that would come out larger are skipped and excluded from the ZIP.",
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
    "This tool processes images entirely in your browser. Decoding, re-encoding, target-size searching, and duplicate detection all run on your device, including HEIC and PSD decoding via WebAssembly. Your files are not uploaded to FolioDesk servers, are not stored, and are not used for training. Settings are saved in your browser's local storage so your preferences are remembered between visits. When you leave the page, no copy of your images remains in the app.",
  faqs: [
    {
      question: "Is Image Compressor really free and private?",
      answer:
        "Yes. Files are decoded and re-encoded on your device with browser APIs. They are never uploaded to FolioDesk or stored anywhere.",
    },
    {
      question: "How does Target Size mode work?",
      answer:
        "Choose a target like 100 KB or 1 MB. The tool compresses locally, tuning quality — and smaller dimensions if you allow them — until each file fits the target. If a file cannot reach it without heavy loss, the smallest achievable result is used and marked.",
    },
    {
      question: "Which format gives the smallest file?",
      answer:
        "WebP usually gives the best size at the same visual quality, which is why it is the default. Turn on Auto format to have the tool compare WebP, AVIF, and JPG per file and keep the smallest.",
    },
    {
      question: "Does 'Keep format' change my files?",
      answer:
        "It keeps the same extension where possible: JPG, WebP, AVIF, and GIF are re-encoded in place. HEIC and HEIF photos come out as WebP, and other inputs like BMP, ICO, or SVG come out as WebP.",
    },
    {
      question: "What happens if the compressed file is larger than the original?",
      answer:
        "With 'Never output larger files' on, the file is skipped and excluded from the ZIP. You can download the original instead or compress it stronger. Turn the option off to keep larger results and compare them yourself.",
    },
    {
      question: "What about PNG compression?",
      answer:
        "PNG compression is not yet supported in this tool. For PNG conversions (JPG → PNG, PNG → JPG, PNG → WebP), use the Image Converter instead.",
    },
  ],
};
