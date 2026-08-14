import { describe, expect, it } from "vitest";
import { buildOutputName, dedupeNames, sanitizeFileComponent, stripExtension } from "@/engines/image";

describe("image filename handling", () => {
  it("strips only the final extension", () => {
    expect(stripExtension("photo.jpg")).toBe("photo");
    expect(stripExtension("my.photo.png")).toBe("my.photo");
    expect(stripExtension("noext")).toBe("noext");
    expect(stripExtension(".hidden")).toBe(".hidden");
  });

  it("preserves normal, unusual, and Unicode names", () => {
    expect(buildOutputName("photo.jpg", "webp")).toBe("photo.webp");
    expect(buildOutputName("My holiday photo (2).JPG", "png")).toBe("My holiday photo (2).png");
    expect(buildOutputName("éclair 画像.png", "webp")).toBe("éclair 画像.webp");
    expect(buildOutputName("scan.photo.jpeg", "jpg")).toBe("scan.photo.jpg");
  });

  it("never lets path separators survive", () => {
    const name = buildOutputName("../evil.png", "jpg");
    expect(name).not.toContain("/");
    expect(name).not.toContain("\\");
    expect(name.startsWith(".")).toBe(false);
    const absolute = buildOutputName("C:\\Users\\me\\pic.png", "jpg");
    expect(absolute).not.toContain("\\");
    expect(absolute).not.toContain(":");
  });

  it("falls back when nothing is left", () => {
    expect(sanitizeFileComponent("....")).toBe("image");
    expect(buildOutputName(".png", "jpg")).toBe("image.jpg");
  });

  it("removes control characters and trims", () => {
    expect(sanitizeFileComponent("  scan\u0000 copy  ")).toBe("scan copy");
  });

  it("dedupes colliding output names deterministically", () => {
    const names = dedupeNames(["a.webp", "a.webp", "a.webp", "b.webp"]);
    expect(names).toEqual(["a.webp", "a-2.webp", "a-3.webp", "b.webp"]);
  });
});
