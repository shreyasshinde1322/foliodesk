import { getToolBySlug } from "@/data/tools/registry";
import type { ToolDefinition } from "@/types/tools";

const tool = getToolBySlug("image-resizer") as ToolDefinition;

export const IMAGE_RESIZER_CONTENT = {
  tool,
  eyebrow: "Image Tools",
  heading: "Image Resizer",
  lede: "Resize images to exact dimensions, scale by percentage, or fit into a target box — all in your browser. No uploads, no quality loss from server re-compression.",
  intro:
    "Upload one or more images, choose a resize mode, and let the tool scale them on your device using high-quality WASM-powered algorithms. Compare the original and resized result side by side before downloading.",
  features: [
    {
      title: "Five resize modes",
      body: "Exact dimensions, percentage scale, maximum dimensions, fit to box, or a custom canvas. Aspect ratio is locked by default to prevent distortion.",
    },
    {
      title: "High-quality algorithms",
      body: "Choose from Lanczos3, Catmull-Rom, Mitchell, Triangle, HQX, and Magic Kernel algorithms — powered by WebAssembly for speed and quality.",
    },
    {
      title: "Smart presets",
      body: "Quick presets for Web, Social, Email, and Thumbnail resize tasks. Select a preset and adjust from there.",
    },
    {
      title: "Batch resize",
      body: "Resize multiple images at once with shared settings. Each file shows its status, dimensions, and result size.",
    },
    {
      title: "Before and after comparison",
      body: "A draggable slider lets you compare the original and resized image at up to 400% zoom to inspect quality.",
    },
    {
      title: "Output format control",
      body: "Keep the original format or convert to JPG, PNG, or WebP during resize. Quality is adjustable for lossy formats.",
    },
    {
      title: "Local privacy",
      body: "All decoding, resizing, and encoding happens in your browser. Nothing is uploaded to any server.",
    },
  ],
  howItWorks: [
    {
      title: "Upload images",
      body: "Drag and drop JPG, PNG, WebP, GIF, BMP, or AVIF files. Multiple files are supported.",
    },
    {
      title: "Choose resize settings",
      body: "Pick a mode (exact, percentage, max, or fit to box), set dimensions, and choose an algorithm and output format.",
    },
    {
      title: "Preview and compare",
      body: "Use the before/after slider to check the resized result at full quality before downloading.",
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
      body: "There is no sign-up and no quota. Resize as many images as you need, then the tool is done.",
    },
  ],
  privacy:
    "This tool processes images entirely in your browser. Decoding, resizing via WASM algorithms, and encoding all run on your device. Your files are not uploaded to FolioDesk servers, are not stored, and are not used for training. When you leave the page, no copy of your images remains in the app.",
  faqs: [
    {
      question: "Is Image Resizer really free and private?",
      answer:
        "Yes. Files are decoded, resized, and re-encoded on your device with browser APIs and WebAssembly. They are never uploaded to FolioDesk or stored anywhere.",
    },
    {
      question: "What resize algorithms are available?",
      answer:
        "Lanczos3 (high quality, default), Mitchell (balanced), Catmull-Rom, Triangle (fast), HQX (pixel art), and Magic Kernel variants. Lanczos3 is recommended for most photo resizing.",
    },
    {
      question: "Will resizing reduce image quality?",
      answer:
        "Downscaling with a high-quality algorithm like Lanczos3 preserves visual quality very well. Upscaling cannot add detail that isn't in the original and may reduce apparent sharpness.",
    },
    {
      question: "Can I resize multiple images at once?",
      answer:
        "Yes. Upload multiple files and all will be resized with the same settings. You can download individually or get a ZIP with all results.",
    },
    {
      question: "What is the maximum file size?",
      answer:
        "Each file can be up to 25 MB. Very large images (e.g. 12000×8000) may use significant browser memory — the tool warns you if processing might be unsafe.",
    },
    {
      question: "Does the tool preserve image transparency?",
      answer:
        "Yes. PNG and WebP output preserve transparency. If you choose JPG output, transparent areas are flattened onto the background color you select.",
    },
  ],
};
