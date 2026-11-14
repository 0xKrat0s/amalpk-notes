import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { rehypeTableWrapper } from "./src/utils/rehypeTableWrapper";
import {
  inlineTocDeprecation,
  rehypeInlineToc,
} from "./src/utils/rehypeInlineToc";
import config from "./astro-paper.config";
// @ts-ignore -- plain ESM helper, intentionally untyped (no @types/node dep)
import { getPostDateMap } from "./scripts/post-dates.mjs";

const postDates = getPostDateMap();
const siteUrl = config.site.url.replace(/\/+$/, "");

/** Turn a sitemap URL into the post slug it represents, if any. */
function postSlugFromUrl(url: string) {
  const path = url.startsWith(siteUrl) ? url.slice(siteUrl.length) : url;
  const match = path.match(/^\/posts\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export default defineConfig({
  site: config.site.url,
  trailingSlash: "always",
  integrations: [
    mdx(),
    sitemap({
      filter: page => {
        const path = page.startsWith(siteUrl)
          ? page.slice(siteUrl.length)
          : page;
        // Search is client-side only and never useful as a result.
        if (/^\/search\/?$/.test(path)) return false;
        // Paginated listing pages duplicate page 1 and are noindexed.
        if (/\/\d+\/?$/.test(path) && /^\/(posts|directory)\//.test(path))
          return false;
        if (
          config.features?.showArchives === false &&
          /^\/archives\/?$/.test(path)
        )
          return false;
        return true;
      },
      serialize: item => {
        const slug = postSlugFromUrl(item.url);
        const date = slug ? postDates.get(slug) : undefined;
        if (date) item.lastmod = date.toISOString();
        return item;
      },
    }),
    inlineTocDeprecation(),
  ],
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    // Deprecated: the theme no longer uses remark-toc or remark-collapse. They
    // stay in package.json so a customised config importing them still builds,
    // and are removed in v8.
    processor: unified({
      rehypePlugins: [
        rehypeHeadingIds,
        rehypeInlineToc,
        rehypeCallouts,
        rehypeTableWrapper,
      ],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
