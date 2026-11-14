# SEO & Migration Roadmap — Amal PK (AstroPaper)

**Scope:** End-to-end search-engine migration and SEO implementation plan for moving the cybersecurity / AppSec blog from Hashnode (`https://blog.amalpk.in`, 12 posts) to this self-hosted AstroPaper repository, with the main portfolio at `https://amalpk.in`.

**Status:** Roadmap with **decisions locked** (canonical host, hosting, analytics, consent, author entity — see §0.1). Reference implementations are written against the current file structure. **No SEO features are implemented in the codebase yet** beyond what AstroPaper ships by default.

**How to use this document:** Work through the phases in order. Each item is a concrete, verifiable task with a reference implementation that matches the current file structure of this repo. Order: **Pre-Migration → On-Page & Technical → Schema & E-E-A-T → Post-Launch Monitoring**, with **Part 5** covering non-Google engines and AI search.

---

## Table of contents

1. [Part 0 — Subdomain & migration decision (`blog` vs `notes`)](#part-0--subdomain--migration-decision-blog-vs-notes)
2. [Part 1 — Pre-Migration](#part-1--pre-migration)
3. [Part 2 — On-Page & Technical Implementation](#part-2--on-page--technical-implementation)
4. [Part 3 — Schema & E-E-A-T](#part-3--schema--eeat)
5. [Part 4 — Post-Launch Monitoring](#part-4--post-launch-monitoring)
6. [Part 5 — Multi-Engine & AI Search (Bing, DuckDuckGo, Brave, Yandex, LLMs)](#part-5--multi-engine--ai-search-bing-duckduckgo-brave-yandex-llms)
7. [Appendix A — File-by-file implementation checklist](#appendix-a--file-by-file-implementation-checklist)
8. [Appendix B — Cautions](#appendix-b--cautions)

---

# Part 0 — Subdomain & migration decision (`blog` vs `notes`)

## 0.1 Recommendation

> **Decisions locked with the site owner:** canonical host **`notes.amalpk.in`**; hosting **Cloudflare Pages** (GitHub source → Cloudflare build, output `dist`); the blog keeps its **own GA4 property + GTM container** (do not recreate); **Consent Mode v2** gates analytics; E-E-A-T profiles: X, LinkedIn, GitHub, Bluesky, portfolio, plus security certifications (OSCP/CEH). Concrete settings in §0.6 and §2.10.

**Recommended: migrate directly to `notes.amalpk.in` in a single hop, now — before the Astro site goes live.**

Rationale, in order of weight:

1. **The content is not really a "blog."** The existing 12 posts are *notes, writeups, vulnerability research, Android security studies, and HackTheBox walkthroughs* — exactly what the site description already says ("Application security **notes**…"). The title bar already reads "Amal PK" with a "notes" framing. `notes.amalpk.in` is a truer, more durable brand for a technical knowledge base than `blog.amalpk.in`.
2. **You are migrating anyway.** The 301-redirect and Change-of-Address work is *sunk cost* whether the target is `blog.amalpk.in` or `notes.amalpk.in`. Doing it once, to the *final* hostname, costs the same as doing it to an interim hostname.
3. **`notes` is future-proof.** If you later add cheatsheets, methodology pages, CVE references, or a tooling index, those fit `notes` but sit awkwardly under `blog`.

**Runner-up considered and rejected: `blog.amalpk.in`.** There is no *technical* SEO advantage to `notes` — both are subdomains of `amalpk.in`, so neither has an authority edge, and the hostname change itself adds a full Change of Address. `blog` was the lowest-risk option and was rejected only because the branding fit of `notes` outweighs one clean, carefully executed move.

**The one thing you must not do:** migrate to `blog.amalpk.in` on Astro now, and then move to `notes.amalpk.in` later. That is two chained site moves. Google explicitly advises against chained redirects and multiple moves — each hop bleeds signal, and the second Change of Address cannot be filed until the first is complete. **Decide once, before cutover, and never change it again.**

### Decision matrix

| Criterion | `blog.amalpk.in` | `notes.amalpk.in` |
|---|---|---|
| Continuity with existing links/audience | ✅ Highest — zero hostname change | ⚠️ One-time hostname change |
| Brand fit for "notes/writeups/research" | ⚠️ "blog" understates the content | ✅ Strong fit |
| Migration effort | ✅ Lower (path redirect only) | ⚠️ Same effort + hostname change |
| Future-proofing (cheatsheets, methodology, CVE index) | ⚠️ Feels cramped | ✅ Natural home |
| SEO risk | ✅ Lowest | ⚠️ Slightly higher (full Change of Address) |

> **Decision:** `notes.amalpk.in`. One clean move, done once, never revisited. The matrix above is retained as the record of *why* — not as an open question.

## 0.2 Exact SEO impact of the subdomain change

Google treats a subdomain (`blog.amalpk.in`) and another subdomain (`notes.amalpk.in`) as **separate hosts but the same registrable domain (`amalpk.in`)**. Practical consequences:

- **Link equity is preserved by 301s.** Per Google's own migration documentation: *"301 and other permanent redirects don't cause a loss in PageRank."* A correctly implemented one-to-one redirect transfers ranking signal, even across hosts.
- **This is a "site move with URL changes,"** so you need (a) server-side 301s, (b) a Search Console **Change of Address** request, and (c) time. Google warns to expect **temporary ranking fluctuation for a few weeks** while it recrawls and reassigns signal. The smaller the site (12 pages), the faster this settles.
- **Do not change anything else at the same time.** Keep slugs, titles, content, and page structure as close to the Hashnode originals as possible during the move. Changing design, IA, and URLs simultaneously multiplies the crawl confusion and drags out the fluctuation. (Google: "change only one thing at a time.")
- **Both subdomains share domain-level trust.** Because `amalpk.in` is the registrable domain, links to `amalpk.in` and either subdomain can reinforce each other through normal internal linking (see §3.6). A subdomain does *not* "start from zero" if you 301 the old one.

## 0.3 URL slug matching from Hashnode

Hashnode serves custom-domain posts at:

```
https://blog.amalpk.in/<slug>
```

This AstroPaper theme serves posts at:

```
https://notes.amalpk.in/posts/<slug>/
```

There are therefore **three URL changes** to account for, not just the hostname:

| Dimension | Hashnode (old) | AstroPaper (new) |
|---|---|---|
| Host | `blog.amalpk.in` | `notes.amalpk.in` |
| Path prefix | none (root) | `/posts/` |
| Trailing slash | none | `/` (directory build format) |

**Critical implication:** your redirects must do a **path rewrite**, not just a host swap. A naive `blog.amalpk.in/* → notes.amalpk.in/*` would 404. The correct mapping is `blog.amalpk.in/<slug> → notes.amalpk.in/posts/<slug>/`.

### Build a slug map first

Generate a two-column map (old URL → new URL) for all 12 posts before touching DNS. Export the Hashnode publication JSON and read the `slug` field for each post; then confirm the corresponding file in `src/content/posts/`.

Two slug nuances already visible in this repo:

1. **Hashnode hash-suffix slugs.** `understanding-crlf-injection-and-its-exploitation-b8271d14452a.md` carries Hashnode's auto-appended hash. Keeping the filename as-is **preserves the exact old slug** (good for equity, zero redirect friction). If you instead want a clean slug, you must add a **per-slug redirect** from the hashed URL to the clean URL.
2. **Future posts.** AstroPaper derives the slug from the filename, so the filename *is* the slug. Adopt a policy: for imported posts, keep filenames identical to Hashnode slugs; for new posts, write clean `kebab-case` slugs without a hash.

### Slug map — the real 12 URLs (fetched from the live sitemap)

This list was pulled from `https://blog.amalpk.in/sitemap.xml` on 2026-11-14 and cross-checked against the 12 files in `src/content/posts/`. **They already match 1:1** — every Hashnode slug has a corresponding markdown file with the same name, so the map is a pure path rewrite with no slug decisions left to make.

| # | Old URL (Hashnode) | New URL (Astro) |
|---|---|---|
| 1 | `/cve-2025-21298` | `/posts/cve-2025-21298/` |
| 2 | `/web-cache-deception` | `/posts/web-cache-deception/` |
| 3 | `/nosql-injection` | `/posts/nosql-injection/` |
| 4 | `/host-header-injection` | `/posts/host-header-injection/` |
| 5 | `/dependency-confusion` | `/posts/dependency-confusion/` |
| 6 | `/understanding-crlf-injection-and-its-exploitation-b8271d14452a` | `/posts/understanding-crlf-injection-and-its-exploitation-b8271d14452a/` |
| 7 | `/unrested-htb` | `/posts/unrested-htb/` |
| 8 | `/cicada-hackthebox-writeup` | `/posts/cicada-hackthebox-writeup/` |
| 9 | `/caption-hackthebox-writeup` | `/posts/caption-hackthebox-writeup/` |
| 10 | `/android-burp-proxy-setup` | `/posts/android-burp-proxy-setup/` |
| 11 | `/hackthebox-fluffy-walkthrough-windows-seasonal-box` | `/posts/hackthebox-fluffy-walkthrough-windows-seasonal-box/` |
| 12 | `/introduction-to-android-security` | `/posts/introduction-to-android-security/` |

Non-post URLs that also need handling (they're in the Hashnode sitemap or are crawlable):

| Old URL | New URL | Note |
|---|---|---|
| `/` | `/` | Homepage |
| `/archive` | `/archives/` | AstroPaper's archive lives at `/archives/` |
| `/series/own-the-box-htb-series` | `/posts/` | **No series feature in AstroPaper.** Either redirect to the post index, or build a real hub page (recommended long-term, §3.10) and point it there. Do *not* 404 it — it's in the sitemap and may hold links. |
| `/tag/<tag>` | `/directory/tags/<tag>/` | Also normalize tag casing in the rule (Hashnode tags are often capitalized) |
| `/rss.xml` | `/rss.xml` | Same path, different generator |
| `/sitemap.xml` | `/sitemap-index.xml` | Sitemap moved |

**Two slug nuances that still matter:**

1. **Hashnode hash-suffix slug.** `understanding-crlf-injection-and-its-exploitation-b8271d14452a` carries Hashnode's auto-appended hash. Keeping the filename as-is **preserves the exact old slug** (zero redirect friction, no equity loss). If you later want the cleaner `/posts/understanding-crlf-injection/`, add an explicit 301 from the hashed URL — never change it without one.
2. **Future posts.** AstroPaper derives the slug from the filename, so the filename *is* the slug. Policy: imported posts keep Hashnode's exact slug; new posts use clean `kebab-case` with no hash.

> **Cross-check before cutover:** Hashnode's sitemap lists 12 posts + `/` + `/archive` + one series page. If the Hashnode dashboard shows any post *missing* from that sitemap (drafts, unlisted), it won't be in this table — check the post list in the Hashnode UI, not just the sitemap.

## 0.4 301 redirect rules (reference)

> **Hosting decision (locked):** the new Astro site runs on **Cloudflare Pages**, deployed from GitHub (`pnpm build` → `dist`). That gives us both halves of the redirect story from one dashboard:
> - **New host (`notes.amalpk.in`)** — Pages project custom domain + a `public/_redirects` file for path-level rules.
> - **Old host (`blog.amalpk.in`)** — a **Cloudflare Redirect Rule** in the `amalpk.in` zone, which is the only way to 301 from a hostname whose content lives elsewhere.

### Step 1 — How `blog.amalpk.in` currently resolves

Today `blog` is a **CNAME to Hashnode** (proxied off). A Cloudflare Redirect Rule only executes on a **proxied** (orange-cloud) hostname, so the cutover sequence is:

1. New site fully live and verified on `notes.amalpk.in` (Pages custom domain, HTTPS active).
2. **Delete/replace the `blog` CNAME to Hashnode.**
3. Add `blog` as a **proxied** DNS record in the `amalpk.in` zone (Cloudflare accepts a proxied dummy `A`/`AAAA` or a proxied CNAME; the redirect rule intercepts before any origin is hit).
4. Attach the redirect rules below, ordered **specific → general**.

Do steps 2–4 in one sitting; between them `blog.amalpk.in` would fail to resolve/return 522.

### Step 2 — Redirect rules (Cloudflare → Rules → Redirect Rules)

Cloudflare evaluates rules **top to bottom**, so order them exactly like this:

| # | When | Then | Type |
|---|---|---|---|
| 1 | `http.host eq "blog.amalpk.in" and http.request.uri.path eq "/"` | `https://notes.amalpk.in/` | Static, 301 |
| 2 | `http.host eq "blog.amalpk.in" and http.request.uri.path eq "/rss.xml"` | `https://notes.amalpk.in/rss.xml` | Static, 301 |
| 3 | `http.host eq "blog.amalpk.in" and http.request.uri.path eq "/sitemap.xml"` | `https://notes.amalpk.in/sitemap-index.xml` | Static, 301 |
| 4 | `http.host eq "blog.amalpk.in" and starts_with(http.request.uri.path, "/tag/")` | `concat("https://notes.amalpk.in/directory/tags/", substring(http.request.uri.path, 5))` | Dynamic, 301 |
| 5 | `http.host eq "blog.amalpk.in" and http.request.uri.path ne "/"` | `concat("https://notes.amalpk.in/posts", http.request.uri.path, "/")` | Dynamic, 301 |

Two details that bite in practice:

- **`concat("https://notes.amalpk.in/posts/", path, "/")` produces a double slash.** `http.request.uri.path` already starts with `/` (e.g. `/cve-2025-21298`), so the prefix must be `"/posts"` with **no** trailing slash. The expression above is correct; the naive one is not.
- **Hashnode's no-trailing-slash URLs must land on trailing-slash URLs.** Rule 5 appends `/`, which matches Astro's `build.format: "directory"` output and `trailingSlash: "always"` (§2.2). Without it you'd 301 to a URL that immediately re-redirects — a two-hop chain.

**Verify with curl before filing Change of Address:**

```bash
curl -sI https://blog.amalpk.in/cve-2025-21298 | grep -iE '^(HTTP|location)'
# expect: HTTP/2 301  →  location: https://notes.amalpk.in/posts/cve-2025-21298/
```

Check all 12, plus `/`, `/rss.xml`, `/sitemap.xml`, and one `/tag/...` page.

### Step 3 — `public/_redirects` on Cloudflare Pages (new host)

Pages supports a plain-text `_redirects` file. Use it for rules that live on the **new** host (not the old one), e.g. normalizing a legacy path or preserving a slug you shortened:

```text
# public/_redirects  (Cloudflare Pages syntax: from  to  [status])
/posts/understanding-crlf-injection-and-its-exploitation-b8271d14452a  /posts/understanding-crlf-injection/  301
```

> A `_redirects` file **cannot** serve the `blog.amalpk.in` → `notes.amalpk.in` move, because requests to `blog` never reach the Pages project (different hostname, different DNS record). That's why Step 2 uses zone-level Redirect Rules. Note also that Pages caps `_redirects` at ~2,000 static rules, and the first match wins — put specific rules before wildcards.

### Rules that apply regardless of mechanism

- Use **301 (or 308)**, never 302/307 — a temporary redirect does not signal canonicalization and can keep the old URL in results.
- **One hop only.** Redirect straight to the final URL; no `blog → intermediate → notes` chains (keep chains ≤ 3, ideally 1).
- **Never bulk-redirect everything to the homepage.** That produces soft-404s and discards per-post equity.
- **Keep redirects live ≥ 1 year** (Google's minimum; indefinitely if the old domain remains registered).
- **Update the new site's canonicals to the new hostname** before/at cutover (§2.1). Leaving a canonical pointing at the old, redirecting host is a classic self-inflicted wound.
- **Don't delete the Hashnode publication** until the redirects have been live and verified for a few weeks — you may need its export, and a dead publication with no redirect is worse than a live one.

## 0.5 Google Search Console Change of Address steps

1. **Verify both properties with the same Google account:**
   - Old: `https://blog.amalpk.in` (domain-level property; it is a full host with no path, so the Change of Address tool accepts it).
   - New: `https://notes.amalpk.in`.
   - New-site verification can use the **meta tag** path already wired in this repo — set `PUBLIC_GOOGLE_SITE_VERIFICATION` (env) or `site.googleVerification` in `astro-paper.config.ts` (see §2.9). A DNS TXT record is the alternative.
2. **Deploy the 301s first.** Change of Address is filed *after* the move is live and redirects are in place; the tool runs pre-checks that confirm you own both properties and that 301s exist on a sample of pages.
3. **File the move.** In the **old** property → **Settings → Change of address** → select the **new** property → *Validate & update*.
4. **Submit the new sitemap** (`/sitemap-index.xml`) in the new property, and remove the old sitemap once the new one is live.
5. **Watch for 180 days.** The signal-forwarding and "prefer the new site" behavior lasts 180 days. Expect fluctuation for the first few weeks; monitor Page Indexing and Core Web Vitals.
6. **Keep the old domain registered ≥ 1 year** to prevent someone else registering it and impersonating your abandoned subdomain.

Additional Google site-move requirements that apply here (from the primary doc):

- **Small site → move all URLs at once.** With 12 posts, don't move in sections; Google recommends simultaneous moves for small/medium sites because it detects the move and updates the index faster.
- **Verify all variants** of both hosts (HTTP + HTTPS, `www` + non-`www`) — even if unused — so the Change of Address covers every variant of the old subdomain.
- **Set crawl rate to "Let Googlebot determine"** on both old and new properties (don't throttle during the move).
- **Expect a crawl spike:** after migration Google temporarily crawls the new site more heavily (old-site crawls get redirected to it). Your static host can absorb this, but don't be alarmed by the traffic bump.

> Note: the Change of Address tool is only for hostname changes (which this is). You do **not** need it for HTTP→HTTPS, `www` vs non-`www`, or a path-only move.

## 0.6 GTM & GA4 — reuse or recreate?

> **Status (confirmed by the owner):** the blog has its **own dedicated GA4 property** (`blog.amalpk.in` data stream, measurement ID `G-FTR1KLKNMX`) and its **own GTM container** (`GTM-5W2CRZVD`) created for that web property. The site now uses the new canonical host.

**Reuse both. Do not create a new property or a new container.** Creating new ones would:
- split your history into two properties with no way to merge them,
- reset all existing GTM history/versioning,
- and force a re-audit of every trigger and tag.

The property and container are **hostname-agnostic** — re-point them, don't rebuild them. Note Google tags use **automatic cookie domain configuration**: cookies land on the highest-level registrable domain (`amalpk.in`), so one property/container measures `blog.amalpk.in`, `notes.amalpk.in`, and `amalpk.in` without a cross-domain linker (a linker is only needed across *different root domains*).

### Exact change list at cutover

| Where | What to change | Why |
|---|---|---|
| **GA4 → Admin → Data streams → web stream (`blog.amalpk.in`) → Stream details → Edit** | Change the stream URL to `https://notes.amalpk.in` | Keeps the same property + measurement ID, so history stays continuous. The stream name can stay or be renamed to `notes.amalpk.in`. |
| **GA4 → Admin → Data streams → Configure tag settings → List unwanted referrals** | Add `amalpk.in` **and** `blog.amalpk.in` | Stops portfolio↔blog and old→new hops being logged as self-referrals (which create phantom "referral" sessions and break attribution). **Highest-impact single change.** |
| **GA4 → Data streams → Enhanced measurement** | Keep page views, scrolls, outbound clicks, site search, file downloads ON | Free engagement signals; needed for §4 monitoring. |
| **GTM → GA4 Configuration tag (`G-FTR1KLKNMX`)** | Trigger stays **All Pages**; ensure **"Send a page view event when this configuration loads"** is OFF if you handle SPA pageviews manually (see §2.10) | Avoids double-counting pageviews on `ClientRouter` navigation. |
| **GTM → any hostname-based trigger/condition** | Update `blog.amalpk.in` → `notes.amalpk.in` | Stale host filters silently stop firing tags. |
| **Google Search Console** | Add a **new** property for `notes.amalpk.in`; keep the old one for Change of Address | Analytics ≠ Search Console. Both are needed. |
| **Bing Webmaster Tools** | Import from GSC after the new property is verified (§5.2) | Unlocks Bing/Copilot/ChatGPT/DuckDuckGo. |

### Consent layer

Because analytics/GTM set cookies, **Google Consent Mode v2 must be initialized *before* the GTM snippet** (§2.10). Default everything to `denied`, then grant on banner accept. Without the default-deny block, tags can fire before the user consents — which defeats the point of the banner.

### Implementation note (this repo)

**No analytics are currently installed in the code.** You must add:
1. the Consent Mode default block,
2. the GTM snippet (`<head>` + `<noscript>` after `<body>`),
3. SPA pageview handling for `ClientRouter`.
All three are specified in §2.10.

## 0.7 Hosting: Cloudflare Pages from GitHub (Priority 0)

Yes — this repo deploys to Cloudflare Pages with no code changes. `pnpm build` already produces a static `dist/`.

**Setup (one time):**

1. Push the repo to GitHub (private is fine).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → authorise GitHub → select the repo.
3. Build settings:
   - **Framework preset:** Astro (or `None`)
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
   - **Production branch:** `main`
4. Set the Node version if the build complains — add env var `NODE_VERSION = 22` (Astro 5 needs Node ≥ 18.17; 20/22 are safe).
5. Deploy. Every push to `main` redeploys; every PR gets its own preview URL.

**Why this platform fits this migration specifically:**

| Need | Cloudflare Pages feature |
|---|---|
| Old→new 301s | Zone-level **Redirect Rules** on the `amalpk.in` zone (§0.4) |
| New-host path rules | `public/_redirects` |
| Security headers | `public/_headers` (§2.11) |
| Free TLS on the subdomain | Automatic certificate for `notes.amalpk.in` |
| Preview builds before cutover | Per-branch preview URLs (§1.7) |
| Analytics unaffected | GTM is client-side; no server dependency |

**Gotchas to plan for:**

- **`site` must already be the final URL** in `astro-paper.config.ts` before the first production build, or you'll bake `*.pages.dev` URLs into canonicals. Preview deploys will then have a canonical pointing at production — acceptable, even desirable.
- **Pagefind** runs as part of the build (`postbuild`); if you later see it fail in CI, pin the script's Node version rather than removing it.
- **Do not** enable Cloudflare's "Automatic HTTPS Rewrites" as a substitute for real 301s — it only upgrades scheme.
- Pages has a **soft limit on `_redirects`** (~2,000 rules) and **no server-side runtime** — keep the site fully static; don't add an adapter.

---

# Part 1 — Pre-Migration

Complete these **before** pointing DNS or filing Change of Address.

- [ ] **1.1 Export Hashnode data.** Download the publication JSON (and the GitHub backup `.md` files if available). Capture, per post: `slug`, `title`, `datePublished`, `updatedAt`, `tags`, `series`, `coverImage`, `canonicalUrl`, `brief`.
- [ ] **1.2 Download all images locally.** The Hashnode export contains CDN URLs (`cdn.hashnode.co`), not files. Download every cover and inline image into `public/images/posts/<slug>/`, and rewrite the Markdown. **Never leave live `cdn.hashnode.co` references** — if Hashnode purges them, your images 404.
- [ ] **1.3 Build the slug map** (§0.3) — a spreadsheet of `old URL → new URL` for all 12 posts, tag pages, and `/rss.xml` + `/sitemap.xml`.
- [ ] **1.4 Preserve dates and slugs exactly.** `pubDatetime` must match Hashnode's `datePublished`; the filename must match Hashnode's `slug` (keep the hash suffix where present). `modDatetime` should carry Hashnode's `updatedAt` only when it reflects a real update.
- [ ] **1.5 Normalize tags.** The current frontmatter contains duplicate/noisy tags (`#cybersecurity` vs `cybersecurity`, `#HackTheBox` vs `htb`). Clean them now — see §2.12 — because tag URLs become crawlable pages.
- [ ] **1.6 Set the locked hostname.** `notes.amalpk.in` is final (§0.1) — write it into `astro-paper.config.ts` *before* the first production build so no stale `astro-paper.pages.dev` URL ever ships.
- [ ] **1.7 Deploy to a staging preview** and crawl it: confirm every new URL returns 200, canonicals point at the final hostname, OG images render, and the sitemap lists only intended URLs.
- [ ] **1.8 Verify both Search Console properties** (old `blog`, new `notes`) under the same account, and add the new site's verification meta through `PUBLIC_GOOGLE_SITE_VERIFICATION` (§2.9).
- [ ] **1.9 Do not change content, design, or IA during the move.** Keep the new pages substantively identical to the Hashnode originals until the move settles.
- [ ] **1.10 Create the Cloudflare Pages project.** Workers & Pages → Create → Pages → Connect to Git → pick the repo. Build command `pnpm build`, output directory `dist`, production branch `main`. Add `notes.amalpk.in` as a custom domain and wait for the certificate to go active. Do **not** touch the `blog` DNS record yet.
- [ ] **1.11 Snapshot the old site.** Save Hashnode's sitemap, RSS, and a full list of the 12 live URLs (plus tag URLs) as the authoritative "before" state. This is your redirect map and your post-migration diff. Keep it after launch.

### Inputs status

| Needed | Status | Notes |
|---|---|---|
| **The 12 live Hashnode URLs** | ✅ **Resolved** | Fetched from `blog.amalpk.in/sitemap.xml`; full map in §0.3 |
| **Search Console ownership of `blog.amalpk.in`** | ✅ **Resolved** | Owner confirmed access — Change of Address is available |
| **Exact social handles** (GitHub, X, LinkedIn, Bluesky) | ⏳ Pending | `Person.sameAs` must resolve; wrong handles hurt entity resolution (§3.3.1) |
| **Hashnode export** (JSON or MD) | ⏳ Pending | Need it for image re-hosting and verifying `updatedAt` (§1.1–1.2) |

Remaining blockers are content/asset tasks, not decisions. Nothing in the plan is waiting on a choice from you.

---

# Part 2 — On-Page & Technical Implementation

## 2.1 Canonical domain (Priority 0)

`astro-paper.config.ts` currently ships `https://astro-paper.pages.dev/`. This string propagates into **canonical URLs, sitemap, RSS, Open Graph, Twitter, and JSON-LD** — the most damaging single SEO bug this repo can have in production.

```ts
// astro-paper.config.ts
site: {
  url: "https://notes.amalpk.in",   // ← final hostname, one trailing-slash decision
  // ...
}
```

- Use **HTTPS**, **non-`www`**, and the exact hostname you committed to in Part 0.
- Confirm `astro.config.ts` uses `site: config.site.url` (it already does).
- Canonical tags already build from `Astro.url.pathname` + `Astro.site` in `Layout.astro` — correct, but only as correct as the `site` value above.
- The per-post `canonicalURL` frontmatter field exists but is optional; leave it unset unless you need to point a *specific* post at a non-default URL (e.g. a syndicated/duplicate target).

## 2.2 Trailing slash & build format (Priority 0)

AstroPaper's default `build.format: "directory"` emits `/posts/<slug>/index.html`, served with a trailing slash. Make this explicit and consistent so canonical, sitemap, and internal links all agree:

```ts
// astro.config.ts — add
export default defineConfig({
  site: config.site.url,
  trailingSlash: "always",   // matches directory output
  // ...
});
```

Verify after deploy that requesting `/posts/<slug>` (no slash) redirects to `/posts/<slug>/`. Your redirect map (§0.4) must also produce the **trailing-slash** form, or you'll send Google two different URLs for the same page.

## 2.3 Sitemap — `lastmod` and filtering (Priority 1)

`@astrojs/sitemap` is already wired (`sitemap-index.xml` + `sitemap-0.xml`). Two improvements:

**(a) Give `lastmod` real per-page values, not the build time.** Google ignores `changefreq`/`priority`, and it *learns to distrust* `lastmod` when every URL is stamped with the same build date. Set `lastmod` per post from `modDatetime ?? pubDatetime`:

```ts
// astro.config.ts
import { getCollection } from "astro:content";
// …inside defineConfig — but note: the sitemap integration's serialize is
// called at build time; read posts here via getCollection, or precompute a map.

sitemap({
  filter: page =>
    (config.features?.showArchives !== false || !/\/archives\/?$/.test(page)) &&
    !/\/search\/?$/.test(page),                       // exclude the search page
  async serialize(item) {
    const lastmod = lastmodByPath.get(new URL(item.url).pathname);
    if (lastmod) item.lastmod = lastmod;
    return item;
  },
}),
```

Build `lastmodByPath` once from `getCollection("posts")` mapping `/posts/<slug>/` → `modDatetime ?? pubDatetime`. (Keep `changefreq`/`priority` **out** — Google ignores both.)

**(b) Exclude non-indexable pages from the sitemap:** `/search/`, any `noindex` tag/collection pages, and 404. A page that is `noindex` should not also be listed in the sitemap (contradictory signals).

## 2.4 `robots.txt` (Priority 1)

`src/pages/robots.txt.ts` already emits an allow-all + sitemap pointer. Refine it:

```txt
User-agent: *
Allow: /

# Keep the search index and any JS-rendered internals out of crawl, but
# leave them crawlable if they carry a noindex meta (robots ≠ noindex).
Disallow: /search
Disallow: /*?*

Sitemap: https://notes.amalpk.in/sitemap-index.xml
```

- **Do not block `/_astro/`** — that's where optimized CSS/JS/images live, and Google needs them to render pages.
- **Remember:** `robots.txt` blocks *crawling*, not *indexing*. To keep a page out of results, use a `noindex` meta tag (§2.7). Never use `robots.txt` as a de-indexing mechanism.

## 2.5 RSS feed (Priority 2)

`src/pages/rss.xml.ts` already emits a valid feed. Confirm the `site` hostname (§2.1) is correct, since feed item links derive from it. Optionally add a per-feed `customData` (author/category) later; it is not ranking-critical.

## 2.6 Open Graph / Twitter / dynamic OG images (Priority 1)

`Layout.astro` already emits OG + Twitter tags, and the theme ships **two** OG image paths: a default `/og.png` and a **per-post dynamic image at `/posts/<slug>/index.png`** (Satori + Sharp at build time). Two gaps remain:

**(a) Add the image dimension/type/alt tags** so platforms can lay out the card before download, and so the image is described for accessibility:

```astro
<!-- Layout.astro — after og:image -->
<meta property="og:image" content={socialImageURL} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:alt" content={description} />
<meta property="og:image:secure_url" content={socialImageURL} />
```

**(b) Fix the duplicate `og:type`.** `Layout.astro` emits `og:type=website`, and `PostLayout.astro` then emits `og:type=article`. Two `og:type` tags on one page is invalid. Either override (don't duplicate) or have `PostLayout.astro` pass a prop so only one tag renders.

**(c) Normalize X/Twitter metadata.** Use the `name="twitter:*"` form (currently `property="twitter:*"` is emitted — works, but `name=` is the standard) and add `twitter:site` / `twitter:creator` (both `@0xkratos`).

**OG image content note:** the per-post image currently renders only the title + author. For a security blog, the title is the highest-value element; optionally add the `collection` label (e.g. "Vulnerability Research") for context. Keep 1200×630, text ≥ 60px from edges.

## 2.7 `noindex` strategy for thin/low-value pages (Priority 1)

The following should carry `noindex` (while staying crawlable):

- `/search/` — Pagefind search results.
- Tag/collection **pagination beyond page 1** (thin, low value).
- Any near-empty tag pages that remain after normalization (§2.12).

There is no `noindex` plumbing in the theme today. Add a `noindex` prop to `Layout.astro` and emit `<meta name="robots" content="noindex,follow" />` when set. The search page and tag/collection pagination components should pass `noindex`.

## 2.8 Core Web Vitals (Priority 1)

Astro's static output + the theme's image pipeline already position this well. Targets (75th percentile): **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.**

- The theme **preloads** the font and inlines a theme script (good for LCP/CLS).
- Preserve intrinsic image dimensions via the Astro image pipeline to prevent CLS; the theme already optimizes to WebP.
- Watch **code-heavy** pages (Shiki syntax highlighting can add DOM weight). Long technical articles with many code blocks are the realistic LCP/INP risk.
- Test on mobile throttling + low-end Android, both themes (light/dark), and the `/directory/` + tag pages.

## 2.9 Search Console verification (Priority 0)

Wire the verification token:

```ts
// astro-paper.config.ts
site: {
  googleVerification: "…",   // OR set PUBLIC_GOOGLE_SITE_VERIFICATION env var
}
```

`src/config.ts` already reads `PUBLIC_GOOGLE_SITE_VERIFICATION` and injects the `<meta name="google-site-verification">` tag in `Layout.astro`. Prefer the env var so the token is not committed.

## 2.10 Analytics implementation (GTM + GA4 + Consent Mode v2) (Priority 1)

### 2.10.0 Why a consent banner at all? (India-heavy audience)

The owner's audience is mostly **India**. Short answer: **not strict-mandatory for an India-only audience, but ship it anyway.**

| Regime | Applies to you when | Analytics cookies need consent? |
|---|---|---|
| **India — DPDP Act 2023** | Any Indian visitor whose data you process | Consent is the default lawful basis; a lightweight notice/banner is the safe route. Rules are still phasing in, so build the habit now. |
| **EU/UK — GDPR / PECR** | **Any** EU/UK visitor, regardless of where you're based | Yes — analytics cookies are non-essential. Fines are unlikely for a personal blog, but this is the one you can't "opt out of by geography". |
| **US (CCPA/CPRA)** | California visitors, if you monetise/scale | Sale/share opt-out; analytics may qualify. A consent banner covers it. |

Practical calculus for this blog: the banner costs ~20 lines of code, doesn't hurt SEO, and prevents the situation where a single EU reader (a recruiter, a conference organiser, a researcher) lands on a site that drops cookies before consent. **Consent Mode v2 also makes GA4 behave better**: denied-consent pings still model traffic, so you don't lose all measurement.

Three pieces go into `src/layouts/Layout.astro`, in this exact order. **Consent default must be set before GTM loads.**

### 2.10.1 Consent Mode v2 default (before GTM)

```astro
<!-- Layout.astro <head> — must come BEFORE the GTM snippet -->
<script is:inline>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500,
  });
  gtag("set", "url_passthrough", true);
  gtag("set", "ads_data_redaction", true);

  // Restore a previous choice so repeat visitors aren't re-prompted.
  try {
    var saved = localStorage.getItem("consent-mode");
    if (saved === "granted") {
      gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
      });
    }
  } catch (e) {}
</script>
```

`functionality_storage`/`security_storage` stay `granted` because the theme's dark-mode toggle depends on `localStorage`.

### 2.10.2 GTM container

```astro
<!-- Layout.astro <head>, after the consent block -->
<script is:inline>
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, "script", "dataLayer", "GTM-5W2CRZVD");
</script>
```

```astro
<!-- Layout.astro <body>, immediately after the opening <body> tag -->
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-5W2CRZVD"
    height="0"
    width="0"
    style="display:none;visibility:hidden"
    title="Google Tag Manager"></iframe>
</noscript>
```

Keep GTM **`async`** and last in `<head>`. If GTM later shows up as an INP/LCP culprit, move the container behind Partytown — not before, since it complicates Consent Mode.

### 2.10.3 SPA pageviews for `ClientRouter` (critical)

`Layout.astro` uses Astro's `<ClientRouter />`, so only the first document load is a real navigation. Without handling this, **every internal click after the first is invisible to GA4.**

Recommended pattern — let Astro's event own the pageview:

```astro
<!-- Layout.astro, near the end of <body> -->
<script>
  // astro:page-load fires on the initial load AND after every ClientRouter navigation.
  document.addEventListener("astro:page-load", () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_location: location.href,
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  });
</script>
```

Then in GTM, **turn OFF** "Send a page view event when this configuration loads" on the GA4 Configuration tag, and instead create a GA4 Event tag named `page_view` triggered by the custom event `page_view`. This gives exactly one pageview per navigation — initial load included.

> Alternative (less clean): keep GTM's built-in pageview and only push on navigations. It double-counts on first load unless carefully gated, so prefer the pattern above.

### 2.10.4 Consent banner

A minimal, no-dependency banner in `Layout.astro` (or a small `ConsentBanner.astro`):

```astro
<div id="consent-banner" hidden class="…">
  <p>This site uses analytics cookies to understand what content is useful. No ads, no selling data.</p>
  <button data-consent="granted">Accept</button>
  <button data-consent="denied">Decline</button>
</div>
<script is:inline>
  (function () {
    var KEY = "consent-mode";
    var banner = document.getElementById("consent-banner");
    var stored = localStorage.getItem(KEY);
    if (!stored) banner.removeAttribute("hidden");

    function apply(state) {
      gtag("consent", "update", {
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
        analytics_storage: state,
      });
    }

    banner.addEventListener("click", function (e) {
      var choice = e.target.closest("[data-consent]");
      if (!choice) return;
      var state = choice.getAttribute("data-consent");
      localStorage.setItem(KEY, state);
      banner.setAttribute("hidden", "");
      apply(state);
      window.dataLayer.push({ event: "consent_update", consent_state: state });
    });
  })();
</script>
```

Notes:

- Use `is:inline` — a bundled `<script>` is deferred and would run after GTM, defeating the point.
- `gtag()` already exists from §2.10.1 (it pushes `arguments` into `dataLayer`), so no separate gtag.js load is needed.
- **Accepting must call `gtag("consent","update", …)`** — hiding the banner alone does nothing; consent stays denied and GA4 collects cookieless pings only.
- Persisting to `localStorage` avoids re-prompting; the §2.10.1 restore block applies the saved choice on the *next* page load, before GTM loads.

### 2.10.5 Event tracking plan

| Event | Trigger | Where it's wired | Why it matters |
|---|---|---|---|
| `page_view` | `astro:page-load` | Layout (2.10.3) | Correct SPA pageviews |
| `outbound_click` | Enhanced measurement (automatic) | GA4 admin | GitHub / NVD / MITRE / portfolio / socials — shows which citations people actually follow |
| `code_copy` | Click on the theme's existing copy button | `posts/[...slug]/index.astro` → GTM `dataLayer.push({event:'code_copy', code_language, post_slug})` | Strong "this post was useful" signal for technical readers |
| `contact_click` | `mailto:hello@amalpk.in` click | Layout/footer | Lead intent (consulting/hiring) |
| `scroll` (90%) | Enhanced measurement | GA4 admin | Read completion on long CVE/HTB walkthroughs |
| `file_download` | Enhanced measurement | GA4 admin | PDFs, PCAPs, payload samples |
| ~~newsletter~~ / ~~form_submit~~ | — | — | Skip until those features exist |

**Mark as conversions (key events):** `contact_click` only, initially. `code_copy`/`scroll` are diagnostic, not conversions.

**Test before trusting it:** use GA4 **DebugView** + GTM **Preview** mode. Navigate between 3 posts, confirm exactly 3 `page_view` events and no duplicate first-load pageview. Check the consent state flips to `granted` after accepting in Tag Assistant → Consent tab.

## 2.11 Security & trust headers (Priority 2 — Cloudflare Pages `_headers`)

A security blog's own hygiene is an E-E-A-T signal (and, frankly, embarrassing if a security blog fails it). On **Cloudflare Pages** this is a single `public/_headers` file — no `vercel.json`, no server config:

```text
# public/_headers
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; frame-src https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self'
```

Notes and gotchas:

- **Start with `Content-Security-Policy-Report-Only`.** The theme uses inline scripts (theme FOUC guard, GTM, consent), Shiki-injected styles, and Pagefind's WASM — a strict enforcing CSP will break all three. Ship report-only, watch the console for a week, then flip to enforced with the real allow-list.
- **HSTS `preload`** is permanent-ish: only add it once you're certain every subdomain is HTTPS-only. `includeSubDomains` already covers `blog`/`notes`.
- **Do not** put `X-Frame-Options: DENY` if you want your OG cards or any embed to work; COOP+safe CSP is usually enough.
- Pages applies `_headers` per request at the edge, so it also covers `404.html` and the `_redirects` responses.
- Add **`public/.well-known/security.txt`** (RFC 9116) with `Contact:`, `Expires:`, `Preferred-Languages:`, and a link to your disclosure policy. Genuine trust signal in this niche, and it gives researchers a path to report issues to you.
- Cloudflare's free TLS certificate covers `notes.amalpk.in` automatically once it's a custom domain; set **SSL/TLS mode = Full (strict)** and **Always Use HTTPS = On** in the zone.

## 2.12 Tags, collections & low-value pages (Priority 1)

Current frontmatter has noisy tags. Normalize to lowercase, hash-free, singular where sensible:

| Noisy (now) | Normalized |
|---|---|
| `#cybersecurity` / `cybersecurity` | `cybersecurity` |
| `#HackTheBox` / `htb` | `hackthebox` |
| `injection` / `injection attacks` | `injection` |

- Keep the **collection** taxonomy (`application-security/web-security`, etc.) — it maps cleanly to topical clusters (§3.5).
- Remove accidental tags; keep only user-facing, valuable tags.
- After cleanup, re-evaluate tag pages: index only those with ≥ 1 post and genuine search value; `noindex` the rest.

## 2.13 Image SEO (Priority 1)

- Meaningful `alt` text on **screenshots and diagrams** (this is a screenshot-heavy niche — every CVE/HTB post has them). Use `alt=""` only for decorative images.
- Keep intrinsic dimensions (the Astro image pipeline already resizes to WebP).
- Add a text explanation next to important screenshots; never put the only evidence/instruction inside an image.
- Give diagrams/flowcharts a caption that names the technique (e.g. "HTTP request smuggling request flow").

## 2.14 Internal redirects file (Priority 0)

On **Cloudflare Pages** the mechanism is:

1. **`public/_redirects`** — catches path-level rules on `notes.amalpk.in` itself (e.g. shortening the long CRLF slug), plus any post-cutover fixes. One line per rule, 301, first match wins.
2. **Cloudflare Redirect Rules** in the `amalpk.in` zone — the only thing that can 301 the *old* `blog.amalpk.in` hostname, since those requests never reach the Pages project (§0.4, Step 2).
3. **Astro config** — `trailingSlash: "always"` + `build.format: "directory"` so the redirect targets are canonical and don't themselves redirect (§2.2).

Write the map as data (a spreadsheet or a `redirects.ts` you generate from), not by hand in the dashboard — 12 posts today, more later. Verify every rule with `curl -sI` before you file Change of Address.

---

# Part 3 — Schema & E-E-A-T

## 3.1 Use a single JSON-LD `@graph` (Priority 1)

Instead of emitting several disconnected `<script>` blocks (which risks duplicate entity definitions), emit **one** `@graph` per page with stable `@id`s and cross-references. The site-level entities (`WebSite`, `Organization`/`Person`) are defined once and referenced from page-level entities.

Current state: `PostLayout.astro` emits only a minimal `BlogPosting`. Replace it with the graph below.

```ts
// PostLayout.astro frontmatter (reference)
const siteUrl = config.site.url;
const canonical = canonicalURL ?? new URL(Astro.url.pathname, Astro.site).href;
const authorId = `${siteUrl}/#author`;
const websiteId = `${siteUrl}/#website`;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: `${siteUrl}/`,
      name: config.site.title,
      description: config.site.description,
      inLanguage: config.site.lang,
      publisher: { "@id": authorId },
    },
    {
      "@type": "Person",
      "@id": authorId,
      name: config.site.author,
      url: config.site.profile,          // https://amalpk.in
      sameAs: [
        "https://github.com/0xkratos",
        "https://x.com/0xkratos",
        "https://www.linkedin.com/in/amalpk/",
      ],
      // E-E-A-T signals:
      jobTitle: "Application Security Researcher",
      knowsAbout: [
        "Application Security",
        "Penetration Testing",
        "Vulnerability Research",
        "Web Security",
        "Mobile Security",
      ],
    },
    {
      "@type": "BlogPosting",
      "@id": `${canonical}#article`,
      headline: title ?? config.site.title,
      description,
      image: ogImage,            // ideally an array: 1x1 + 4x3 + 16x9, ≥50K pixels
      url: canonical,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      datePublished: pubDatetime?.toISOString(),
      ...(modDatetime && { dateModified: modDatetime.toISOString() }),
      author: { "@id": authorId },
      publisher: { "@id": authorId },
      isPartOf: { "@id": websiteId },
      inLanguage: config.site.lang,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Posts", item: `${siteUrl}/posts/` },
        { "@type": "ListItem", position: 3, name: title ?? "Post", item: canonical },
      ],
    },
  ],
};
```

## 3.2 `BlogPosting` vs `TechArticle`

**Use `BlogPosting` (or `Article`) — not `TechArticle` — for Google's Article rich result.**

Google's *Article structured data* documentation states Article objects must be based on `Article`, `NewsArticle`, or `BlogPosting`. `TechArticle` is a valid schema.org subtype, but it is **not** in Google's documented list for the Article rich result, so the Rich Results Test and Search Console treat it less predictably. The theme already emits `BlogPosting`, so this is the zero-risk, fully-supported choice for every post type (CVE analysis, vulnerability deep dive, tool setup, HTB/CTF walkthrough).

If you also want to signal "technical reference" to non-Google systems, note the distinction:
- **Google rich result:** `BlogPosting`/`Article` only.
- **schema.org / other consumers:** `TechArticle` exists and carries `proficiencyLevel`/`dependencies`, but it is not needed for Google, and mixing types complicates validation.

**Pick `BlogPosting` for all posts.** Keep the JSON-LD simple and identical in shape across the site.

Google's recommended Article properties to include: `author` (`Person`/`Organization`, with `name` + `url`/`sameAs`), `datePublished`, `dateModified`, `headline`, and `image`. Two gotchas from Google's docs:

1. **`author.name` must contain only the name** — no job title, no "posted by", no publisher name. Put the role in `jobTitle` and the publisher in a separate `publisher` object.
2. **`image` should be relevant content (not a logo)** and, for best results, multiple high-resolution images (≥50K pixels) in 1:1, 4:3, and 16:9.

## 3.3 Site-wide `WebSite` + `Person`/`Organization` (Priority 1)

- **`WebSite`** belongs in the site layout (or injected on every page via the graph) with the production URL + description + language.
- **`Person`** (author) should be identical wherever it appears: the graph, the byline, the About page, and the portfolio. Only include profiles you genuinely control.
- Google can understand **either `url` or `sameAs`** when disambiguating an author — use `url` for your own About page and `sameAs` for external profiles.
- Optionally add a **`SearchAction`** to `WebSite` if you enable a Sitelinks Search Box — but note Pagefind is client-side, so a SearchAction pointing at `/search?q={search_term_string}` is valid only if `/search` reads a query param. Skip unless you implement query-param search.
- On the **About page**, mark it up as `ProfilePage` + `Person` with `sameAs`, `knowsAbout`, and (if truthful) `hasCredential`/`alumniOf`. This is the strongest E-E-A-T anchor for a solo researcher.

### 3.3.1 Concrete `Person` entity (fill in the handles marked `←`)

```ts
const person = {
  "@type": "Person",
  "@id": `${siteUrl}/#author`,
  name: "Amal PK",                        // name only — no title, no handle
  url: `${siteUrl}/about/`,
  image: `${siteUrl}/avatar.jpg`,
  jobTitle: "Application Security Researcher",
  description:
    "Application security researcher writing about web, mobile, API and system security, vulnerability research, and penetration testing.",
  knowsAbout: [
    "Application Security",
    "Web Security",
    "Vulnerability Research",
    "Penetration Testing",
    "Android Security",
    "API Security",
    "Supply Chain Security",
    "Burp Suite",
  ],
  sameAs: [
    "https://amalpk.in",
    "https://github.com/0xkratos",          // ← verify exact handle
    "https://x.com/0xkratos",               // ← verify exact handle
    "https://www.linkedin.com/in/amalpk",   // ← verify exact handle
    "https://bsky.app/profile/amalpk.bsky.social", // ← replace with real handle
  ],
  hasCredential: [
    { "@type": "EducationalOccupationalCredential", name: "OSCP" },
    { "@type": "EducationalOccupationalCredential", name: "CEH" },
  ],
};
```

Rules for this block:

- **Every URL must be one you control and that resolves.** A 404 or a profile you don't own actively harms entity resolution.
- **Exact string consistency.** The name, job title, and profile URLs must match the About page, portfolio, and each external profile character-for-character. `0xKratos` ≠ `0xkratos` to a machine.
- **`hasCredential` only if truthful and verifiable** — list the issuing body if you want to be maximally safe (`recognizedBy: { "@type": "Organization", name: "OffSec" }`). Fake or expired credentials are a trust liability, not a ranking trick.
- **Place this entity once** in the site-level `@graph` (`Layout.astro`) and reference it by `@id` from `BlogPosting` and `ProfilePage` — don't redefine it per page.

## 3.4 `BreadcrumbList` (Priority 1)

The theme already renders **visible** breadcrumbs (`Breadcrumb.astro`) but emits **no** `BreadcrumbList` JSON-LD. Add it (see §3.1 graph) and keep the JSON-LD in sync with the visible trail:

- Only emit `item` entries for paths that **actually resolve** (don't fabricate intermediate pages).
- Meaningful hierarchies: Home → Posts → `<post>`; Home → Directory → Collections → `<collection>`; Home → Directory → Tags → `<tag>`; Home → About; Home → Archives.
- Do **not** emit breadcrumb markup for low-value pagination.

Validate every page with the **Rich Results Test** and **Schema Markup Validator** (see §4.4).

## 3.5 Topical authority & internal linking (Priority 1)

The existing collections already form a clean topical map:

```
application-security/web-security
application-security/vulnerability-research
application-security/supply-chain-security
android/android-security
android/burp-suite-setup
hackthebox/linux
hackthebox/windows
```

- **Create a hub/overview page for each top-level collection** (Web Security, Vulnerability Research, Android, HackTheBox) and link every post under it back to its hub.
- **Every article links to its parent collection** and to **2–4 genuinely related articles** with descriptive anchor text (e.g. "web cache poisoning vs. web cache deception").
- **Link across collections where genuinely related** (a CVE writeup ↔ a technique writeup that used it; an HTB box ↔ the CVE it exploited).
- **Link outward to primary sources** (NVD, MITRE, CISA KEV, vendor advisories) — canonical, high-authority citations reinforce trust.
- **Cross-link the blog and `amalpk.in`** (§3.6).
- **No orphan posts.** Ensure every post is reachable from at least a listing/hub within a few clicks of the homepage.

## 3.6 Cross-domain authority: `amalpk.in` ↔ blog subdomain

Same-registrable-domain reinforcement is straightforward and safe:

- **Persistent, prominent link** from `amalpk.in` (portfolio) → the blog (nav/footer), and a reciprocal link from the blog → `amalpk.in` (the site already has "visit my portfolio" in the hero + footer socials; make it a clear, labeled link).
- **Consistent identity:** same `Person` name, same `sameAs` profiles, same logo/favicon, so Google merges the entity.
- **Schema cross-reference:** the blog's `Person.url` points to `https://amalpk.in`, and the portfolio should carry a matching `Person`/`WebSite` graph pointing back (if you control that repo's head).
- **Link to *specific* relevant portfolio content**, not just the homepage (e.g. a project page ↔ the related writeup), to pass topical relevance.

Because both are under `amalpk.in`, this is entity consolidation, not "cross-domain link building" — keep it natural and avoid reciprocal-link over-optimization.

## 3.7 Cybersecurity niche content & keyword strategy (Priority 1)

Tailor each post type to its search intent:

| Content type | Primary search intent | Structure that wins |
|---|---|---|
| **CVE analysis** | "CVE-2025-XXXX" / "CVE-XXXX-XXXX exploitation" | H1 = CVE ID + affected product + vuln class; a "quick facts" box (CVE, CVSS, affected versions, disclosure date, CISA KEV status); then technical details, exploitation scenario, **detection + remediation**. Link to NVD/MITRE/vendor advisory. |
| **Vulnerability deep dive** | "how X attack works" / "X vs Y" | Define the flaw, show a minimal reproduction, walk the exploit path, end with **defensive guidance**. Use technique names in H2s (e.g. "## CRLF Injection in HTTP Headers"). |
| **Tool setup guide** | "how to set up Burp for Android" / "X tool proxy config" | Numbered steps, command blocks, screenshots with alt text, troubleshooting table. `HowTo` schema if it's strictly step-based. |
| **HTB/CTF walkthrough** | "HTB `<machine>` writeup" **and** "`<technique>` exploitation" | Title pattern: `HTB <Machine> — <CVE/technique> (<OS> <difficulty> <year>)`. Add a quick-info box (machine, OS, difficulty, retired, date, tools). Name the **technique** and **CVE** in H2s so you capture both the "spoiler" and the "learning" intents. |

Cross-cutting rules for the niche:

- **Publish fast + accurately on fresh CVEs.** Speed + correctness wins CVE SERPs; a clear, correct breakdown of a new CVE builds long-term topical trust even with low initial volume.
- **Target long-tail, high-intent strings** engineers actually search: CVE IDs, error strings, tool output, "CVE-2024-XXXX detection", "Log4Shell mitigation", "HTB easy Linux machines". Don't chase "cybersecurity" vanity terms.
- **Featured snippets:** use question-based H2s followed by a 40–60-word direct answer (paragraph snippets), or lists/tables (list snippets).
- **Code block indexing:** code is crawlable HTML (Shiki renders it server-side — good). Add context text around every code block describing what it does, since raw code alone doesn't rank and can't be excerpted meaningfully.
- **Responsible-disclosure framing:** every exploit/vuln post needs an authorization boundary ("test only in authorized environments"), a mitigation, and primary-source citations. This is both an E-E-A-T requirement and a liability control.

## 3.8 GEO / AEO: structuring for AI answer engines (Priority 1)

AI answer engines (Google AI Overviews/AI Mode, ChatGPT search, Perplexity, Copilot, Gemini, Claude) synthesize answers and **cite** source pages. The same ranking/quality systems that power classic search power most of them — so good SEO *is* good GEO — but a few structural habits materially raise your odds of being quoted and clicked:

1. **Answer-first.** Open every section (and ideally the H1/intro) with a complete 1–2 sentence answer to the implied question, then expand. AI extractors pull self-contained passages; a lead paragraph that assumes three paragraphs of context won't be quoted.
2. **Visible TL;DR.** A labeled summary block right under the H1 is the single easiest extraction target. (For this blog, make the frontmatter `description` render as a visible TL;DR card, or write one manually.)
3. **Self-contained sections of 100–300 words.** Extracted AI passages cluster at ~134–167 words. Write each H2 section so it can stand alone (define terms inline; don't rely on context from above).
4. **Snippet-style answers.** 40–60-word direct paragraphs after question-form H2s win paragraph snippets/AI Overviews; lists and tables win list snippets.
5. **Explicit facts and entities.** Define CVE IDs, tool names, and techniques in plain language at first mention; don't rely on implied context (§5.7's "single topic per URL" applies too).
6. **Cited, verifiable claims.** Outbound links to NVD/MITRE/CISA KEV/vendor advisories make your content "citation-worthy" and easier for engines to ground.

> **Reality check (from Google):** there is **no special schema, `llms.txt`, or "AEO/GEO" markup** that changes Google Search or AI Overviews. Google explicitly says `llms.txt` is ignored by Google Search. Optimizing for generative search *is* standard SEO. Treat GEO as a *content-shape* checklist, not a separate technical layer.

## 3.9 Entity SEO & the Knowledge Graph (Priority 1)

Google no longer just matches strings; it maps **entities** (Person, Organization, WebSite) in a Knowledge Graph. For a solo security researcher, the goal is to make "Amal PK" a **resolved, verifiable Person entity** — the single strongest E-E-A-T lever, and research shows pages with resolved author entities survive core updates measurably better than those with bare bylines.

- **`sameAs` is the graph plumbing.** Point the `Person` entity at every profile you genuinely control: GitHub, X, LinkedIn, plus **Wikidata (QID)**, **ORCID**, and **Google Scholar** if you have them. Each is a corroborating node Google can triangulate against.
- **Markup consistency.** The name string, credentials, and areas of expertise must match *exactly* across your site and every external profile. A claim the external web can't corroborate actively hurts entity resolution — don't invent credentials.
- **A real About page.** `ProfilePage` + `Person` with `knowsAbout`, `hasCredential`, `alumniOf`, and `worksFor`/`jobTitle` (only what's true). This is the "entity home" that anchors the graph.
- **Niche notability beats backlinks.** A Knowledge Panel / recognized entity is earned through *consistent, citable* presence — conference talks, GitHub contributions, credible bylines — not by buying links.
- **Consistent author byline on every post** (already present via `config.site.author`) linked to the About page and `amalpk.in`.

> E-E-A-T is a *framework*, not a direct ranking factor — but earning the signals behind it (original data, first-hand experience, citable identity) is what actually moves rankings. See §3.10.

## 3.10 Advanced topical authority & information gain (Priority 1)

Extends §3.5 with the mechanics that actually build authority for a small technical blog:

**Hub-and-spoke (pillar → cluster).** Your collections are the hubs. Build them out explicitly:
- A **pillar/hub page** per top-level collection (Web Security, Vulnerability Research, Android Security, HackTheBox) with a 300–500-word overview, links to *every* member article with descriptive anchor text, and an FAQ block.
- Every **spoke** (article) links up to its pillar within the first 1–2 paragraphs, then laterally to 2–4 genuinely related articles.
- Enforce a **≤3-click depth** from the homepage: Home → hub → article. (AstroPaper already keeps posts one hop from `/posts/`; hubs add one more, so you're fine.)

**Anchor text is the steering wheel.** Use descriptive, keyword-adjacent anchors (e.g. "web cache deception vs. cache poisoning"), never "click here"/"read more". Vary anchors when linking to the same target. Aim for ~5–10 internal links per 2,000 words.

**Information gain (the real "Experience").** Google rewards content that introduces *novel entities, data, and original phrases* not already present in the top-10 results. For a security blog that means: your own reproduction steps, real tool output/error strings, first-hand screenshots, "gotchas" you hit, and original analysis — not a rewrite of the vendor advisory. A page that overlaps 100% with existing results is commodity content and won't differentiate.

Google's own AI-optimization guide frames this exact idea as **"non-commodity content"** vs **"commodity content"**: a first-hand breakdown based on personal testing is non-commodity; a restatement of the vendor advisory or a generic "7 tips" list is commodity. It also warns that mass-producing thin variations to chase query fan-out violates the **scaled content abuse** policy — so write one deep, original post per topic, not many near-duplicates.

**Prevent keyword cannibalization.** Maintain a one-primary-keyword-per-URL map. Two posts targeting the same query should be merged, differentiated by intent, or one canonicalized to the other. Audit quarterly with `site:yoursite.com "keyword"`.

---

# Part 4 — Post-Launch Monitoring

- [ ] **4.1 Google Search Console** — verify both properties; submit `/sitemap-index.xml`; file Change of Address (§0.5); inspect homepage, an article, a collection page, and a tag page; confirm Google's *selected* canonical matches your intended canonical.
- [ ] **4.2 Bing Webmaster Tools** — import from GSC after verification, submit the same sitemap, and watch **Index Explorer** for "discovered but not indexed" (§5.2).
- [ ] **4.3 Indexing** — watch **Page Indexing** for the first 2–4 weeks; expect the old URLs to fade and new URLs to rise. Track "Crawled – currently not indexed" for the `noindex` pages you intentionally excluded.
- [ ] **4.4 Structured data validation** — run a sample post, the About page, and a collection page through the **Rich Results Test** and **Schema Markup Validator**; fix all errors (not just warnings). Confirm `BlogPosting` is detected (not "unrecognized type").
- [ ] **4.5 Core Web Vitals** — field data in GSC (and CrUX) + lab Lighthouse/PageSpeed on a code-heavy post, the directory, and a tag page. Fix LCP/INP regressions before scaling content. Watch INP specifically after GTM is added.
- [ ] **4.6 Redirect audit** — `curl -sI` all 12 old URLs and confirm each returns a **single 301** to the correct trailing-slash new URL (no chains, no soft-404s). Re-check at +1 week, +1 month, +3 months.
- [ ] **4.7 Analytics verification** — in GA4 DebugView: exactly one `page_view` per internal navigation (no ClientRouter duplicates), consent state flips to `granted` after accept, no self-referrals from `amalpk.in`, and one user/session across portfolio → blog.
- [ ] **4.8 Backlink hygiene** — where feasible, ask sites that linked to the old URLs to update to the new host (optional but accelerates signal consolidation).
- [ ] **4.9 Monthly cadence** — review indexing, CWV, and top queries; update old posts when tools/CVEs change (`modDatetime` only for substantive edits, never to fake freshness).
- [ ] **4.10 Multi-engine indexing** — confirm the sitemap is live and error-free in **Bing Webmaster Tools**, **Yandex Webmaster** (only if targeting RU/CIS), and that **Brave Search** is returning your pages. DuckDuckGo/Ecosia/Qwant follow Bing automatically.
- [ ] **4.11 AI citation tracking** — check Google Search Console's **Generative AI performance report** (impressions/clicks from AI Overviews & AI Mode), Bing's **Copilot citation report**, and periodically query ChatGPT/Perplexity for your target terms to see whether and how you're cited. Track share-of-voice over time; this is the GEO measurement loop.

---

# Part 5 — Multi-Engine & AI Search (Bing, DuckDuckGo, Brave, Yandex, LLMs)

Google is the largest engine, but it is no longer the only surface that matters. This part covers the rest of the ecosystem and the cheap, once-only steps to be visible everywhere.

## 5.1 The engine landscape (who indexes what)

| Engine | Index source | What you must do | Target audience fit |
|---|---|---|---|
| **Google** | Own index (`Googlebot`) | Search Console + sitemap (§4.1) | Primary — do everything |
| **Bing** | Own index (`bingbot`) | **Bing Webmaster Tools + sitemap + IndexNow** | Feeds Copilot, ChatGPT search, Yahoo, DuckDuckGo, Ecosia, Qwant |
| **DuckDuckGo** | Bing (links/images) + own crawler | Nothing — covered by Bing; don't block `DuckDuckBot` | Privacy-conscious / technical |
| **Yahoo / Ecosia / Qwant** | Bing | Nothing — covered by Bing | — |
| **Brave Search** | Own index (since 2023) | Optional: Brave Webmaster Tools (beta) + submit URL; earn real links | Privacy-minded, technical |
| **Yandex** | Own index | Yandex Webmaster (only if targeting RU/CIS) | Skip unless Eastern Europe |
| **Mojeek / Seznam / Naver / Baidu** | Own indexes | Only if targeting their markets (UK/CZ/KR/CN) | Skip for this blog |
| **AI engines** (ChatGPT, Perplexity, Copilot, Gemini, Claude) | Varies (see §5.4) | Allow the right crawlers; good structured content (§3.8) | High — technical audience |

**Bottom line:** do Google + Bing well, add IndexNow, and you're covered on ~90%+ of relevant traffic. DuckDuckGo, Ecosia, Qwant, and Yahoo are **free wins via Bing** — nothing extra to configure beyond keeping their crawlers unblocked.

## 5.2 Bing Webmaster Tools (priority #1 after Google)

Bing is the single most valuable *non-Google* action because it unlocks **Bing traffic + Copilot + ChatGPT search + DuckDuckGo/Yahoo/Ecosia/Qwant** in one move.

1. Create a **Bing Webmaster Tools** account and **import from Google Search Console** (one click — it pulls your verified property + sitemap).
2. Submit `/sitemap-index.xml`.
3. Review the **Index Explorer / Site Explorer** for crawl errors and "discovered but not indexed" pages. Bing is choosier than Google about thin/duplicate pages — a `noindex` on thin tag pages (§2.7) helps it focus crawl budget.
4. Watch the **Copilot / AI citation report** (preview, launched 2026) to see which URLs are cited in Copilot answers.

**Bing-specific guidance** (from its Webmaster Guidelines):

- IndexNow over URL submission for fresh content.
- 301 for permanent moves (matches your migration).
- `NOARCHIVE` removes a page from Copilot grounding — do **not** use it on content you want cited.
- Titles/headings: Bing historically leans on **literal, descriptive** title/heading matching more than Google — keep H1s exact and explicit (which your CVE/HTB titles already are).

## 5.3 IndexNow (instant indexing for Bing, Yandex, Naver, Seznam)

IndexNow notifies participating engines within minutes of a publish/update/delete. **Google does not participate** (keep your sitemap for Google), but one IndexNow ping fans out to Bing, Yandex, Naver, Seznam, Yep, and Amazon.

Setup (once):

1. Generate an API key (8–128 chars of letters/digits/dashes).
2. Host it at `https://notes.amalpk.in/<key>.txt` (key as the only file content, no redirect).
3. Ping on publish:

   ```text
   https://www.bing.com/indexnow?url=https://notes.amalpk.in/posts/<slug>/&key=<key>
   ```

Rules:

- Submit **only** added/updated/deleted URLs (never unchanged ones, never the whole site at once except once after migration).
- For a blog publishing ~monthly, IndexNow is optional — sitemaps suffice — but it's cheap and materially speeds Bing indexing of fresh CVE posts (where speed wins SERPs).
- Use `https://api.indexnow.org/indexnow` (same effect, fans out to all engines).
- Don't re-ping the same URL repeatedly; rate limits apply.

## 5.4 AI search engines & crawler access

Different AI engines ground on different indexes. You control eligibility primarily via **crawler access** (robots.txt) and **content shape** (§3.8).

| AI engine | Grounds on | Crawler to **allow** | Notes |
|---|---|---|---|
| **Google AI Overviews / AI Mode** | Google index | `Googlebot` (default) | Opt-out only via `Google-Extended`; no special markup needed |
| **Microsoft Copilot** | Bing index | `bingbot` | Avoid `NOARCHIVE`/`NOCACHE` on content you want cited |
| **ChatGPT search** | Bing index | `OAI-SearchBot` | Block only if you want to hide from ChatGPT |
| **Perplexity** | Own index + multi-source | `PerplexityBot` | Most citation-heavy; great target for original research/data |
| **Claude** | Brave index | `Claude-SearchBot` | Be well-indexed on Brave |
| **Gemini** | Google index | `Googlebot` / `Google-Extended` | Same index as AI Overviews |

**Recommended robots.txt additions** (allow the useful crawlers explicitly; block only training bots you object to):

```text
# AI search — allow (they cite + drive traffic)
User-agent: OAI-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: bingbot
Allow: /
User-agent: DuckDuckBot
Allow: /
User-agent: Bravebot
Allow: /
```

> Do **not** blanket-disallow AI bots in a security/technical niche — this is exactly the audience that uses ChatGPT/Perplexity/Copilot for research, and a citation is a high-value link. Only disallow a specific bot (e.g. `GPTBot`/`CCBot`/`ClaudeBot`) if you object to training use specifically — search-citation bots and training bots are **separate** user-agents.

## 5.5 `llms.txt` (optional, low-cost)

`llms.txt` is a proposed Markdown file at `/llms.txt` that summarizes your site for AI agents. **Google Search ignores it** (stated plainly by Google), and no major AI engine has confirmed it as a ranking/citation input — but ChatGPT/Claude/Perplexity/agent frameworks *do* fetch it when reasoning about a domain, and it's one cheap static file.

```markdown
# Amal PK — Application Security Notes

> Application-security notes, penetration-testing writeups, and practical
> research covering web, mobile, API, and system security. Authored by Amal PK.

## Writeups
- [CVE-2025-21298 Windows OLE RCE](https://notes.amalpk.in/posts/cve-2025-21298/): …
- [CRLF Injection deep dive](https://notes.amalpk.in/posts/…/): …

## Collections
- [Web Security](https://notes.amalpk.in/directory/collections/application-security/web-security/): …
```

Ship it only if it's accurate; it neither helps nor hurts Google ranking. Add `src/pages/llms.txt.ts` alongside `robots.txt.ts` if you want it generated from config.

## 5.6 Other engines: Yandex, Brave, Mojeek

- **Yandex Webmaster** — only if you target Russian/CIS audiences (unlikely for this blog; skip otherwise). Verify via meta tag/DNS, submit sitemap, use IndexNow.
- **Brave Search** — independent index; submit your URL via Brave Webmaster Tools (beta) or just ensure `Bravebot` isn't blocked and earn a few real links. Brave's technical/privacy audience is a good fit for AppSec.
- **Mojeek** — independent UK crawler; submit via its URL form if you want the long-tail; low priority.

## 5.7 Engine-agnostic principles (apply everywhere)

These surface repeatedly across Google, Bing, Copilot, and the AI engines — treat them as universal:

1. **Crawlable, server-rendered HTML** — Astro's static output already nails this; never hide content behind client-side JS.
2. **One canonical URL per page**, consistent sitemap/canonical/internal links, 301 (not 302) for moves.
3. **Explicit entities & facts** — define CVE IDs, tools, and techniques plainly; keep one topic per URL.
4. **Accurate, fresh content** — use `lastmod`, IndexNow, and HTTP `ETag`/validation headers to signal change.
5. **Descriptive titles/headings** with literal matching (Bing especially), alt text, and semantic HTML.
6. **Real authority signals** — internal links, external citations, and a resolvable author/entity.

---

# Appendix A — File-by-file implementation checklist

| File / console | Change | Priority |
|---|---|---|
| `astro-paper.config.ts` | `site.url` → `https://notes.amalpk.in`; set `googleVerification`/env; confirm title/description/author/profile/ogImage | 0 |
| `astro.config.ts` | add `trailingSlash: "always"`; add sitemap `filter` (search) + `serialize` (`lastmod`); confirm `site: config.site.url` | 0–1 |
| `src/layouts/Layout.astro` | fix duplicate `og:type`; add `og:image:*` tags; switch `twitter:*` to `name=`; add `twitter:site/creator`; add `noindex` prop; add **Consent Mode default → GTM head+body → `astro:page-load` pageview** (§2.10, in that order) | 0–1 |
| `src/components/ConsentBanner.astro` (new) | accept/decline UI that calls `gtag("consent","update")` + persists to `localStorage` | 1 |
| `src/layouts/PostLayout.astro` | replace minimal `BlogPosting` with single `@graph` (`WebSite` + `Person` + **`BlogPosting`** + `BreadcrumbList`); ensure one `og:type` | 1 |
| `src/pages/posts/[...slug]/index.astro` | push `code_copy` `dataLayer` event from the existing copy button; include `post_slug` | 2 |
| `src/pages/robots.txt.ts` | `Disallow: /search` and `/*?*`; allow AI search crawlers (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `bingbot`, `DuckDuckBot`, `Bravebot`); keep sitemap pointer | 1 |
| `src/pages/rss.xml.ts` | verify `site` hostname (no code change unless hostname wrong) | 2 |
| `src/pages/llms.txt.ts` (new) | generate a curated `/llms.txt` from config (optional) | 3 |
| `public/<indexnow-key>.txt` (new) | host IndexNow key file; add a publish hook/ping (§5.3) | 2 |
| `src/pages/og.png.ts` & `posts/[...slug]/index.png.ts` | optional: add collection label to card; keep 1200×630 | 2 |
| `src/pages/search.astro` | pass `noindex` | 1 |
| `src/pages/directory/**` + tag/collection pagination | pass `noindex` on page > 1 | 1 |
| `src/content/posts/*.md` | preserve slugs/dates; normalize tags; add meaningful alt text; add quick-facts box to CVE/HTB posts | 1 |
| `src/content/pages/about.md` | expand into a real E-E-A-T author page (bio, focus, credentials: OSCP/CEH, projects, links to X/LinkedIn/GitHub/Bluesky/portfolio) | 1 |
| `public/_redirects` (new) | path-level 301s on the new host (e.g. shortened CRLF slug) | 0 |
| `public/_headers` (new) | HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, **CSP report-only** first | 2 |
| `public/.well-known/security.txt` (new) | RFC 9116 disclosure contact + `Expires` | 2 |
| **Cloudflare Pages project** | connect GitHub repo, build `pnpm build`, output `dist`, custom domain `notes.amalpk.in` | 0 |
| **Cloudflare zone (`amalpk.in`)** | remove `blog` → Hashnode CNAME; make `blog` proxied; add the 5 ordered Redirect Rules (§0.4) | 0 |
| **GA4 (console)** | update data-stream URL to `notes.amalpk.in`; add unwanted referrals `amalpk.in` + `blog.amalpk.in`; verify enhanced measurement | 0 |
| **GTM (console)** | GA4 config tag fires All Pages; disable auto pageview if using §2.10.3; update any hostname condition | 0 |
| **GSC / Bing (console)** | verify `notes.amalpk.in`; submit sitemap; file Change of Address; import into Bing Webmaster Tools | 0–1 |

# Appendix B — Cautions

1. Structured data does **not** guarantee rich results or rankings.
2. `robots.txt` blocks crawling, not indexing — never use it as a `noindex`.
3. Do not change `pubDatetime`/`dateModified` to fake freshness.
4. Do not bulk-redirect old URLs to the homepage (soft-404s, lost equity).
5. Do not chain site moves (`blog → notes` twice); decide once.
6. Do not ship the `astro-paper.pages.dev` origin anywhere in production metadata.
7. Do not publish exploit detail without authorization boundaries, mitigations, and responsible-disclosure context.
8. Do not keyword-stuff titles, tags, or links; do not canonicalize unrelated pages together.
9. Do not optimize only for Lighthouse — real-user (field) CWV is what counts.
10. Validate **generated HTML**, not just source templates — crawl the built `dist/` output.
11. Keep 301s live ≥ 1 year and the old domain registered ≥ 1 year.
12. Google's migration guidance is the authority here: [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), [Change of Address](https://support.google.com/webmasters/answer/9370220), [301 redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects).
13. Do not buy into "AEO/GEO hacks" — there is no special schema, `llms.txt`, or markup that changes Google Search/AI Overviews; optimize for *search* and let AI follow. `llms.txt` is a cheap optional, not a ranking lever.
14. Distinguish **search-citation bots** (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`) from **training bots** (`GPTBot`, `CCBot`, `ClaudeBot`, `Google-Extended`). Blocking the former removes you from AI answers; blocking the latter only opts you out of training. Block each intentionally.
15. IndexNow does not rank pages and does not reach Google — keep the sitemap for Google regardless.
16. Bing/DDG/Brave won't fix thin content; if a page is "discovered but not indexed" on Bing, make the page more substantial and interlink it — don't just re-submit it.
