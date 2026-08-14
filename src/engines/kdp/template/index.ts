import { INTERIOR_LABELS, PAPER_LABELS } from "@/engines/kdp/copy-dimensions";
import {
  BARCODE_HEIGHT_INCHES,
  BARCODE_MARGIN_INCHES,
  BARCODE_WIDTH_INCHES,
} from "@/data/kdp/specifications";
import { downloadBlob } from "@/lib/export/download";
import { formatInchesAndMm, unitToInches } from "@/lib/calculations/units";
import type {
  CoverPanel,
  PaperbackCoverDimensions,
  TemplateOptions,
} from "@/types/kdp";

export interface TemplateRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateGeometry {
  full: TemplateRect;
  bleed: number;
  trimHeight: number;
  trimWidth: number;
  spineWidth: number;
  panels: Array<{
    panel: CoverPanel;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  spineLeft: number;
  spineRight: number;
  spineCenterX: number;
  liveInset: number;
  spineClearance: number;
  barcode: TemplateRect;
}

type DrawOp =
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: string;
      dash?: boolean;
      strokeWidth?: number;
    }
  | {
      kind: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      dash?: boolean;
      strokeWidth?: number;
    }
  | {
      kind: "text";
      x: number;
      y: number;
      size: number;
      value: string;
      fill: string;
      anchor?: "start" | "middle";
      rotate?: { cx: number; cy: number };
      weight?: "normal" | "bold";
    };

export function buildTemplateGeometry(
  dimensions: PaperbackCoverDimensions,
): TemplateGeometry {
  const fullWidth = unitToInches(dimensions.fullCoverWidth, dimensions.unit);
  const fullHeight = unitToInches(dimensions.fullCoverHeight, dimensions.unit);
  const bleed = unitToInches(dimensions.bleed, dimensions.unit);
  const spineWidth = unitToInches(dimensions.spineWidth, dimensions.unit);
  const trimWidth = unitToInches(dimensions.trimWidth, dimensions.unit);
  const trimHeight = unitToInches(dimensions.trimHeight, dimensions.unit);
  const liveInset = unitToInches(
    dimensions.safeArea.kdpMinimumFromTrim,
    dimensions.unit,
  );
  const spineClearance = unitToInches(
    dimensions.safeArea.spineClearance,
    dimensions.unit,
  );

  const leftWidth =
    dimensions.layout.left === "spine" ? spineWidth : trimWidth;
  const rightWidth =
    dimensions.layout.right === "spine" ? spineWidth : trimWidth;

  const panels: TemplateGeometry["panels"] = [
    {
      panel: dimensions.layout.left,
      x: bleed,
      y: bleed,
      width: leftWidth,
      height: trimHeight,
    },
    {
      panel: "spine",
      x: bleed + leftWidth,
      y: bleed,
      width: spineWidth,
      height: trimHeight,
    },
    {
      panel: dimensions.layout.right,
      x: bleed + leftWidth + spineWidth,
      y: bleed,
      width: rightWidth,
      height: trimHeight,
    },
  ];

  const back = panels.find((panel) => panel.panel === "back");
  if (!back) {
    throw new Error("Back cover panel is missing from the template layout.");
  }

  const barcodeWidth = Math.min(
    BARCODE_WIDTH_INCHES,
    Math.max(back.width - BARCODE_MARGIN_INCHES * 2, 0.5),
  );
  const barcodeHeight = Math.min(
    BARCODE_HEIGHT_INCHES,
    Math.max(back.height - BARCODE_MARGIN_INCHES * 2, 0.4),
  );
  const nearSpine = back.x > bleed;
  const barcodeX = nearSpine
    ? back.x + BARCODE_MARGIN_INCHES
    : back.x + back.width - BARCODE_MARGIN_INCHES - barcodeWidth;
  const barcodeY =
    back.y + back.height - BARCODE_MARGIN_INCHES - barcodeHeight;

  return {
    full: { x: 0, y: 0, width: fullWidth, height: fullHeight },
    bleed,
    trimHeight,
    trimWidth,
    spineWidth,
    panels,
    spineLeft: bleed + leftWidth,
    spineRight: bleed + leftWidth + spineWidth,
    spineCenterX: bleed + leftWidth + spineWidth / 2,
    liveInset,
    spineClearance,
    barcode: {
      x: barcodeX,
      y: barcodeY,
      width: barcodeWidth,
      height: barcodeHeight,
    },
  };
}

