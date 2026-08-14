import type {
  FileFormat,
  IconType,
  ToolAction,
  ToolCategory,
  ToolDefinition,
  ToolGroup,
} from "@/types/tools";

function tool(
  partial: Omit<
    ToolDefinition,
    "seo" | "relatedTools" | "processingType" | "route" | "icon"
  > &
    Partial<Pick<ToolDefinition, "seo" | "relatedTools" | "processingType" | "route" | "icon">>,
): ToolDefinition {
  const route = partial.route ?? `/tools/${partial.slug}`;
  return {
    ...partial,
    icon: partial.icon ?? partial.action,
    processingType:
      partial.processingType ??
      (partial.category === "kdp" || partial.category === "privacy"
        ? "local"
        : "hybrid"),
    relatedTools: partial.relatedTools ?? [],
    route,
    seo: partial.seo ?? {
      title: partial.name,
      description: partial.description,
      canonicalPath: route,
    },
  };
}

function conv(
  slug: string,
  name: string,
  source: FileFormat,
  output: FileFormat,
  group: "convert_to" | "convert_from",
  description: string,
  extra?: Partial<ToolDefinition>,
) {
  return tool({
    slug,
    name,
    category: "pdf",
    group,
    action: "convert",
    iconType: "conversion",
    sourceFormat: source,
    outputFormat: output,
    status: "planned",
    description,
    ...extra,
  });
}

function act(
  slug: string,
  name: string,
  category: ToolCategory,
  group: ToolGroup,
  action: ToolAction,
  iconType: IconType,
  description: string,
  extra?: Partial<ToolDefinition>,
) {
  return tool({
    slug,
    name,
    category,
    group,
    action,
    iconType,
    status: "planned",
    description,
    ...extra,
  });
}

