# SEO Implementation Tracker — Amal PK Blog

Tracks the execution of [`SEO-RESEARCH-REPORT.md`](./SEO-RESEARCH-REPORT.md).
**Legend:** ✅ done & verified · 🟡 done, needs manual step · ⬜ not started · ⛔ blocked

Last updated: 2026-11-14

---

## Milestone overview

| # | Milestone | Status | Verified by |
|---|---|---|---|
| M0 | Source of truth: identity, socials, URL inventory | ✅ | `amalpk.in` + `blog.amalpk.in/sitemap.xml` |
| M1 | Canonical host + build config | ✅ | build + generated HTML |
| M2 | Head, meta, Open Graph, canonicals | ✅ | generated HTML |
| M3 | Analytics: GTM + GA4 + Consent Mode v2 | ✅ | build + code review |
| M4 | Structured data (`@graph`) + breadcrumbs + entity | ✅ | JSON parse of `dist/` |
| M5 | Crawl: robots, sitemap, RSS, llms.txt, IndexNow | ✅ | `dist/robots.txt`, `dist/sitemap-0.xml` |
| M6 | Hosting files: `_redirects`, `_headers`, `security.txt` | ✅ | files in `dist/` |
| M7 | Content & E-E-A-T: portfolio, tags, image alt | 🟡 | Portfolio linked, tags normalized, alt text complete; pillar content intentionally deferred |
| M8 | Validation & automated checks | ✅ local | `npm run build` + `npm run seo:validate` |
| M9 | Launch: DNS, redirects, dashboards, index | ⬜ manual | see table at the bottom |

**Manual (dashboard/DNS) work is listed at the bottom** — those can't be done from code.
Remaining content work (contextual internal links and optional pillar pages) is
tracked in `SEO-RESEARCH-REPORT.md`.

---

## M0 — Source of truth ✅

Pulled from `https://amalpk.in`:

| Item | Value |
|---|---|
| Name | Amal PK |
| Role | Application Security Analyst (VAPT) |
| Location | Kerala, India |
| Portfolio | https://amalpk.in |
| GitHub | https://github.com/0xkratos |
| X | https://x.com/0xkratos |
| LinkedIn | https://www.linkedin.com/in/amalpk/ |
| Bluesky | https://bsky.app/profile/0xkratos.bsky.social |
| Email | hello@amalpk.in |
| Certs | BSCP, CEH, CAP, CNSP, CPT, CBP, HTB Pro Labs (Dante, P.O.O) |
| Recognition | NASA HoF 2022, Lenovo HoF 2024, CERT-EU HoF 2025, GEA HoF 2024 |
| Employer | HackIT Technology & Advisory Services (Security Analyst, Jan 2025–) |
| Community | ISRA — Chapter Coordinator (Feb 2025–) |

12 live post URLs captured (see `SEO-RESEARCH-REPORT.md` §0.3).

---

## M1 — Canonical host + build config ✅

- [x] `astro-paper.config.ts`: `site.url` → `https://notes.amalpk.in`
- [x] `astro.config.ts`: `trailingSlash: "always"`
- [x] Sitemap: exclude `/search/` and paginated pages
- [x] Sitemap: real per-post `lastmod` (scanned from frontmatter at build time)
- [x] `authorJobTitle` / `authorKnowsAbout` for the Person entity
- [x] Bluesky social + icon
- [x] Analytics config block (`gtmId`, `consentBanner`)

## M2 — Head, meta, Open Graph ✅

- [x] Removed duplicate `og:type` (Layout vs PostLayout)
- [x] Per-page `ogType` (`website` / `article`)
- [x] `og:image:alt`, `og:locale`, `og:site_name`
- [x] `twitter:*` → `name=` + `twitter:site` / `twitter:creator`
- [x] Default robots meta (`index, follow, max-image-preview:large…`)
- [x] `noindex, follow` prop, wired into search + paginated pages + 404

## M3 — Analytics ✅

- [x] Consent Mode v2 default-deny, before GTM
- [x] Restore saved consent without re-prompting
- [x] GTM container `GTM-NM9H7KF4` (head + noscript)
- [x] `astro:page-load` pageview for `ClientRouter` (no double counting)
- [x] Consent banner component (accept/decline → `gtag consent update`)
- [x] `code_copy` event on the existing copy button
- [x] Scripts extracted to `AnalyticsHead.astro` / `AnalyticsBody.astro`
      (inline `<script>` inside an Astro conditional breaks the Prettier parser)
