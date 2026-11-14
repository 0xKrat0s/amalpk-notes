/**
 * Build-time helper: map post slug → last meaningful modification date.
 *
 * Astro's sitemap integration can't read the content collections, so we scan the
 * post frontmatter directly. This keeps `<lastmod>` honest: it is the post's
 * `modDatetime` when set, otherwise `pubDatetime`.
 *
 * Plain ESM (not TypeScript) so it can be imported from `astro.config.ts`
 * without a `@types/node` dependency.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const POSTS_DIR = join(process.cwd(), "src", "content", "posts");

function collectFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, acc);
    } else if (/\.(md|mdx)$/.test(entry.name) && !entry.name.startsWith("_")) {
      acc.push(full);
    }
  }
  return acc;
}

function frontmatterDate(source) {
  const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return undefined;

  const read = key => {
    const match = fm[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return match?.[1]?.trim().replace(/^["']|["']$/g, "");
  };

  const raw = read("modDatetime") || read("pubDatetime");
  if (!raw) return undefined;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * @returns {Map<string, Date>} slug → lastmod
 */
export function getPostDateMap() {
  const map = new Map();
  for (const file of collectFiles(POSTS_DIR)) {
    const slug = file
      .slice(POSTS_DIR.length + 1)
      .replace(/\.(md|mdx)$/, "")
      .split(/[\\/]/)
      .pop();
    if (!slug) continue;

    try {
      const source = readFileSync(file, "utf8");
      const date = frontmatterDate(source);
      if (date) map.set(slug, date);
    } catch {
      // A post that can't be read is a build error elsewhere; ignore here.
    }
  }
  return map;
}