export const TOOLS: ToolDefinition[] = [
  tool({
    slug: "kdp-cover-calculator",
    name: "KDP Cover Calculator",
    category: "kdp",
    group: "prepare",
    action: "calculate",
    iconType: "publishing",
    sourceFormat: "book",
    featured: true,
    popular: true,
    status: "active",
    processingType: "local",
    route: "/kdp-cover-calculator",
    relatedTools: ["kdp-interior-formatter", "kdp-cover-validator", "kdp-preflight"],
    description:
      "Calculate cover, spine and template dimensions for your selected KDP format.",
    seo: {
      title:
        "KDP Paperback Cover Calculator – Free Cover Size & Spine Calculator",
      description:
        "Calculate KDP paperback cover dimensions, spine width, bleed and full cover size. Generate a downloadable cover template using your trim size and page count.",
      canonicalPath: "/kdp-cover-calculator",
    },
  }),
  conv("jpg-to-pdf", "JPG to PDF", "jpg", "pdf", "convert_to", "Combine JPG images into a single PDF.", { popular: true }),
  conv("word-to-pdf", "Word to PDF", "word", "pdf", "convert_to", "Turn Word documents into PDF files."),
  conv("powerpoint-to-pdf", "PowerPoint to PDF", "powerpoint", "pdf", "convert_to", "Save presentations as PDF files."),
  conv("excel-to-pdf", "Excel to PDF", "excel", "pdf", "convert_to", "Save spreadsheets as PDF files."),
  conv("html-to-pdf", "HTML to PDF", "html", "pdf", "convert_to", "Capture HTML as a PDF document."),
  conv("pdf-to-jpg", "PDF to JPG", "pdf", "jpg", "convert_from", "Export PDF pages as JPG images."),
  conv("pdf-to-word", "PDF to Word", "pdf", "word", "convert_from", "Convert compatible PDF documents into editable Word files.", { popular: true }),
  conv("pdf-to-powerpoint", "PDF to PowerPoint", "pdf", "powerpoint", "convert_from", "Turn PDF pages into a presentation."),
  conv("pdf-to-excel", "PDF to Excel", "pdf", "excel", "convert_from", "Extract tabular PDF content into a spreadsheet."),
  conv("pdf-to-pdfa", "PDF to PDF/A", "pdf", "pdfa", "convert_from", "Create an archival PDF/A file."),
  act("pdf-converter", "PDF Converter", "pdf", "convert_from", "convert", "conversion", "Convert PDF files to and from other formats.", { sourceFormat: "pdf" }),
  act("merge-pdf", "Merge PDF", "pdf", "organize", "merge", "document-action", "Combine multiple PDFs into one file.", { sourceFormat: "pdf" }),
  act("split-pdf", "Split PDF", "pdf", "organize", "split", "document-action", "Split a PDF into separate files.", { sourceFormat: "pdf" }),
  act("organize-pdf", "Organize PDF", "pdf", "organize", "organize", "document-action", "Reorder, rotate, or delete PDF pages.", { sourceFormat: "pdf" }),
  act("rotate-pdf", "Rotate PDF", "pdf", "organize", "rotate", "document-action", "Rotate selected PDF pages.", { sourceFormat: "pdf" }),
  act("extract-pages", "Extract Pages", "pdf", "organize", "extract", "document-action", "Save selected pages as a new PDF.", { sourceFormat: "pdf" }),
  act("delete-pages", "Delete Pages", "pdf", "organize", "delete", "document-action", "Remove pages from a PDF.", { sourceFormat: "pdf" }),
  act("pdf-editor", "Edit PDF", "pdf", "edit", "edit", "document-action", "Edit PDF content in the browser.", { sourceFormat: "pdf" }),
  act("sign-pdf", "Sign PDF", "pdf", "edit", "sign", "document-action", "Add a signature to a PDF.", { sourceFormat: "pdf" }),
  act("watermark-pdf", "Watermark PDF", "pdf", "edit", "watermark", "document-action", "Place a text or image watermark on PDF pages.", { sourceFormat: "pdf" }),
  act("redact-pdf", "Redact PDF", "pdf", "edit", "redact", "document-action", "Permanently remove sensitive PDF content.", { sourceFormat: "pdf" }),
  act("protect-pdf", "Protect PDF", "pdf", "edit", "protect", "document-action", "Password-protect a PDF.", { sourceFormat: "pdf" }),
  act("compress-pdf", "Compress PDF", "pdf", "optimize", "compress", "document-action", "Reduce file size while preserving practical quality.", { sourceFormat: "pdf", featured: true, popular: true }),
  act("pdf-ocr", "OCR PDF", "pdf", "optimize", "ocr", "document-action", "Recognize text in scanned PDFs.", { sourceFormat: "pdf" }),
  act("pdf-preflight", "PDF Preflight", "pdf", "optimize", "preflight", "document-action", "Check a PDF against print requirements.", { sourceFormat: "pdf" }),
  act("image-converter", "Image Converter", "image", "convert", "convert", "conversion", "Convert images between common formats.", { sourceFormat: "jpg", outputFormat: "webp", popular: true }),
  act("image-compressor", "Image Compressor", "image", "optimize", "compress", "image-action", "Reduce image file size for the web or email.", { sourceFormat: "image", popular: true }),
  act("image-resizer", "Image Resizer", "image", "optimize", "resize", "image-action", "Resize images to target dimensions.", { sourceFormat: "image" }),
  act("image-editor", "Image Editor", "image", "edit", "edit", "image-action", "Crop, adjust, and annotate images.", { sourceFormat: "image" }),
  act("background-remover", "Background Remover", "image", "edit", "remove-bg", "image-action", "Remove image backgrounds.", { sourceFormat: "image" }),
  act("image-upscaler", "Image Upscaler", "image", "optimize", "upscale", "image-action", "Increase image resolution.", { sourceFormat: "image" }),
  act("metadata-cleaner", "Metadata Cleaner", "image", "privacy", "clean-metadata", "image-action", "Strip hidden image metadata.", { sourceFormat: "image" }),
  act("kdp-interior-formatter", "KDP Interior Formatter", "kdp", "prepare", "format", "publishing", "Prepare a print interior from KDP trim and margin rules.", { sourceFormat: "book", relatedTools: ["kdp-cover-calculator"] }),
  act("kdp-cover-validator", "KDP Cover Validator", "kdp", "prepare", "validate", "publishing", "Check a cover file against calculated wrap dimensions.", { sourceFormat: "book", relatedTools: ["kdp-cover-calculator"] }),
  act("kdp-preflight", "KDP Preflight", "kdp", "prepare", "preflight", "publishing", "Check print files before KDP upload.", { sourceFormat: "book" }),
  act("kdp-print-previewer", "KDP Print Previewer", "kdp", "prepare", "preview", "publishing", "Preview a print wrap and interior.", { sourceFormat: "book" }),
  act("ebook-formatter", "eBook Formatter", "kdp", "ebook", "format", "publishing", "Prepare an eBook manuscript.", { sourceFormat: "epub" }),
  act("epub-validator", "EPUB Validator", "kdp", "ebook", "validate", "publishing", "Validate an EPUB file.", { sourceFormat: "epub" }),
  act("ebook-previewer", "eBook Previewer", "kdp", "ebook", "preview", "publishing", "Preview an eBook layout.", { sourceFormat: "epub" }),
  act("id-masker", "ID Masker", "privacy", "privacy", "mask", "privacy", "Mask identity documents for sharing.", { sourceFormat: "id" }),
  act("permanent-redactor", "Permanent Redactor", "privacy", "privacy", "redact", "privacy", "Permanently redact sensitive content.", { sourceFormat: "pdf" }),
  act("custom-watermark", "Custom Watermark", "privacy", "privacy", "watermark", "privacy", "Apply a custom watermark.", { sourceFormat: "pdf" }),
  act("media-converter", "Media Converter", "video", "media", "convert", "conversion", "Convert video and audio formats.", { sourceFormat: "video", outputFormat: "gif" }),
  act("video-compressor", "Video Compressor", "video", "media", "compress", "media", "Reduce video file size.", { sourceFormat: "video" }),
  act("video-resizer", "Video Resizer", "video", "media", "resize", "media", "Resize video dimensions.", { sourceFormat: "video" }),
  act("video-trimmer", "Video Trimmer", "video", "media", "trim", "media", "Trim a video clip.", { sourceFormat: "video" }),
  act("video-to-gif", "Video to GIF", "video", "media", "convert", "conversion", "Convert a video clip to GIF.", { sourceFormat: "video", outputFormat: "gif" }),
];