- [ ] GA4 dashboard: stream URL, referral exclusions, built-in pageview off → **manual**

## M4 — Structured data ✅

- [x] Single `@graph` per page (Layout builds base, pages append)
- [x] `WebSite` + `Person` (with `sameAs`, `knowsAbout`, `jobTitle`)
- [x] `BlogPosting` with author/publisher `@id` refs, dates, `keywords`, `articleSection`
- [x] Visible breadcrumbs + matching `BreadcrumbList` for posts
- [x] Person entity links to the external portfolio
- [x] `<` escaped in JSON-LD payload

## M5 — Crawl ✅

- [x] `robots.txt`: allow crawlers to read page-level `noindex`, allow AI search crawlers, sitemap pointer
- [x] Query-string URLs remain crawlable so page-level robots directives can be read
- [x] Site timezone set to `Asia/Kolkata` for Kerala, India
- [x] Sitemap filter + `lastmod`
- [x] `llms.txt` generated from the post collection
- [x] IndexNow key file + ping script
- [x] RSS unchanged (inherits new `site.url`)

## M6 — Hosting files ✅

- [x] `public/_headers` (HSTS, nosniff, referrer, permissions, CSP report-only)
- [x] `public/_redirects` (12 legacy post slugs + listing pages, 301)
- [x] `dist/.well-known/security.txt` — written post-build by `copy-pagefind.mjs`
      (Vite's public-dir copy silently skips dot-directories, so it cannot live
      in `public/`; a stray copy also landed at `dist/security.txt` before)
- [ ] Zone-level 301s on `blog.amalpk.in` → **manual (Cloudflare dashboard)**

## M7 — Content & E-E-A-T 🟡

- [x] Portfolio linked as the author profile
- [x] Tag normalization (lowercase, no `#`, deduped)
- [x] Visible **TL;DR** on every post (renders the frontmatter `description`)
- [x] **"Part of `<collection>`"** link on every post → the collection hub
- [x] **Related posts** at the end of every article — scored by shared tags (×3),
      same collection (+4), same top-level collection (+1); max 3
- [x] Two truncated `description` fields completed (CVE-2025-21298, HTB Fluffy)
- [x] Image `alt` text for screenshots → `IMAGE-ALT-TODO.md` reports 0 remaining items
- [ ] Pillar/hub copy per collection → **intentionally deferred**
- [x] `security.txt` contact

## M8 — Validation ✅ (local)

- [x] `astro check` → **0 errors, 0 warnings**
- [x] Full build → **60 pages** in ~8s (local)
- [x] Generated HTML: canonical host, exactly one `og:type`, robots meta, one `@graph`
- [x] Lint and formatting checks pass
- [x] JSON-LD parses (all sampled pages), `BlogPosting` + `BreadcrumbList` present
- [x] Sitemap: 54 URLs, **12 with `lastmod`**, `/search/` and page 2+ excluded
- [x] `robots.txt`, `llms.txt`, `rss.xml` use `notes.amalpk.in`
- [x] No `astro-paper.pages.dev` string anywhere in `dist/`
- [x] `_headers`, `_redirects`, IndexNow key, `.well-known/security.txt` present in `dist/`
- [x] `npm run seo:validate` → **all checks passed** (see script below)
- [ ] Rich Results Test + Schema Validator on live URLs → **manual, post-deploy**
- [ ] GSC + Bing verification + Change of Address → **manual, post-deploy**

### Verification log (re-run any time)

```bash
npm run build
npm run seo:validate   # canonical host, single og:type, robots, JSON-LD,
                       # sitemap exclusions + 12 lastmods, hosting files
npm run alt:audit      # regenerates IMAGE-ALT-TODO.md
npm run indexnow       # after deploy: pings every post URL from the sitemap
```

### Files added / changed

