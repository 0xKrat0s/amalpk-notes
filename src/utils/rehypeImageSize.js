/**
 * Rehype plugin that adds explicit `width`/`height` to markdown images that
 * reference static assets from `public/` (e.g. `/images/posts/.../image-1.webp`).
 *
 * Without dimensions the browser doesn't reserve layout space while the image
 * loads, which causes cumulative layout shift in the post body (Lighthouse
 * `unsized-images` / CLS > 0.1). Astro's own image pipeline only dimensions
 * optimized imports, not plain `public/` references.
 *
 * Zero-dependency: parses PNG (IHDR), JPEG (SOF markers) and WebP (VP8/VP8L/VP8X)
 * headers directly. Missing files are left untouched.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** PNG: width/height are big-endian uint32s at fixed offsets in the IHDR chunk. */
function pngSize(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** JPEG: scan segments for a SOF0-SOF15 marker (except DHT/JPG/DAC). */
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let off = 2;
  while (off + 9 < buf.length) {
    if (buf[off] !== 0xff) return null; // malformed
    const marker = buf[off + 1];
    const len = buf.readUInt16BE(off + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { width: buf.readUInt16BE(off + 7), height: buf.readUInt16BE(off + 5) };
    }
    off += 2 + len;
  }
  return null;
}

/**
 * WebP (RIFF container): dimensions depend on the VP8 bitstream flavour.
 *  - VP8  (lossy): 16-bit LE width/height at offsets 26/28 of the file
 *  - VP8L (lossless): 14-bit-packed width/height starting at offset 21
 *  - VP8X (extended): 24-bit LE (minus 1) canvas size at offsets 24/27
 */
function webpSize(buf) {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP")
    return null;
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    const w = buf.readUIntLE(24, 3) + 1;
    const h = buf.readUIntLE(27, 3) + 1;
    return { width: w, height: h };
  }
  return null;
}

export const rehypeImageSize = () => (tree) => {
  const visit = (node) => {
    if (node.type === "element" && node.tagName === "img") {
      const src = node.properties?.src;
      if (
        typeof src === "string" &&
        src.startsWith("/") &&
        node.properties.width === undefined
      ) {
        try {
          const buf = readFileSync(join(process.cwd(), "public", src));
          const size = pngSize(buf) || jpegSize(buf) || webpSize(buf);
          if (size) {
            node.properties.width = size.width;
            node.properties.height = size.height;
          }
        } catch {
          // Missing file: leave the node untouched (build continues).
        }
      }
    }
    if (node.children) node.children.forEach(visit);
  };
  visit(tree);
};
