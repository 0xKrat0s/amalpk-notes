import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const cloverPath = resolve(process.cwd(), "public", "favicon-192x192.png");

/** Embed the brand mark so generated social cards remain self-contained. */
export async function getOgBrandImageDataUri(): Promise<string> {
  const image = await readFile(cloverPath);
  return `data:image/png;base64,${image.toString("base64")}`;
}
