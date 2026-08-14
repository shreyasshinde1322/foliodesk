export type ProcessingType = "local" | "server" | "hybrid";

export type ToolStatus = "active" | "planned" | "coming_soon";

export type ToolCategory = "pdf" | "image" | "kdp" | "privacy" | "video";

export type ToolGroup =
  | "convert"
  | "convert_to"
  | "convert_from"
  | "organize"
  | "edit"
  | "optimize"
  | "prepare"
  | "ebook"
  | "privacy"
  | "media";

export type FileFormat =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "jpg"
  | "png"
  | "webp"
  | "gif"
  | "html"
  | "pdfa"
  | "epub"
  | "video"
  | "image"
  | "book"
  | "id"
  | "audio";

export type ToolAction =
  | "convert"
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "extract"
  | "delete"
  | "organize"
  | "edit"
  | "sign"
  | "protect"
  | "redact"
  | "watermark"
  | "ocr"
  | "preflight"
  | "calculate"
  | "format"
  | "validate"
  | "preview"
  | "resize"
  | "remove-bg"
  | "upscale"
  | "clean-metadata"
  | "mask"
  | "trim";

export type IconType =
  | "conversion"
  | "document-action"
  | "image-action"
  | "publishing"
  | "privacy"
  | "media";

export type VisualVariant = "default" | "stack" | "pair";

export interface ProcessingCapability {
  type: ProcessingType;
  description: string;
  lazyEngine?: string;
}

export interface ToolSeo {
  title: string;
  description: string;
  canonicalPath: string;
}

export interface ToolDefinition {
  slug: string;
  name: string;
  category: ToolCategory;
  group: ToolGroup;
  description: string;
  icon: string;
  route: string;
  processingType: ProcessingType;
  status: ToolStatus;
  relatedTools: string[];
  seo: ToolSeo;
  action: ToolAction;
  iconType: IconType;
  sourceFormat?: FileFormat;
  outputFormat?: FileFormat;
  visualVariant?: VisualVariant;
  featured?: boolean;
  popular?: boolean;
}
