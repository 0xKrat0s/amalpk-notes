#!/usr/bin/env node
/**
 * Ping IndexNow after publishing or updating a post.
 *
 * Usage:
 *   node scripts/indexnow.mjs https://notes.amalpk.in/posts/my-post/
 *   node scripts/indexnow.mjs            # pings every post URL from dist/sitemap-0.xml
 *
 * The key is auto-detected from `public/<32-hex>.txt`, which must also be
 * deployed so the engines can verify ownership.
 *
 * Google does not participate in IndexNow — its sitemap is still authoritative.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const HOST = "https://notes.amalpk.in";
const PUBLIC_DIR = join(process.cwd(), "public");

const keyFile = readdirSync(PUBLIC_DIR).find(name => /^[a-f0-9]{32}\.txt$/i.test(name));
if (!keyFile) {
  console.error("No IndexNow key file found in public/ (expected <32-hex>.txt)");
  process.exit(1);
}
const key = keyFile.replace(/\.txt$/, "");

const XML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
};

function unescapeXml(value) {
  return value.replace(/&(?:amp|lt|gt|quot|apos|#39);/g, entity => XML_ENTITIES[entity]);
}

function urlsFromBuild() {
  try {
    const xml = readFileSync(join(process.cwd(), "dist", "sitemap-0.xml"), "utf8");
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(match => match[1])
      .map(unescapeXml)
      .filter(url => url.startsWith(HOST));
  } catch {
    return [];
  }
}

const args = process.argv.slice(2);
const urlList = args.length ? args : urlsFromBuild();

if (!urlList.length) {
  console.error("No URLs to submit. Pass URLs explicitly or run a build first.");
  process.exit(1);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(HOST).host,
    key,
    keyLocation: `${HOST}/${keyFile}`,
    urlList,
  }),
});

if (!response.ok) {
  const body = (await response.text()).slice(0, 300);
  console.error(`IndexNow submission failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`);
  process.exit(1);
}

console.log(`IndexNow: ${response.status} ${response.statusText} (${urlList.length} URLs)`);