function buildPrintOperations(
  dimensions: PaperbackCoverDimensions,
  options: TemplateOptions,
): DrawOp[] {
  const geo = buildTemplateGeometry(dimensions);
  const w = geo.full.width;
  const h = geo.full.height;
  const reading =
    dimensions.layout.left === "back" ? "Left to Right" : "Right to Left";
  const ops: DrawOp[] = [];

  ops.push({
    kind: "rect",
    x: 0,
    y: 0,
    width: w,
    height: h,
    fill: options.showBleed ? "#f3b6ae" : "#ffffff",
  });

  for (const panel of geo.panels) {
    const insetX = options.showSafeArea
      ? panel.panel === "spine"
        ? geo.spineClearance
        : geo.liveInset
      : 0;
    const insetY = options.showSafeArea ? geo.liveInset : 0;
    ops.push({
      kind: "rect",
      x: panel.x + insetX,
      y: panel.y + insetY,
      width: Math.max(panel.width - insetX * 2, 0),
      height: Math.max(panel.height - insetY * 2, 0),
      fill: "#ffffff",
    });
  }

  ops.push({
    kind: "rect",
    x: geo.bleed,
    y: geo.bleed,
    width: w - geo.bleed * 2,
    height: geo.trimHeight,
    stroke: "#111111",
    strokeWidth: 0.02,
  });

  ops.push({
    kind: "line",
    x1: geo.spineLeft,
    y1: geo.bleed,
    x2: geo.spineLeft,
    y2: geo.bleed + geo.trimHeight,
    stroke: "#1d4ed8",
    dash: true,
    strokeWidth: 0.018,
  });
  ops.push({
    kind: "line",
    x1: geo.spineRight,
    y1: geo.bleed,
    x2: geo.spineRight,
    y2: geo.bleed + geo.trimHeight,
    stroke: "#1d4ed8",
    dash: true,
    strokeWidth: 0.018,
  });

  if (options.showBarcodeArea) {
    const b = geo.barcode;
    ops.push({
      kind: "rect",
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      fill: "#f5d76e",
      stroke: "#111111",
      strokeWidth: 0.015,
    });
    ops.push({
      kind: "text",
      x: b.x + b.width / 2,
      y: b.y + b.height / 2 - 0.08,
      size: 0.11,
      value: "Barcode Location & Size",
      fill: "#111111",
      anchor: "middle",
      weight: "bold",
    });
    ops.push({
      kind: "text",
      x: b.x + b.width / 2,
      y: b.y + b.height / 2 + 0.1,
      size: 0.1,
      value: `${b.width.toFixed(3)}" x ${b.height.toFixed(3)}" (${(b.width * 25.4).toFixed(2)}mm x ${(b.height * 25.4).toFixed(2)}mm)`,
      fill: "#111111",
      anchor: "middle",
    });
  }

  const back = geo.panels.find((panel) => panel.panel === "back");
  const front = geo.panels.find((panel) => panel.panel === "front");
  const spine = geo.panels.find((panel) => panel.panel === "spine");

  if (options.showLabels && back) {
    const lx = back.x + 0.2;
    let ly = back.y + 0.35;
    ops.push({
      kind: "text",
      x: lx,
      y: ly,
      size: 0.13,
      value: "REMOVE THIS TEMPLATE LAYER FROM FINAL ARTWORK.",
      fill: "#9b1c1c",
      weight: "bold",
    });
    ly += 0.35;
    const legend: Array<{ fill?: string; stroke?: string; dash?: boolean; label: string }> =
      [
        { fill: "#f3b6ae", label: "Out of Live / Bleed" },
        { fill: "#ffffff", stroke: "#111111", label: "Live Area" },
        { stroke: "#111111", label: "Trim" },
        { stroke: "#1d4ed8", dash: true, label: "Spine fold" },
        { fill: "#f5d76e", label: "Barcode" },
      ];
    for (const item of legend) {
      ops.push({
        kind: "rect",
        x: lx,
        y: ly - 0.12,
        width: 0.22,
        height: 0.16,
        fill: item.fill ?? "#ffffff",
        stroke: item.stroke ?? "#111111",
        dash: item.dash,
        strokeWidth: 0.012,
      });
      ops.push({
        kind: "text",
        x: lx + 0.3,
        y: ly,
        size: 0.11,
        value: item.label,
        fill: "#111111",
      });
      ly += 0.22;
    }
    ly += 0.2;
    ops.push({
      kind: "text",
      x: lx,
      y: ly,
      size: 0.14,
      value: "BACK COVER",
      fill: "#111111",
      weight: "bold",
    });
  }

  if (options.showLabels && spine) {
    ops.push({
      kind: "text",
      x: spine.x + spine.width / 2 + 0.18,
      y: spine.y + 1.6,
      size: 0.1,
      value: `Spine Width ${formatInchesAndMm(geo.spineWidth)}`,
      fill: "#1d4ed8",
      rotate: {
        cx: spine.x + spine.width / 2 + 0.18,
        cy: spine.y + 1.6,
      },
    });
  }

  if (options.showLabels && front) {
    const fx = front.x + 0.3;
    const lines = [
      { text: `${geo.trimWidth.toFixed(3)}" x ${geo.trimHeight.toFixed(3)}" Book`, size: 0.16, bold: true },
      { text: `(${(geo.trimWidth * 25.4).toFixed(2)}mm x ${(geo.trimHeight * 25.4).toFixed(2)}mm)`, size: 0.12, bold: false },
      { text: "", size: 0.12, bold: false },
      { text: "Overall Dimensions", size: 0.12, bold: true },
      { text: `${w.toFixed(3)}" x ${h.toFixed(3)}"`, size: 0.14, bold: false },
      { text: `(${(w * 25.4).toFixed(2)}mm x ${(h * 25.4).toFixed(2)}mm)`, size: 0.12, bold: false },
      { text: "", size: 0.12, bold: false },
      { text: `Spine Width ${formatInchesAndMm(geo.spineWidth)}`, size: 0.13, bold: false },
      { text: "", size: 0.12, bold: false },
      { text: `${INTERIOR_LABELS[dimensions.interiorType]} interior`, size: 0.13, bold: false },
      { text: `${dimensions.pageCount} Pages`, size: 0.13, bold: false },
      { text: `${PAPER_LABELS[dimensions.paperType]} Paper`, size: 0.13, bold: false },
      { text: reading, size: 0.13, bold: false },
      { text: "", size: 0.12, bold: false },
      { text: "Independent guide layer. Not affiliated with Amazon.", size: 0.1, bold: false },
      { text: "Verify final files in KDP before publishing.", size: 0.1, bold: false },
    ];
    let fy = front.y + 1.2;
    for (const line of lines) {
      if (line.text) {
        ops.push({
          kind: "text",
          x: fx,
          y: fy,
          size: line.size,
          value: line.text,
          fill: "#111111",
          weight: line.bold ? "bold" : "normal",
        });
      }
      fy += 0.24;
    }
    ops.push({
      kind: "text",
      x: front.x + front.width / 2,
      y: front.y + front.height - 0.28,
      size: 0.14,
      value: "FRONT COVER",
      fill: "#111111",
      anchor: "middle",
      weight: "bold",
    });
  }

  if (options.showMeasurements) {
    ops.push({
      kind: "text",
      x: w / 2,
      y: 0.18,
      size: 0.11,
      value: `Full cover ${w.toFixed(3)}" x ${h.toFixed(3)}"`,
      fill: "#111111",
      anchor: "middle",
      weight: "bold",
    });
  }

  return ops;
}

