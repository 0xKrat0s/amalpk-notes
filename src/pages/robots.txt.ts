import type { APIRoute } from "astro";

/**
 * AI *search* crawlers (they cite and send traffic) are allowed explicitly.
 * AI *training* crawlers are intentionally left to the `User-agent: *` group,
 * which also allows them — change that only with a deliberate decision.
 */
const AI_SEARCH_CRAWLERS = [
  "OAI-SearchBot",
  "PerplexityBot",
  "Claude-SearchBot",
  "bingbot",
  "DuckDuckBot",
  "Bravebot",
];

const DISALLOW: string[] = [];

const group = (userAgent: string) =>
  [
    `User-agent: ${userAgent}`,
    "Allow: /",
    ...DISALLOW.map(path => `Disallow: ${path}`),
  ].join("\n");

const getRobotsTxt = (sitemapURL: URL) => `# ${sitemapURL.origin}
# Search results and tracking-parameter URLs are not useful in an index.

${group("*")}

# Allow AI search crawlers that cite sources and send traffic.
${AI_SEARCH_CRAWLERS.map(group).join("\n\n")}

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