export const CATEGORY_META: Record<
  ToolCategory,
  {
    label: string;
    href: string;
    headline: string;
    description: string;
    workflow: string[];
    groups: Array<{ id: ToolGroup; label: string }>;
  }
> = {
  pdf: {
    label: "PDF & Documents",
    href: "/pdf-tools",
    headline: "Work with PDFs without leaving the catalog",
    description: "Convert, organize, edit and protect documents.",
    workflow: ["Convert", "Organize", "Edit", "Protect", "Export"],
    groups: [
      { id: "convert_to", label: "Convert to PDF" },
      { id: "convert_from", label: "Convert from PDF" },
      { id: "organize", label: "Organize" },
      { id: "edit", label: "Edit & Security" },
      { id: "optimize", label: "Optimize" },
    ],
  },
  image: {
    label: "Images",
    href: "/image-tools",
    headline: "Resize, convert, and clean images in one place",
    description: "Compress, resize, convert and optimize images.",
    workflow: ["Upload", "Convert", "Optimize", "Edit", "Download"],
    groups: [
      { id: "convert", label: "Convert" },
      { id: "optimize", label: "Optimize" },
      { id: "edit", label: "Edit" },
      { id: "privacy", label: "Privacy" },
    ],
  },
  kdp: {
    label: "KDP & Publishing",
    href: "/kdp",
    headline: "Prepare your book for KDP",
    description:
      "Calculate wrap size, then design, format, check, and export. Hardcover remains an option in the same calculator when those specs ship.",
    workflow: ["Calculate", "Design", "Format", "Check", "Export"],
    groups: [
      { id: "prepare", label: "Print preparation" },
      { id: "ebook", label: "eBooks" },
    ],
  },
  privacy: {
    label: "Privacy & Security",
    href: "/privacy-tools",
    headline: "Redact and clean files before you share them",
    description: "Redact and clean sensitive documents and media.",
    workflow: ["Upload", "Redact", "Review", "Clean", "Download"],
    groups: [{ id: "privacy", label: "Privacy tools" }],
  },
  video: {
    label: "Video & Media",
    href: "/video-tools",
    headline: "Convert and optimize media for the format you need",
    description: "Convert, resize and optimize media files.",
    workflow: ["Upload", "Convert", "Resize", "Optimize", "Download"],
    groups: [{ id: "media", label: "Media tools" }],
  },
};

export const CATEGORY_NAV: Array<{
  href: string;
  label: string;
  shortLabel: string;
  category: ToolCategory;
}> = [
  { href: "/pdf-tools", label: "PDF & Documents", shortLabel: "PDF", category: "pdf" },
  { href: "/image-tools", label: "Images", shortLabel: "Images", category: "image" },
  { href: "/kdp", label: "KDP & Publishing", shortLabel: "KDP", category: "kdp" },
  { href: "/privacy-tools", label: "Privacy & Security", shortLabel: "Privacy", category: "privacy" },
  { href: "/video-tools", label: "Video & Media", shortLabel: "Video", category: "video" },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((item) => item.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS.filter((item) => item.category === category);
}

export function getActiveTools(): ToolDefinition[] {
  return TOOLS.filter((item) => item.status === "active");
}

export function getPopularTools(): ToolDefinition[] {
  return TOOLS.filter((item) => item.popular);
}

export function searchTools(query: string): ToolDefinition[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return TOOLS.filter((item) => {
    const haystack = [
      item.name,
      item.description,
      item.slug.replaceAll("-", " "),
      item.category,
      CATEGORY_META[item.category].label,
      item.group,
      item.action,
      item.sourceFormat,
      item.outputFormat,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function getToolsBySlugs(slugs: string[]): ToolDefinition[] {
  return slugs
    .map((slug) => getToolBySlug(slug))
    .filter((item): item is ToolDefinition => Boolean(item));
}

export function countActiveTools(category: ToolCategory): number {
  return TOOLS.filter(
    (item) => item.category === category && item.status === "active",
  ).length;
}

export function getGroupedTools(category: ToolCategory) {
  return CATEGORY_META[category].groups
    .map((group) => ({
      ...group,
      tools: TOOLS.filter(
        (item) => item.category === category && item.group === group.id,
      ),
    }))
    .filter((group) => group.tools.length > 0);
}

export const QUICK_SEARCH_SLUGS = [
  "pdf-to-word",
  "compress-pdf",
  "jpg-to-pdf",
  "kdp-cover-calculator",
  "image-compressor",
] as const;

export const FEATURED_DOCUMENT_SLUGS = [
  "pdf-to-word",
  "compress-pdf",
  "jpg-to-pdf",
  "merge-pdf",
] as const;

export const FEATURED_KDP_SLUGS = [
  "kdp-cover-calculator",
  "kdp-interior-formatter",
  "kdp-preflight",
  "kdp-print-previewer",
  "ebook-formatter",
] as const;