function svgEsc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function generateCoverTemplateSvg(
  dimensions: PaperbackCoverDimensions,
  options: TemplateOptions,
  extras?: { pixelWidth?: number; pixelHeight?: number },
): string {
  const geo = buildTemplateGeometry(dimensions);
  const w = geo.full.width;
  const h = geo.full.height;
  const widthAttr = extras?.pixelWidth
    ? `${extras.pixelWidth}`
    : `${w}in`;
  const heightAttr = extras?.pixelHeight
    ? `${extras.pixelHeight}`
    : `${h}in`;
  const ops = buildPrintOperations(dimensions, options);
  const parts: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${widthAttr}" height="${heightAttr}" viewBox="0 0 ${w} ${h}">`,
    `<title>Paperback wrap cover template</title>`,
  ];

  for (const op of ops) {
    if (op.kind === "rect") {
      const dash = op.dash ? ` stroke-dasharray="0.06 0.04"` : "";
      parts.push(
        `<rect x="${op.x}" y="${op.y}" width="${op.width}" height="${op.height}" fill="${op.fill ?? "none"}" stroke="${op.stroke ?? "none"}" stroke-width="${op.strokeWidth ?? 0}"${dash}/>`,
      );
    } else if (op.kind === "line") {
      const dash = op.dash ? ` stroke-dasharray="0.08 0.05"` : "";
      parts.push(
        `<line x1="${op.x1}" y1="${op.y1}" x2="${op.x2}" y2="${op.y2}" stroke="${op.stroke}" stroke-width="${op.strokeWidth ?? 0.018}"${dash}/>`,
      );
    } else {
      const anchor = op.anchor === "middle" ? ` text-anchor="middle"` : "";
      const weight = op.weight === "bold" ? ` font-weight="700"` : "";
      const rotate = op.rotate
        ? ` transform="rotate(90 ${op.rotate.cx} ${op.rotate.cy})"`
        : "";
      parts.push(
        `<text x="${op.x}" y="${op.y}" font-family="Helvetica, Arial, sans-serif" font-size="${op.size}" fill="${op.fill}"${anchor}${weight}${rotate}>${svgEsc(op.value)}</text>`,
      );
    }
  }

  parts.push("</svg>");
  return parts.join("");
}

