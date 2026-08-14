export type ProcessingStatus =
  | "idle"
  | "validating"
  | "processing"
  | "succeeded"
  | "failed";

export interface FileTypeSupport {
  extensions: string[];
  mimeTypes: string[];
  maxBytes?: number;
}

export interface FileJob {
  id: string;
  originalName: string;
  safeName: string;
  sizeBytes: number;
  mimeType: string;
  status: ProcessingStatus;
}

export interface ResultFile {
  name: string;
  mimeType: string;
  blob?: Blob;
}

export function toSafeFilename(name: string): string {
  return name.replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-");
}
