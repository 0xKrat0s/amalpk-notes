#!/usr/bin/env node
/**
 * Lists post images whose alt text is empty or is just the slug.
 *
 * Usage: npm run alt:audit
 */
import { readdirSync, readFileSync } from "node:fs";

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

if (rows.length === 0) {
  console.log("No image alt-text issues found.");
} else {
  console.table(rows);
  console.error(`Found ${rows.length} image alt-text issue(s).`);
  process.exitCode = 1;
}