function hexToRgb(hex: string): string {
  const value = hex.replace("#", "");
  const n = Number.parseInt(value, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

export function generateCoverTemplatePdf(
  dimensions: PaperbackCoverDimensions,
  options: TemplateOptions,
): Uint8Array {
  const geo = buildTemplateGeometry(dimensions);
  const pageW = geo.full.width * 72;
  const pageH = geo.full.height * 72;
  const ops = buildPrintOperations(dimensions, options);
  const stream: string[] = [];
  const toPdf = (x: number, y: number) => ({ x: x * 72, y: pageH - y * 72 });

  for (const op of ops) {
    if (op.kind === "rect") {
      const p = toPdf(op.x, op.y + op.height);
      if (op.fill) {
        stream.push(`${hexToRgb(op.fill)} rg`);
        stream.push(
          `${n(p.x)} ${n(p.y)} ${n(op.width * 72)} ${n(op.height * 72)} re f`,
        );
      }
      if (op.stroke) {
        stream.push(op.dash ? "[4 3] 0 d" : "[] 0 d");
        stream.push(`${hexToRgb(op.stroke)} RG`);
        stream.push(`${n((op.strokeWidth ?? 0.02) * 72)} w`);
        stream.push(
          `${n(p.x)} ${n(p.y)} ${n(op.width * 72)} ${n(op.height * 72)} re S`,
        );
      }
    } else if (op.kind === "line") {
      const a = toPdf(op.x1, op.y1);
      const b = toPdf(op.x2, op.y2);
      stream.push(op.dash ? "[4 3] 0 d" : "[] 0 d");
      stream.push(`${hexToRgb(op.stroke)} RG`);
      stream.push(`${n((op.strokeWidth ?? 0.018) * 72)} w`);
      stream.push(`${n(a.x)} ${n(a.y)} m ${n(b.x)} ${n(b.y)} l S`);
    } else {
      const p = toPdf(op.x, op.y);
      stream.push("BT");
      stream.push(`/F1 ${n(op.size * 72)} Tf`);
      stream.push(`${hexToRgb(op.fill)} rg`);
      if (op.rotate) {
        const c = toPdf(op.rotate.cx, op.rotate.cy);
        stream.push(`0 1 -1 0 ${n(c.x)} ${n(c.y)} Tm`);
      } else {
        stream.push(`1 0 0 1 ${n(p.x)} ${n(p.y)} Tm`);
      }
      stream.push(`(${pdfEsc(op.value)}) Tj`);
      stream.push("ET");
    }
  }

  return buildPdf(pageW, pageH, stream.join("\n") + "\n");
}

function n(value: number): string {
  return value.toFixed(3);
}

function pdfEsc(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildPdf(width: number, height: number, content: string): Uint8Array {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(width)} ${n(height)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
  );
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export async function generateCoverTemplatePng(
  dimensions: PaperbackCoverDimensions,
  options: TemplateOptions,
  dpi = 300,
): Promise<Blob> {
  const geo = buildTemplateGeometry(dimensions);
  const widthPx = Math.max(1, Math.round(geo.full.width * dpi));
  const heightPx = Math.max(1, Math.round(geo.full.height * dpi));
  const svg = generateCoverTemplateSvg(dimensions, options, {
    pixelWidth: widthPx,
    pixelHeight: heightPx,
  });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("The PNG template could not be rendered in this browser.");
    }
    context.fillStyle = "#f3b6ae";
    context.fillRect(0, 0, widthPx, heightPx);
    context.drawImage(image, 0, 0, widthPx, heightPx);
    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("The SVG template could not be rasterized."));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("The PNG template could not be created."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export { downloadBlob };

export function templateFilename(
  trimId: string,
  pageCount: number,
  paperType: string,
  extension: string,
): string {
  return `paperback-cover-${trimId}-${pageCount}p-${paperType}.${extension}`;
}