| File | What |
|---|---|
| `astro-paper.config.ts` | canonical host, author entity fields, Bluesky, analytics block |
| `astro.config.ts` | `trailingSlash`, sitemap filter + `lastmod` |
| `scripts/post-dates.mjs` | frontmatter date scan for the sitemap |
| `scripts/indexnow.mjs` | IndexNow ping (manual or CI) |
| `scripts/alt-audit.mjs` | generates `IMAGE-ALT-TODO.md` |
| `scripts/validate-seo.mjs` | post-build SEO assertions (`npm run seo:validate`) |
| `copy-pagefind.mjs` | pagefind copy + emits `dist/.well-known/security.txt` |
| `package.json` | `indexnow`, `alt:audit`, `seo:validate` scripts |
| `src/types/config.ts`, `src/config.ts` | analytics + author fields |
| `src/layouts/Layout.astro` | meta/OG/Twitter/robots, consent + GTM, `@graph` |
| `src/layouts/PostLayout.astro` | `BlogPosting` + `BreadcrumbList` |
| `src/components/ConsentBanner.astro` | consent UI |
| `src/components/AnalyticsHead.astro` | Consent Mode v2 defaults + GTM loader |
| `src/components/AnalyticsBody.astro` | GTM noscript + `astro:page-load` pageview |
| `src/pages/robots.txt.ts` | AI crawlers + disallows |
| `src/pages/llms.txt.ts` | generated site map for AI agents |
| `https://amalpk.in/` | External portfolio and author profile |
| `src/pages/search.astro`, `404.astro`, listing pages | `noindex` |
| `src/pages/posts/[...slug]/index.astro` | `code_copy` event, TL;DR, collection link, related-post scoring |
| `src/components/RelatedPosts.astro` | related-posts block |
| `src/content/posts/*.md` | normalized tags |
| `src/assets/icons/socials/bluesky.svg` | social icon |
| `public/_headers`, `public/_redirects` | hosting files |
| `public/43761e1fb96ba1b61b81edb8a0dde5d9.txt` | IndexNow key |
| **Deleted** `public/.well-known/security.txt` | moved to post-build (Vite skips dot-dirs) |

---

## Manual work (cannot be done in code)

| # | Task | Where | Blocked by |
|---|---|---|---|
| 1 | Cloudflare Pages project + custom domain | Cloudflare dashboard | repo on GitHub |
| 2 | Remove `blog` → Hashnode CNAME, proxy it | Cloudflare DNS | new site live |
| 3 | Add 5 Redirect Rules for the old host | Cloudflare Rules | #2 |
| 4 | GA4 stream URL + referral exclusions | GA4 admin | cutover |
| 5 | GTM: disable built-in pageview, publish | GTM | code deployed |
| 6 | Verify `notes.amalpk.in` in GSC, submit sitemap | GSC | new site live |
| 7 | Change of Address (old → new) | GSC | #3 + #6 |
| 8 | Bing Webmaster Tools import | Bing | #6 |
| 9 | Rich Results Test + Schema Validator | validator.schema.org | deploy |
| 10 | Update the 3 blog links on `amalpk.in` to `notes.` | portfolio repo | deploy |

### 1. Cloudflare Pages (do this first)

- **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.
- Build command: `pnpm build` (the `build` script already runs `astro check`,
  `astro build`, Pagefind, and the `security.txt` writer). Output directory: `dist`.
- Env: `NODE_VERSION=22.23.4`. Optional: `PUBLIC_GOOGLE_SITE_VERIFICATION=<token>` from GSC
  (or put the token in `site.googleVerification` in `astro-paper.config.ts`).
- **Custom domains → Set up a domain** → `notes.amalpk.in` (Cloudflare creates the CNAME).
- `public/_headers` and `public/_redirects` are picked up automatically per deploy.

### 2–3. Old host: DNS + the 5 Redirect Rules

Put these in the **`amalpk.in` zone → Rules → Redirect Rules**, in this order
(first match wins; rule 5 is the catch-all, so it must be last):

