import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";

/**
 * Root-relative (`/images/...`) and absolute (`https://...`) values point at
 * files outside the content collection — typically `public/` — so they have to
 * stay plain strings. Only genuinely relative paths (`./cover.png`) belong to
 * Astro's image pipeline, which would otherwise claim `/images/...` and fail
 * the build with ImageNotFound.
 */
const externalOgImage = z
  .string()
  .refine(value => value.startsWith("/") || /^https?:\/\//i.test(value), {
    message:
      "ogImage must be a root-relative path (/images/...) or an absolute URL",
  });

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(config.site.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      collection: z.string().min(1),
      tags: z.array(z.string()).default(["others"]),
      ogImage: z.union([externalOgImage, image()]).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      hideToc: z.boolean().optional(),
      // An empty value means "not set", so the site timezone applies.
      timezone: z
        .string()
        .optional()
        .transform(tz => tz || undefined),
    }),
});

export const collections = { posts };
