import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";

/**
 * `llms.txt` — a plain-Markdown map of the site for AI agents.
 *
 * Google Search explicitly ignores this file. It is not a ranking lever.
 * It exists because ChatGPT/Claude/Perplexity/agent frameworks do fetch it when
 * reasoning about a domain, and it costs one static file.
 */
export const GET: APIRoute = async () => {
  const posts = getSortedPosts(await getCollection("posts"));
  const siteUrl = config.site.url.replace(/\/+$/, "");

  const byCollection = new Map<string, typeof posts>();

  for (const post of posts) {
    const key = post.data.collection;
    if (!byCollection.has(key)) byCollection.set(key, []);
    byCollection.get(key)!.push(post);
  }

  const lines: string[] = [
    `# ${config.site.title}`,
    "",
    `> ${config.site.description}`,
    "",
    `Authored by ${config.site.author}${
      config.site.profile ? ` (${config.site.profile})` : ""
    }.`,
    "",
    `Canonical host: ${siteUrl}`,
    "",
  ];

  for (const [collection, collectionPosts] of byCollection) {
    lines.push(`## ${collection}`, "");
    for (const post of collectionPosts) {
      const url = new URL(
        getPostUrl(post.id, post.filePath, config.site.lang),
        siteUrl
      ).href;
      lines.push(`- [${post.data.title}](${url}): ${post.data.description}`);
    }
    lines.push("");
  }

  lines.push(
    "## Pages",
    "",
    `- [Portfolio](https://amalpk.in/): author profile and portfolio`,
    `- [Posts](${siteUrl}/posts/): all writeups`,
    `- [Archives](${siteUrl}/archives/): chronological index`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
