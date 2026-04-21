# CDMX v6 — Pre-Deploy Audit Report

Generated: 2026-04-21
Commit audited: `96f630d` (HEAD before audit commit; task referenced `3f76635` but two newer commits exist: `1cd2703`, `96f630d`).
Auditor: pre-deploy audit engineer (Task 41).

---

## Executive summary

**Status: NEEDS ACTION (2 deploy-blockers + 1 SEO gap)**

v6 is structurally ready. All routes return 200, HTML is well-formed, JSON-LD is valid, viewport meta is present everywhere, reduced-motion is handled comprehensively, and the leak-check only surfaces acceptable brand-essence strings. Two must-fix items remain before cutover:

1. `REPLACE_BEFORE_DEPLOY` in Formspree endpoint (contact form POST target).
2. `REPLACE_SUBDOMAIN` in `assets/js/llm-completion.js` (worker URL placeholder).

Additionally, canonical links are missing on `/contact/`, `/lab/`, `/404.html`, and `/brand-guidelines.html` — minor SEO hygiene.

Dead orbital JS (from the orbital→cpu-architecture swap, Task 34) was removed as part of this audit (81 lines, ~3.9 KB).

---

## Launch go/no-go checklist

- [x] **(a) Leak-check passes (or only acceptable hits)** — PASS (with caveats). Only 2 deploy-blockers among the 16 hits (see below); the rest are intentional brand essence (Bruges, Renke Pieters, €2M+, 18 months).
- [x] **(b) All routes return 200** — PASS. 11/11 routes healthy: `/`, `/contact/`, `/lab/`, `/lab/data.json`, `/404.html`, `/brand-guidelines.html`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/og-image.jpg`, `/favicon.svg`.
- [x] **(c) No broken internal links** — PASS. Python link-walker over all 5 HTML pages found 0 non-200 internal references.
- [x] **(d) JSON-LD valid** — PASS. 1 `<script type="application/ld+json">` block in `index.html`; parses cleanly; `@graph` has 7 entries (ProfessionalService, Person, WebSite, WebPage, BreadcrumbList, Service, FAQPage).
- [x] **(e) Mobile viewport meta on all pages** — PASS. All 5 HTML pages declare `name="viewport" content="width=device-width, initial-scale=1"` (homepage uses `1.0`; others use `1` — equivalent).
- [x] **(f) Reduced-motion handled** — PASS. 9 `prefers-reduced-motion` references in `index.html` + 1 each in `lab.css` and `tokens.css`. Covers animation and canvas paths. A dedicated `assets/js/reduced-motion.js` module exists and is imported by `substrate.js` and `lab-canvas.js`.
- [ ] **(g) No REPLACE_* placeholders remaining** — **FAIL (blocker).** Two genuine placeholders remain:
  - `index.html:3605` — Formspree action URL.
  - `assets/js/llm-completion.js:4` — Worker subdomain. NOTE: this JS file is not imported anywhere; it's effectively orphan, but the placeholder trips the leak-check.
- [x] **(h) Homepage payload reasonable (< 500 kB)** — PASS. Total synchronous payload ≈ **246 KB** (HTML 211 KB inlined + font 31 KB + logo 1.7 KB + favicon 272 B). GSAP/ScrollTrigger/Lenis load via CDN (defer). Photo `renke-pieters.jpg` (79 KB) is `loading="lazy"`. Grand total v6 tree is 1.4 MB (mostly background PNG patterns at 104 KB each).
- [ ] **(i) Launch success metric defined** — MANUAL (Renke). See "Recommended success metrics" below.
- [ ] **(j) Mobile device physical test** — MANUAL (Renke). Physically verify on iPhone + Android; check unlock-gate, substrate canvas on /contact, CPU-diagram interactions, expertise switcher, letter-fill scrubber, form submit flow.

Legend: `[x]` PASS  `[ ]` FAIL/MANUAL

---

## Detailed findings

### 1. Leak-check

Ran `./scripts/leak-check.sh .`. Exit 1 with 16 hits. Classification:

| # | File:line | Hit | Classification |
|---|---|---|---|
| 1 | `index.html:6` | "Bruges, Belgium" in `<title>` | (a) Acceptable — brand essence, intentional geo-anchor |
| 2 | `index.html:16` | "Bruges, Belgium" in og:title | (a) Acceptable |
| 3 | `index.html:59` | "Renke Pieters... Bruges, Belgium" in JSON-LD description | (a) Acceptable — Schema.org requires address |
| 4 | `index.html:67` | "Bruges" in addressLocality | (a) Acceptable — Schema.org |
| 5 | `index.html:115` | "Renke Pieters" in Person schema | (a) Acceptable |
| 6 | `index.html:132` | "Bruges, Belgium" in webpage name | (a) Acceptable |
| 7 | `index.html:198` | "€2M+... 18 months... 3x" in FAQ answer | (a) Acceptable — core credibility claim |
| 8 | `index.html:3446` | Renke photo alt text | (a) Acceptable |
| 9 | `index.html:3450` | `<h3>Renke Pieters</h3>` in About | (a) Acceptable |
| 10 | `index.html:3463` | "Based in Bruges, Belgium" in about ticker | (a) Acceptable |
| 11 | `index.html:3473` | Same ticker (duplicate for seamless loop) | (a) Acceptable |
| 12 | **`index.html:3605`** | **`REPLACE_BEFORE_DEPLOY` in Formspree URL** | **(b) DEPLOY BLOCKER** |
| 13 | `index.html:3662` | "Bruges, Belgium" footer badge | (a) Acceptable |
| 14 | `brand-guidelines.html:249` | "Renke Pieters. Bruges, BE." | (a) Acceptable |
| 15 | `brand-guidelines.html:664` | "renke@cdmx.be · Brugge, BE · MMXXVI" | (a) Acceptable |
| 16 | **`assets/js/llm-completion.js:4`** | **`REPLACE_SUBDOMAIN` in worker endpoint** | **(b) DEPLOY BLOCKER** |

**Action:** replace both placeholders before deploy. The leak-check pattern needs to keep flagging brand-essence hits (they help prevent accidental removal), but consider tightening to also exclude `og:title`/`title`/structured-data regions so the signal-to-noise ratio improves.

### 2. Payload + asset inventory

Byte-exact sizes (wc -c):

| Asset | Bytes | Notes |
|---|---:|---|
| `index.html` | 215,916 | After orbital-JS removal (was 219,876 — saved 3,960 B) |
| `contact/index.html` | ~8,000 | |
| `lab/index.html` | ~4,000 | |
| `404.html` | ~4,000 | |
| `brand-guidelines.html` | 44 KB | Not linked from homepage; internal |
| `assets/fonts/HankenGrotesk-Variable.woff2` | 31,748 | |
| `assets/css/*.css` | 5,138 + 7,127 + 27,521 + 8,192 | `manifest.css` is the largest (28 KB) but NOT referenced anywhere — orphan |
| `assets/js/*.js` (21 files, total ~100 KB) | — | See orphan analysis below |
| `assets/renke-pieters.jpg` | 78,957 | `loading="lazy"` |
| `og-image.jpg` | 81,238 | |
| `favicon.svg` | 272 | |
| `assets/logos/CDMX-Logo.svg` | 1,756 | |
| `assets/patterns/*.png` (6 files × 104 KB) | 624 KB | Only loaded if referenced; spot-check shows none currently referenced from HTML |

**Homepage synchronous payload (what the browser actually requests on first paint):**
- HTML: 215,916 B
- Preloaded font: 31,748 B
- Favicon: 272 B
- Logo SVG: 1,756 B
- **Sub-total: ~249 KB** (well under 500 KB budget)

External CDN (deferred): GSAP 3.12.7 + ScrollTrigger + Lenis 1.1.18 from jsdelivr/unpkg. These do NOT count against first-paint but add ~70 KB transfer once parsed.

Google Fonts CSS is preloaded, fonts are woff2 subset — no render-block.

**Budget verdict: PASS.** Homepage comfortably under 500 KB.

### 3. JS syntax + module checks

Ran `node --check` on all 22 JS files (21 in `assets/js/` + 1 in `worker/src/`). **All 22 files parse cleanly.**

#### JS usage/orphan map

Only `main.js` is referenced as a `<script>`, and only from `/lab/index.html` and `/contact/index.html`. The homepage (`index.html`) inlines all its JS inside `<script>` tags and loads no external `assets/js/*` files.

| Status | Files |
|---|---|
| **Imported via main.js static chain (load on /lab + /contact)** | `main.js`, `boot.js`, `cursor-trail.js`, `readout.js`, `altitude-nav.js`, `puzzle.js`, `tilt-x.js`, `tweak-panel.js`, `hero-parallax.js`, `reveal.js` |
| **Imported lazy from main.js** | `lab-canvas.js` (via `/lab`), `substrate.js` (via `/contact`) |
| **Transitively imported** | `reduced-motion.js` (imported by lab-canvas + substrate) |
| **Orphan — never imported, safe to delete** | `cpu-diagram.js`, `llm-completion.js`, `marquee.js`, `organism.js`, `parallax.js`, `services-modal.js`, `sigil.js`, `text-reveal.js` |

> Note: `main.js` has a `page === 'manifest'` branch that imports 9 modules. No page sets `data-page="manifest"` — the homepage doesn't even load `main.js`. So several of the "statically imported" files (`boot.js`, `cursor-trail.js`, `readout.js`, `altitude-nav.js`, `puzzle.js`, `tilt-x.js`, `tweak-panel.js`, `hero-parallax.js`, `reveal.js`) load on `/lab` and `/contact` but their exports (`startBoot`, `startCursorTrail`, etc.) only run when the DOM has the expected mount points — which contact/lab don't have. These are functionally dead but add ~30-40 KB download on those 2 sub-pages. Not deploy-blocking.

#### Orphan orbital JS (cpu-architecture leftover)

Task 34 replaced the orbital timeline with a CPU architecture diagram but left the orbital JS in `index.html`. **Removed in this audit** (lines 4361–4440, 80 lines, 3,960 bytes). No HTML elements used `.orbital-*` classes; the JS was pure dead code. CSS rules for `.orbital-*` remain in `index.html` (~lines 1490–1632 and ~2382–2460) — these add maybe 2–3 KB of unused CSS and should be cleaned up in a follow-up (see below).

### 4. Local HTTP route checks

All 11 tested routes return `200`:

```
200  /
200  /contact/
200  /lab/
200  /lab/data.json
200  /404.html
200  /brand-guidelines.html
200  /llms.txt
200  /robots.txt
200  /sitemap.xml
200  /og-image.jpg
200  /favicon.svg
```

### 5. Link-check + asset resolution

Script: parse every `href`/`src` across 5 HTML files, skip `http(s)://`, `mailto:`, `tel:`, `#`, `data:`, resolve relative paths, HEAD-request each. **Result: 0 broken internal links.**

### 6. Schema.org JSON-LD

1 JSON-LD block on the homepage, valid JSON. Structure:

```
@graph (7 entries)
├── [0] ProfessionalService   @id=https://cdmx.be/#organization
├── [1] Person                @id=https://cdmx.be/#person
├── [2] WebSite               @id=https://cdmx.be/#website
├── [3] WebPage               @id=https://cdmx.be/#webpage
├── [4] BreadcrumbList        @id=https://cdmx.be/#breadcrumb
├── [5] Service               @id=https://cdmx.be/#embedded-operator
└── [6] FAQPage               @id=https://cdmx.be/#faq
```

No `sameAs`, `offers`, or `priceRange` (consistent with Task 18 — pricing intentionally stripped). Looks good. Recommend running through [schema.org validator](https://validator.schema.org/) and Google Rich Results Test after deploy to confirm enhanced-result eligibility.

Sub-pages (`/contact/`, `/lab/`, `/brand-guidelines.html`, `/404.html`) have **no JSON-LD**. Optional — homepage covers the organization graph, sub-pages don't strictly need it. Flag only.

### 7. Mobile viewport + breakpoints

All 5 HTML pages declare `<meta name="viewport">`. Homepage uses `initial-scale=1.0`; others use `initial-scale=1` (equivalent). **No missing viewport meta.**

Responsive breakpoints in `index.html` (12 distinct):
```
max-width: 375px, 480px, 600px, 640px, 700px, 768px, 820px, 900px, 1024px
min-width: 1025px
pointer: coarse
prefers-reduced-motion: reduce
```

Coverage is dense — small-mobile (375) through tablet (1024) through pointer-coarse (touch) through motion-pref. No obvious gap.

### 8. Reduced-motion coverage

| Location | Count |
|---|---:|
| `index.html` (inline CSS + JS checks) | 9 |
| `assets/css/lab.css` | 1 |
| `assets/css/tokens.css` | 1 |
| `assets/css/base.css` | 0 |
| `assets/css/manifest.css` | 0 |
| Dedicated JS module `assets/js/reduced-motion.js` | — (exports `motionState`) |

Threshold (≥ 2) comfortably met. `reduced-motion.js` is imported by the expensive canvas paths (`substrate.js`, `lab-canvas.js`), so motion-sensitive visitors are covered on /contact and /lab canvases as well.

### 9. Deploy-blockers

Raw grep results:

```
./index.html:3605   REPLACE_BEFORE_DEPLOY  (Formspree form action)
./assets/js/llm-completion.js:4   REPLACE_SUBDOMAIN  (Cloudflare Worker endpoint)
```

No `lorem ipsum`, `TBD`, `FIXME`, or `TODO` hits in HTML/JS/JSON/TXT/TOML.

**Action:** both placeholders must be substituted before `main` is deployed. For `llm-completion.js`, since the file is an unused orphan, a clean alternative is to delete the file entirely (see orphan cleanup below).

### 10. Orphan JS cleanup

**Done in this audit:** removed orbital JS block from `index.html` (lines 4361–4440, ~4 KB). Verified:
- 0 HTML elements carry any `.orbital-*` class or `id="orbitalContainer"`.
- 0 remaining JS references to `orbitalContainer`, `orbitalNodes`, `positionOrbitalNodes`, `orbitalRotateLoop`.
- File shrinks 219,876 → 215,916 B (git diff: `1 file changed, 81 deletions(-)`).

**Flagged for follow-up (not done — scope):**
- Orbital CSS in `index.html` (~150 lines across two blocks near line 1490 and line 2382). Safe to remove — no HTML consumers. Low-risk cleanup but large diff surface.
- Orphan JS files (never imported, safe to delete):
  - `assets/js/cpu-diagram.js`
  - `assets/js/llm-completion.js` (contains the REPLACE_SUBDOMAIN placeholder — deletion also resolves that blocker)
  - `assets/js/marquee.js`
  - `assets/js/organism.js`
  - `assets/js/parallax.js`
  - `assets/js/services-modal.js`
  - `assets/js/sigil.js`
  - `assets/js/text-reveal.js`
- Orphan CSS: `assets/css/manifest.css` (28 KB) is never referenced from any HTML.
- Unused background pattern PNGs under `assets/patterns/` (~624 KB total) — none referenced from HTML. Should be pruned if they're no longer in the brand system.

### Extra: canonical links

Only `index.html` declares `<link rel="canonical">`. Missing on:
- `/contact/`
- `/lab/`
- `/404.html` (fine to skip; 404s shouldn't be indexed)
- `/brand-guidelines.html`

**Recommendation:** add canonicals to `/contact/` and `/lab/`. Add `<meta name="robots" content="noindex">` to `/404.html` and `/brand-guidelines.html` if they shouldn't be indexed (opinion: brand-guidelines is a public internal page, probably noindex).

---

## Pre-deploy actions required (ordered)

1. **Replace Formspree placeholder.** Edit `index.html:3605`, swap `REPLACE_BEFORE_DEPLOY` for the real Formspree form ID. Test a submission end-to-end (fills honeypot? receives email? redirects correctly?).
2. **Resolve the worker endpoint.** Either:
   - (a) Delete `assets/js/llm-completion.js` (it's orphan — not imported anywhere). Cleanest option.
   - (b) Or, if you plan to wire it up later, replace `REPLACE_SUBDOMAIN` with the real Cloudflare Worker subdomain after `wrangler deploy` and after binding `ANTHROPIC_API_KEY` via `wrangler secret put`.
3. **Re-run leak-check.** Expect only brand-essence hits (Bruges, Renke Pieters, €2M+, etc.). No `REPLACE_*` hits.
4. **Add canonical links** to `/contact/index.html` and `/lab/index.html`. One-liner each: `<link rel="canonical" href="https://cdmx.be/contact/">` / `https://cdmx.be/lab/`.
5. **Add `<meta name="robots" content="noindex">`** to `/404.html` and (optionally) `/brand-guidelines.html`.
6. **Physical mobile test.** iPhone Safari + Android Chrome. Focus:
   - Unlock-gate: does it dismiss? is the 5-second skip-link reachable?
   - /contact substrate canvas: does it render? does reduced-motion suppress it?
   - CPU-architecture diagram: nodes tappable? traveling lights perform?
   - Expertise split-switcher: touch-swipe? respects `pointer: coarse`?
   - Form: keyboard doesn't obscure submit button?
7. **Define launch success metric** (see options below).
8. **Deploy** (Cloudflare Pages or static host of choice).

## Post-deploy follow-ups

1. **Schema.org validator + Google Rich Results Test** on production URL — confirm FAQPage + Organization eligibility for rich snippets.
2. **Lighthouse audit** on production — target ≥ 95 on Performance, Accessibility, Best Practices, SEO.
3. **Plausible analytics** — uncomment lines 47–48 in `index.html` once domain is live so traffic tracking starts from day 1. Confirm cdmx.be is added to the Plausible dashboard.
4. **Remove unused assets** (low priority, post-launch cleanup pass):
   - 8 orphan JS files in `assets/js/`.
   - `assets/css/manifest.css` (unreferenced).
   - Orbital CSS blocks in `index.html`.
   - Unreferenced PNG patterns in `assets/patterns/`.
5. **Monitor Formspree inbox** daily for the first 2 weeks — catch spam patterns, tune honeypot if needed.
6. **Monitor worker rate limit** (if llm-completion is wired up): 6 requests/hour/IP is tight — may need tuning based on real traffic.
7. **CSP header** — consider adding a strict Content-Security-Policy via Cloudflare rules. Currently inlined scripts and styles would require `unsafe-inline` or hashes.

## Orphan cleanup opportunities

Summary (safe-to-remove in a dedicated housekeeping PR post-launch):

| What | Where | Est. saving | Risk |
|---|---|---:|---|
| Orbital JS block | `index.html` lines 4361–4440 | ~4 KB | None — **done in this audit** |
| Orbital CSS blocks | `index.html` ~1490–1632, ~2382–2460 | ~3 KB | None — safe |
| 8 orphan JS files | `assets/js/cpu-diagram.js`, `llm-completion.js`, `marquee.js`, `organism.js`, `parallax.js`, `services-modal.js`, `sigil.js`, `text-reveal.js` | ~30 KB | None — verified no imports |
| `manifest.css` | `assets/css/manifest.css` | 28 KB | None — no `<link>` references |
| Background pattern PNGs | `assets/patterns/*.png` | 624 KB | Low — verify brand-guidelines still brand-correct first |

## Recommended success metrics

Pick one primary + one guardrail. Candidates with trade-offs:

| Metric | Pros | Cons | Best fit when |
|---|---|---|---|
| **Qualified applications via contact form / month** | Directly tied to the one-client-per-year model; easy to measure | Small N (need only 1–3 qualified leads) → high variance | You're confident traffic → intent ratio is the bottleneck |
| **Homepage → /contact conversion rate** | Measures message clarity; normalizes for traffic volume | Doesn't account for lead quality | You want to iterate on copy/positioning |
| **Time on page (homepage) + scroll depth** | Signals content resonance; privacy-friendly | Weak proxy for commercial outcome | You want leading-indicator feedback loop |
| **Inbound LinkedIn DMs citing the site** | High-signal (site drove the action) | Not tracked automatically; manual log | You're mostly driving via 1:1 outreach |
| **Brand search volume (site: cdmx.be)** | Strongest long-run signal for positioning stickiness | 3–6 month lag before meaningful data | You're playing the long game |

**Recommendation:** combine "Qualified applications / quarter" (primary — the business outcome) with "Homepage → /contact conversion" (guardrail — early signal of message-market fit). Log both in a single `Obsidian Vault/Projects/CDMX-v6-launch.md` file, review weekly for first 8 weeks post-launch, then monthly.

---

*End of audit report.*
