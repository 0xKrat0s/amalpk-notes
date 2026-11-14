#!/usr/bin/env node
/**
 * Post-build SEO assertions. Run after `npm run build`.
 *
 * Checks the generated HTML in dist/ — not the source templates — for the
 * things that silently regress: canonical host, duplicate og:type, robots
 * directives, valid JSON-LD, and the presence of hosting files.
 *
 * Usage: npm run seo:validate
 */
import { readFileSync, existsSync } from "node:fs";

const SITE = "https://notes.amalpk.in";
const failures = [];
const notes = [];

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const pages = [
  ["dist/index.html", "home"],
  ["dist/posts/cve-2025-21298/index.html", "post"],
  ["dist/search/index.html", "search"],
  ["dist/posts/2/index.html", "paginated"],
];

for (const [file, label] of pages) {
  if (!existsSync(file)) {
    failures.push(`${label}: missing ${file}`);
    continue;
  }

  const html = readFileSync(file, "utf8");

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  check(
    canonical?.startsWith(SITE),
    `${label}: canonical is not on ${SITE} (got ${canonical})`
  );

  const ogTypes = [
    ...html.matchAll(/<meta property="og:type" content="([^"]+)"/g),
  ].map(match => match[1]);
  check(
    ogTypes.length === 1,
    `${label}: expected exactly one og:type, got ${ogTypes.length}`
  );
  check(
    ogTypes[0] === (label === "post" ? "article" : "website"),
    `${label}: wrong og:type (${ogTypes[0]})`
  );

  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? "";
  if (label === "search" || label === "paginated") {
    check(robots.startsWith("noindex"), `${label}: should be noindex`);
  } else {
    check(robots.startsWith("index"), `${label}: should be indexable`);
  }

  const blocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    ),
  ];
  check(blocks.length === 1, `${label}: expected one JSON-LD block`);

  for (const [, raw] of blocks) {
    try {
      const data = JSON.parse(raw);
      const types = (data["@graph"] ?? []).map(node => node["@type"]);
      check(types.includes("WebSite"), `${label}: JSON-LD missing WebSite`);
      check(types.includes("Person"), `${label}: JSON-LD missing Person`);
      if (label === "post") {
        check(types.includes("BlogPosting"), `${label}: missing BlogPosting`);
        check(
          types.includes("BreadcrumbList"),
          `${label}: missing BreadcrumbList`
        );
      }
      notes.push(`${label}: ${types.join(", ")}`);
    } catch (error) {
      failures.push(`${label}: invalid JSON-LD (${error.message})`);
    }
  }
}

// sitemap
if (existsSync("dist/sitemap-0.xml")) {
  const xml = readFileSync("dist/sitemap-0.xml", "utf8");
  check(!xml.includes("/search/"), "sitemap: /search/ should be excluded");
  check(!/\/posts\/\d+\//.test(xml), "sitemap: paginated posts should be excluded");
  const lastmods = [...xml.matchAll(/<lastmod>/g)].length;
  check(lastmods === 12, `sitemap: expected 12 lastmod entries, got ${lastmods}`);
} else {
  failures.push("sitemap: dist/sitemap-0.xml missing");
}

// hosting files
for (const file of [
  "dist/_headers",
  "dist/_redirects",
  "dist/robots.txt",
  "dist/llms.txt",
  "dist/rss.xml",
  "dist/.well-known/security.txt",
  "dist/43761e1fb96ba1b61b81edb8a0dde5d9.txt",
]) {
  check(existsSync(file), `missing ${file}`);
}

// IndexNow key file must contain only the key
const keyFile = "dist/43761e1fb96ba1b61b81edb8a0dde5d9.txt";
if (existsSync(keyFile)) {
  const content = readFileSync(keyFile, "utf8").trim();
  check(
    content === "43761e1fb96ba1b61b81edb8a0dde5d9",
    "IndexNow key file must contain only the key"
  );
}

notes.forEach(note => console.log(`  ${note}`));

if (failures.length) {
  console.error(`\n${failures.length} SEO check(s) failed:`);
  failures.forEach(failure => console.error(`  ✗ ${failure}`));
  process.exit(1);
}

console.log("\nAll SEO checks passed.");
