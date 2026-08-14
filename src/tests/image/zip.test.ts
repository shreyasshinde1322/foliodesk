import { describe, expect, it } from "vitest";
import { crc32, createZip } from "@/engines/image";

const encoder = new TextEncoder();

function bytes(text: string): Uint8Array {
  return encoder.encode(text);
}

function parseZip(zip: Uint8Array) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const endOffset = zip.length - 22;
  expect(view.getUint32(endOffset, true)).toBe(0x06054b50);
  const count = view.getUint16(endOffset + 10, true);
  const entries: Array<{ name: string; data: Uint8Array }> = [];
  let offset = 0;
  for (let index = 0; index < count; index += 1) {
    expect(view.getUint32(offset, true)).toBe(0x04034b50);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const size = view.getUint32(offset + 18, true);
    const name = new TextDecoder().decode(zip.subarray(offset + 30, offset + 30 + nameLength));
    const data = Uint8Array.from(
      zip.subarray(offset + 30 + nameLength + extraLength, offset + 30 + nameLength + extraLength + size),
    );
    entries.push({ name, data });
    offset += 30 + nameLength + extraLength + size;
  }
  return entries;
}

describe("zip writer", () => {
  it("computes the standard CRC32 check value", () => {
    expect(crc32(bytes("123456789"))).toBe(0xcbf43926);
  });

  it("round-trips multiple entries with exact bytes", () => {
    const first = bytes("hello world");
    const second = bytes("{ json: true }");
    const zip = createZip([
      { name: "a.txt", data: first },
      { name: "b.txt", data: second },
    ]);
    const entries = parseZip(zip);
    expect(entries.map((entry) => entry.name)).toEqual(["a.txt", "b.txt"]);
    expect(Uint8Array.from(entries[0].data)).toEqual(first);
    expect(Uint8Array.from(entries[1].data)).toEqual(second);
  });

  it("keeps Unicode filenames intact (UTF-8 flag set)", () => {
    const zip = createZip([{ name: "éclair 画像.webp", data: bytes("x") }]);
    const entries = parseZip(zip);
    expect(entries[0].name).toBe("éclair 画像.webp");
  });

  it("handles empty data and zero entries", () => {
    const zip = createZip([]);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    expect(view.getUint16(zip.length - 22 + 8, true)).toBe(0);
  });
});
