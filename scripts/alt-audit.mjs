#!/usr/bin/env node
/**
 * Lists post images whose alt text is empty or is just the slug.
 * Writes IMAGE-ALT-TODO.md so the remaining manual work is tracked.
 *
 * Usage: npm run alt:audit
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const DIR = "src/content/posts";
const rows = [];

for (const file of readdirSync(DIR).filter(name => name.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  const lines = readFileSync(`${DIR}/${file}`, "utf8").split("\n");

  lines.forEach((line, index) => {
    for (const match of line.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
      const alt = match[1].trim();
      if (!alt || alt === slug) {
        rows.push({ file, line: index + 1, alt, src: match[2] });
      }
    }
  });
}

const markdown = [
  "# Image alt-text TODO",
  "",
  "Images with empty or slug-only alt text. Replace each with a description of what the",
  'image actually shows (e.g. "Burp Suite proxy settings with the listener bound to all interfaces").',
  "Do not describe the file name. Leave purely decorative images empty.",
  "",
  `Total: ${rows.length}`,
  "",
  "| Post | Line | Current alt | Image |",
  "|---|---|---|---|",
  ...rows.map(
    row =>
      `| \`${row.file}\` | ${row.line} | ${
        row.alt ? `\`${row.alt}\`` : "*(empty)*"
      } | \`${row.src}\` |`
  ),
  "",
];

writeFileSync("IMAGE-ALT-TODO.md", markdown.join("\n"));
console.log(`IMAGE-ALT-TODO.md written with ${rows.length} rows`);
