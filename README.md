# Amal PK Notes

Amal PK Notes is Amal PK's cybersecurity blog:

**https://notes.amalpk.in**

The site publishes practical notes and writeups about application security,
penetration testing, Android security, vulnerability research, and Hack The Box.
The portfolio is available at **https://amalpk.in**.

## Features

- Astro static site with Markdown and MDX content
- Responsive light and dark themes
- Pagefind static search
- Collection and tag directories
- Table of contents for long posts
- RSS feed and sitemap generation
- Open Graph images generated with Satori and Sharp
- JSON-LD structured data for the site and articles
- Google Analytics 4 and Google Tag Manager integration
- Cloudflare Pages deployment

## Tech stack

- [Astro](https://astro.build/)
- [AstroPaper](https://github.com/satnaing/astro-paper)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Pagefind](https://pagefind.app/)
- [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

## Project structure

```text
/
├── public/
│   ├── images/posts/       # Images used by blog posts
│   ├── favicon.ico
│   └── default-og.jpg
├── src/
│   ├── components/
│   ├── content/posts/      # Markdown and MDX blog posts
│   ├── layouts/
│   ├── pages/
│   ├── scripts/
│   ├── styles/
│   ├── types/
│   └── utils/
├── astro-paper.config.ts   # Site, theme, analytics, and author settings
└── astro.config.ts         # Astro integrations and build settings
```

## Requirements

- Node.js `>=22.23.4`
- pnpm `10.16.1` or a compatible pnpm 10 release

## Local development

```bash
pnpm install
pnpm dev
```

The development server runs at `http://localhost:4321`.

## Useful commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Type-check, build, and index the production site |
| `pnpm preview` | Preview the production build locally |
| `pnpm astro check` | Check Astro and TypeScript diagnostics |
| `pnpm lint` | Run ESLint |
| `pnpm format:check` | Check formatting with Prettier |
| `pnpm seo:validate` | Validate generated SEO output |
| `pnpm alt:audit` | Check image alt text |
| `pnpm indexnow` | Submit built site URLs to IndexNow |

## Content

Create posts in `src/content/posts/` using the existing frontmatter schema.
Post images belong in `public/images/posts/<post-slug>/`. Run `pnpm build`
before publishing to verify content, generated images, search indexing, and
metadata.

## Deployment

The production site is deployed through Cloudflare Pages from the `main`
branch of the `0xKrat0s/amalpk-notes` repository.

For a local production check:

```bash
pnpm build
pnpm preview
```

After a new post is deployed, submit its URL to IndexNow:

```bash
pnpm indexnow https://notes.amalpk.in/posts/my-new-post/
```

To submit every URL in the latest built sitemap:

```bash
pnpm build
pnpm indexnow
```

## Attribution and license

This project is a customized personal blog built from
[AstroPaper](https://github.com/satnaing/astro-paper), created and maintained by
[satnaing](https://github.com/satnaing). AstroPaper's original MIT license and
attribution are retained in this project.

The Amal PK Notes custom content, branding, configuration, and blog posts are
Copyright © 2026 Amal PK. The upstream AstroPaper code remains available under
its original MIT license.

## Contact

For feedback or security concerns, contact
[hello@amalpk.in](mailto:hello@amalpk.in).
