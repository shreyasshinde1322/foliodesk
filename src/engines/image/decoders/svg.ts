import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";
import { createCanvas, get2dContext } from "../canvas";

/**
 * SVG files are untrusted XML: they can contain scripts, event handlers, and
 * references to external resources. Strip all of those before the browser is
 * asked to rasterize the file. Only `#fragment` references (gradients, masks,
 * clip paths defined in the same document) and inline `data:image` URIs are
 * preserved.
 *
 * Uses `DOMParser` when available (browser) and a conservative string-based
 * sanitizer otherwise (Node/workers), so the function is testable anywhere.
 */
export function sanitizeSvg(xml: string): string {
  if (typeof DOMParser !== "undefined") {
    return sanitizeWithDom(xml);
  }
  return sanitizeString(xml);
}

function sanitizeWithDom(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, "image/svg+xml");
  if (doc.querySelector("parsererror")) {
    throw new ImageProcessingError("The SVG is not well-formed XML.", "invalid-file");
  }
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    throw new ImageProcessingError("This file does not contain an <svg> root element.", "invalid-file");
  }

  const walk = (node: Node): void => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 1) {
        const element = child as Element;
        const tag = element.tagName.toLowerCase();
        if (tag === "script" || tag === "foreignobject" || tag === "object" || tag === "embed") {
          element.remove();
          continue;
        }
        for (const attribute of Array.from(element.attributes)) {
          const name = attribute.name.toLowerCase();
          if (name.startsWith("on")) {
            element.removeAttribute(attribute.name);
          } else if (name === "href" || name === "xlink:href") {
            const value = attribute.value.trim();
            if (!value.startsWith("#") && !value.startsWith("data:image/")) {
              element.removeAttribute(attribute.name);
            }
          } else if (name === "style") {
            if (/url\(\s*["']?https?:|url\(\s*["']?\/\//i.test(attribute.value)) {
              attribute.value = attribute.value.replace(/url\(\s*["']?(?:https?:)?\/\/[^)]*\)/gi, "none");
            }
          }
        }
        walk(child);
      }
    }
  };
  walk(root);

  return new XMLSerializer().serializeToString(root);
}

const DANGEROUS_ELEMENT_PATTERN =
  /<(script|foreignobject|object|embed)\b[\s\S]*?<\/(?:script|foreignobject|object|embed)>|<(script|foreignobject|object|embed)\b[^>]*\/>/gi;

/**
 * DOM-free sanitizer used where DOMParser is unavailable. Conservative: it
 * removes whole elements and attributes rather than trying to repair them.
 */
export function sanitizeString(xml: string): string {
  let text = xml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(DANGEROUS_ELEMENT_PATTERN, "");
  text = text.replace(/\s(?:xlink:href|href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (match, raw) => {
    const value = raw.slice(1, -1).trim();
    if (value.startsWith("#")) return match;
    if (/^data:image\//i.test(value)) return match;
    return "";
  });
  text = text.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return text;
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/**
 * Rasterize a sanitized SVG at the requested pixel size. The browser's
 * `createImageBitmap` is the only path that does not execute scripts (the
 * sanitizer has already removed them anyway).
 */
export async function renderSvg(
  svgText: string,
  width: number,
  height: number,
): Promise<DecodedBitmap> {
  if (typeof createImageBitmap !== "function") {
    throw new ImageProcessingError("This browser cannot render SVG files.", "decode-failed");
  }
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  try {
    const bitmap = await createImageBitmap(blob, {
      resizeWidth: Math.max(1, width),
      resizeHeight: Math.max(1, height),
      resizeQuality: "high",
    });
    try {
      const context = get2dContext(createCanvas(bitmap.width, bitmap.height));
      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
      return { width: bitmap.width, height: bitmap.height, data: imageData.data };
    } finally {
      if (typeof bitmap.close === "function") bitmap.close();
    }
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("The SVG could not be rendered by this browser.", "decode-failed");
  }
}

export function svgToText(bytes: Uint8Array): string {
  return decodeUtf8(bytes);
}

/** Rasterize at the SVG's intrinsic size (used for analysis/decoding). */
export async function renderSvgIntrinsic(svgText: string): Promise<DecodedBitmap> {
  if (typeof createImageBitmap !== "function") {
    throw new ImageProcessingError("This browser cannot render SVG files.", "decode-failed");
  }
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  try {
    const bitmap = await createImageBitmap(blob);
    try {
      const context = get2dContext(createCanvas(bitmap.width, bitmap.height));
      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
      return { width: bitmap.width, height: bitmap.height, data: imageData.data };
    } finally {
      if (typeof bitmap.close === "function") bitmap.close();
    }
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("The SVG could not be rendered by this browser.", "decode-failed");
  }
}
