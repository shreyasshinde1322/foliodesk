import type { ReactNode } from "react";
import type { FileFormat, ToolAction, ToolDefinition } from "@/types/tools";
import { FileTypeIcon } from "./FileTypeIcon";
import { FORMAT_SHORT, ICON_PX, type IconSize } from "./fileTypes";

export function ConversionArrow({ size = "md" }: { size?: IconSize }) {
  const px = Math.round(ICON_PX[size] * 0.55);
  return (
    <svg
      aria-hidden="true"
      className="tv-arrow shrink-0 text-muted"
      height={px}
      viewBox="0 0 24 24"
      width={px}
    >
      <path
        d="M4 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function ToolVisual({
  tool,
  size = "md",
  className = "",
}: {
  tool: ToolDefinition;
  size?: IconSize;
  className?: string;
}) {
  const source = tool.sourceFormat ?? inferFormat(tool.category);
  const dest = tool.outputFormat;
  const label = accessibleLabel(tool);

  return (
    <span
      aria-label={label}
      className={`tool-visual tv-${tool.action} inline-flex items-center justify-center ${className}`}
      data-action={tool.action}
      role="img"
    >
      {tool.iconType === "conversion" && dest && dest !== source ? (
        <ConversionPair dest={dest} size={size} source={source} />
      ) : (
        <ActionMark action={tool.action} format={source} size={size} />
      )}
    </span>
  );
}

export function ToolIcon({
  tool,
  size = "md",
  className = "",
}: {
  tool: ToolDefinition;
  size?: IconSize;
  className?: string;
}) {
  return <ToolVisual className={className} size={size} tool={tool} />;
}

export function IconWell({
  size = "md",
  children,
}: {
  tool?: ToolDefinition;
  size?: IconSize;
  children: ReactNode;
}) {
  const box = size === "sm" ? 32 : size === "md" ? 40 : 44;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-visible rounded-lg bg-gradient-to-br from-primary-soft to-paper-deep ring-1 ring-border/60"
      style={{ width: box, height: box }}
    >
      {children}
    </span>
  );
}

function ConversionPair({
  source,
  dest,
  size,
}: {
  source: FileFormat;
  dest: FileFormat;
  size: IconSize;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="tv-source">
        <FileTypeIcon size={size} type={source} />
      </span>
      <ConversionArrow size={size} />
      <span className="tv-dest">
        <FileTypeIcon size={size} type={dest} />
      </span>
    </span>
  );
}

function ActionMark({
  action,
  format,
  size,
}: {
  action: ToolAction;
  format: FileFormat;
  size: IconSize;
}) {
  const px = ICON_PX[size];
  return (
    <span className="relative inline-flex" style={{ width: px, height: px }}>
      <FileTypeIcon size={size} type={format} />
      <Overlay action={action} size={size} />
    </span>
  );
}

function Overlay({ action, size }: { action: ToolAction; size: IconSize }) {
  const mark = MARK[action];
  if (!mark) return null;
  const px = Math.max(12, Math.round(ICON_PX[size] * 0.55));
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-white text-text shadow-[var(--shadow-card)] ring-1 ring-border"
      style={{ width: px, height: px }}
    >
      {mark}
    </span>
  );
}

const MARK: Partial<Record<ToolAction, ReactNode>> = {
  compress: <InArrows />,
  rotate: <RotateMark />,
  edit: <PencilMark />,
  sign: <SignMark />,
  protect: <LockMark />,
  redact: <RedactMark />,
  watermark: <StampMark />,
  ocr: <ScanMark />,
  preflight: <CheckMark />,
  calculate: <RulerMark />,
  format: <TypeMark />,
  validate: <CheckMark />,
  preview: <EyeMark />,
  resize: <ResizeMark />,
  "remove-bg": <CutMark />,
  upscale: <ExpandMark />,
  "clean-metadata": <XMark />,
  mask: <MaskMark />,
  trim: <ScissorMark />,
  convert: <RefreshMark />,
  delete: <MinusMark />,
};

function inferFormat(category: ToolDefinition["category"]): FileFormat {
  if (category === "image") return "image";
  if (category === "video") return "video";
  if (category === "kdp") return "book";
  if (category === "privacy") return "id";
  return "pdf";
}

function accessibleLabel(tool: ToolDefinition): string {
  if (tool.sourceFormat && tool.outputFormat && tool.action === "convert") {
    const from = FORMAT_SHORT[tool.sourceFormat] ?? tool.sourceFormat.toUpperCase();
    const to = FORMAT_SHORT[tool.outputFormat] ?? tool.outputFormat.toUpperCase();
    return `${tool.name}: ${from} to ${to}`;
  }
  return tool.name;
}

function InArrows() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M8 2v5M8 14V9M2 8h5M14 8H9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M6 6 8 8l2-2M6 10l2-2 2 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}
function RotateMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%] tv-rotate-mark">
      <path d="M3 8a5 5 0 1 0 1.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 3v3h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}
function PencilMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M3 13 4 9l7-7 3 3-7 7z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}
function SignMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M2 12c2-4 3 2 5-1s3-1 5 1 2-3 2-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
function LockMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <rect x="4" y="7" width="8" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 7V5a2 2 0 0 1 4 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function RedactMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <rect x="2" y="4" width="12" height="3" fill="currentColor" />
      <rect x="2" y="9" width="8" height="3" fill="currentColor" />
    </svg>
  );
}
function StampMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <circle cx="8" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 13h8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ScanMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M3 5V3h3M13 5V3H10M3 11v2h3M13 11v2h-3M2 8h12" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function CheckMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M3 8.5 6.5 12 13 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}
function RulerMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M2 11 11 2l3 3-9 9z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8h2M7 6h2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function TypeMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M3 4h10M8 4v9M5 13h6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function EyeMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M2 8s3-4 6-4 6 4 6 4-3 4-6 4-6-4-6-4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}
function ResizeMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M4 12 12 4M4 8V4h4M12 8v4H8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
function CutMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <circle cx="4" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4" cy="11" r="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 6 14 12M5.5 10 14 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function ExpandMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function XMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M4 4l8 8M12 4 4 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}
function MaskMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <rect x="2" y="5" width="12" height="7" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="8.5" r="1" fill="currentColor" />
      <circle cx="10" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
}
function ScissorMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <circle cx="4" cy="4" r="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.7 5.5 14 14M5.7 10.5 14 2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function RefreshMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M3 8a5 5 0 0 1 8.5-3.5L13 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 8a5 5 0 0 1-8.5 3.5L3 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function MinusMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]">
      <path d="M3 8h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