| # | When | Target | Type |
|---|---|---|---|
| 1 | `http.host eq "blog.amalpk.in" and http.request.uri.path eq "/"` | `https://notes.amalpk.in/` | Static 301 |
| 2 | `http.host eq "blog.amalpk.in" and http.request.uri.path eq "/rss.xml"` | `https://notes.amalpk.in/rss.xml` | Static 301 |
| 3 | `http.host eq "blog.amalpk.in" and http.request.uri.path eq "/sitemap.xml"` | `https://notes.amalpk.in/sitemap-index.xml` | Static 301 |
| 4 | `http.host eq "blog.amalpk.in" and starts_with(http.request.uri.path, "/tag/")` | `concat("https://notes.amalpk.in/directory/tags/", substring(http.request.uri.path, 5))` | Dynamic 301 |
| 5 | `http.host eq "blog.amalpk.in" and http.request.uri.path ne "/"` | `concat("https://notes.amalpk.in/posts", http.request.uri.path, "/")` | Dynamic 301 |

Then remove the existing `blog` CNAME that points at Hashnode and make the record
**proxied** (orange cloud), otherwise the rules never run.

Verify:

```bash
curl -sI https://blog.amalpk.in/cve-2025-21298 | grep -iE '^(HTTP|location)'
# expect: 301 → https://notes.amalpk.in/posts/cve-2025-21298/
```

### 4. GA4 (existing property — do not create a new one)

- **Admin → Data streams → web stream → Stream details → Edit**: URL →
  `https://notes.amalpk.in`. Measurement ID `G-FTR1KLKNMX` stays the same, so history is continuous.
- **Admin → Data streams → Configure tag settings → List unwanted referrals**: add
  `amalpk.in` **and** `blog.amalpk.in` (this is the highest-impact change; without it
  the old→new hops and portfolio→blog clicks log as referral traffic).
- Check **Enhanced measurement** is on (page views are sent manually — see GTM below).

### 5. GTM (`GTM-NM9H7KF4`)

- The GA4 config tag's **"Send a page view event when this configuration loads"**
  must be **off** — `Layout.astro` pushes a `page_view` on every `astro:page-load`,
  and leaving both on double-counts.
- Any trigger/condition that filters on hostname `blog.amalpk.in` → change to
  `notes.amalpk.in`; stale host filters stop firing silently.
- **Submit → Publish**.

### 6–8. Search Console / Bing

- Verify `notes.amalpk.in` (Domain property if the DNS is in Cloudflare — easiest),
  submit `https://notes.amalpk.in/sitemap-index.xml`.
- After the 301s are live and the new host is indexed: **Settings → Change of
  Address** on the `blog.amalpk.in` property → `notes.amalpk.in`.
- Bing Webmaster Tools → **Import from Google Search Console**.
- Run `npm run indexnow` once the site is live (pings every URL in the sitemap).

### 9–10. Post-deploy polish

- Rich Results Test on one post and `/` → expect `BlogPosting`,
  `BreadcrumbList`, `Person`, `WebSite`, zero errors.
- Update the three blog links on `amalpk.in` to the `notes.` host. Any remaining
  `blog.amalpk.in` links elsewhere are fine — the 301s catch them.

---

## Remaining content work (editorial — cannot be auto-generated honestly)

Code is ready for these; the writing is yours.

| # | Item | Why it matters | Where |
|---|---|---|---|
| 1 | **Pillar/hub copy** — 300–500 words per top-level collection (Web Security, Vulnerability Research, Android, HackTheBox) + a short FAQ | §3.10 hub-and-spoke; the listing pages are thin without it | `src/pages/directory/collections/…` |
| 2 | **Image alt text** (26 images) | §2.13 image SEO + accessibility | `IMAGE-ALT-TODO.md` |
| 3 | **Quick-facts boxes** on CVE/HTB posts (CVE, CVSS, affected versions, KEV status; machine, OS, difficulty) | §3.7 — wins the `CVE-…` and `HTB <machine>` SERPs | post frontmatter/body |
| 4 | **Outbound primary sources** — NVD/MITRE/CISA KEV/vendor advisories | §3.7, §3.10 information gain | post bodies |
| 5 | **One primary keyword per URL** map; merge/differentiate overlaps | §3.10 cannibalization guard | planning doc |
| 6 | **Answer-first intros** — first paragraph answers the implied question | §3.8 AI extraction | post bodies |

Already automated: related-post links, collection hub links, visible TL;DR,
breadcrumbs, `BlogPosting`/`BreadcrumbList`/`Person` JSON-LD,
sitemap `lastmod`, `robots.txt`, `llms.txt`, IndexNow, consent + analytics.
