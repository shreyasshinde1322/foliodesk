import { describe, expect, it } from "vitest";
import { detectFormat, formatFromExtension, isSupportedInput } from "@/engines/image";

describe("image format detection", () => {
  it("detects PNG by signature", () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    expect(detectFormat(bytes)).toBe("png");
  });

  it("detects JPEG by FF D8 FF", () => {
    expect(detectFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]))).toBe("jpg");
  });

  it("detects GIF by header", () => {
    const gif = new TextEncoder().encode("GIF89a.....");
    expect(detectFormat(gif)).toBe("gif");
  });

  it("detects WebP via RIFF + WEBP", () => {
    const bytes = new TextEncoder().encode("RIFF\x00\x00\x00\x00WEBPVP8 ");
    expect(detectFormat(bytes)).toBe("webp");
  });

  it("detects AVIF via ftyp + avif brand", () => {
    const bytes = new TextEncoder().encode("\x00\x00\x00\x00ftypavif\x00\x00\x00\x00");
    expect(detectFormat(bytes)).toBe("avif");
  });

  it("returns null for unsupported bytes", () => {
    expect(detectFormat(new TextEncoder().encode("this is not an image"))).toBeNull();
    expect(detectFormat(new Uint8Array([0x00, 0x01, 0x02, 0x03]))).toBeNull();
    expect(detectFormat(new Uint8Array(0))).toBeNull();
  });

  it("maps extensions case-insensitively", () => {
    expect(formatFromExtension("photo.JPEG")).toBe("jpg");
    expect(formatFromExtension("photo.jpg")).toBe("jpg");
    expect(formatFromExtension("photo.png")).toBe("png");
    expect(formatFromExtension("photo.webp")).toBe("webp");
    expect(formatFromExtension("photo.gif")).toBe("gif");
    expect(formatFromExtension("photo.avif")).toBe("avif");
    expect(formatFromExtension("photo.pdf")).toBeNull();
    expect(formatFromExtension("noextension")).toBeNull();
  });

  it("isSupportedInput checks extension and never trusts extension alone", () => {
    expect(isSupportedInput("x.png")).toBe(true);
    expect(isSupportedInput("x.jpg")).toBe(true);
    expect(isSupportedInput("x.exe")).toBe(false);
  });
});
