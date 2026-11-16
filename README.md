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

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Start the development server                     |
| `pnpm build`        | Type-check, build, and index the production site |
| `pnpm preview`      | Preview the production build locally             |
| `pnpm astro check`  | Check Astro and TypeScript diagnostics           |
| `pnpm lint`         | Run ESLint                                       |
| `pnpm format:check` | Check formatting with Prettier                   |
| `pnpm seo:validate` | Validate generated SEO output                    |
| `pnpm alt:audit`    | Check image alt text                             |
| `pnpm indexnow`     | Submit built site URLs to IndexNow               |

## Content

### Create a new post

From the repository root:

```bash
mkdir -p src/content/posts
touch src/content/posts/my-new-post.md
mkdir -p public/images/posts/my-new-post
```

Add this frontmatter at the top of the Markdown file:

```yaml
---
author: Amal PK
pubDatetime: 2026-11-15T10:00:00+05:30
title: "Your Post Title"
draft: false
tags:
  - cybersecurity
  - web security
description: "A short, useful summary of the post."
collection: application-security/web-security
---
```

Write the article below the frontmatter:

```md
# Your Post Title

Introduction paragraph.

## First Section

Your content here.

![Descriptive alt text](/images/posts/my-new-post/example.png)
```

Store post images in:

```text
public/images/posts/<post-slug>/
```

Use descriptive alt text for every meaningful image. Keep `draft: true` while
working on an unpublished post, then change it to `draft: false` when ready.

### Update an existing post

Keep the original `pubDatetime` and add or update `modDatetime`:

```yaml
pubDatetime: 2025-01-29T18:30:00.000Z
modDatetime: 2026-11-15T10:30:00+05:30
```

### Develop and preview

```bash
pnpm install                 # Install dependencies, first time only
pnpm dev                     # Start http://localhost:4321
pnpm preview                 # Preview the latest production build
```

### Validate before publishing

Run these commands after creating or editing a post:

```bash
pnpm format:check            # Check Prettier formatting
pnpm lint                    # Run ESLint
pnpm astro check             # Check Astro and TypeScript diagnostics
pnpm alt:audit               # Check image alt text
pnpm seo:validate            # Validate generated SEO output
pnpm build                   # Full production build and Pagefind indexing
```

If formatting needs correction:

```bash
pnpm format
```

### Commit and publish

Check the changed files, commit them, and push to GitHub:

```bash
git status
git add src/content/posts/my-new-post.md public/images/posts/my-new-post/
git commit -m "content: add my new post"
git push origin main
```

Cloudflare Pages automatically deploys the `main` branch after the push.

### Notify IndexNow

After deployment, submit the new or updated URL:

```bash
pnpm indexnow https://notes.amalpk.in/posts/my-new-post/
```

To submit every URL in the latest generated sitemap:

```bash
pnpm build
pnpm indexnow
```

## Deployment

The production site is deployed through Cloudflare Pages from the `main`
branch of the `0xKrat0s/amalpk-notes` repository.

For a local production check:

```bash
pnpm build
pnpm preview
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
