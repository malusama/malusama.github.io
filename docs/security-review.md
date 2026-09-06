# Security and dependency review — 2026-09-07

Scope: the generated website, browser scripts, and this repository's new presentation build. The older Hexo source has a separate upgrade in `malusama/hexo`.

## Changes

- Fuse.js 6.5.3 -> 7.5.0, pinned in the lockfile, copied from npm and self-hosted with its license. No reviewed advisory for the old Fuse version was returned by the GitHub advisory lookup; this is a maintenance update, not a claim that Fuse 6.5.3 was exploitable.
- Replace the old search template's HTML interpolation with DOM construction and `textContent`. Search links must point to `/post/` on the current site or `https://malu.moe`. Query + category filtering remains combined, with index-load failure falling back to the existing archive.
- Replace the old feature bundle with readable local scripts. Theme handling supports blocked localStorage and system theme changes. No legacy bundle or third-party script is loaded on initial render.
- Keep utterances as its upstream hosted service (there is no version pinned by this site); load only on request, preserve comments' pathname identity, and validate both origin and source of incoming messages before theme synchronization.
- Upgrade the verified OSS image URLs to HTTPS, add responsive WebP URLs and cache dimensions for all 113 distinct OSS images. Keep original links for full-resolution viewing.
- Fix the `malu.ome` typo in metadata/feeds/redirects/search and exact-case internal tag links. Add canonical URL, meaningful description, referrer policy and `noopener noreferrer` to new-window links.
- Add a lockfile, weekly Dependabot checks and a read-only CI template with actions pinned to commit SHAs. The template is not active: the current OAuth token cannot create workflows.

## Validation and limits

`npm run check` builds the entire site, checks all 36 original articles' text/code/images/anchors, resolves internal links with Linux-style case sensitivity, validates the index and verifies byte-for-byte repeat builds. `npm audit` reports zero known vulnerabilities for the installed dependency tree at review time. This is not a guarantee of no vulnerabilities.

The original Hugo source and build configuration have not been located. Hugo 0.80.0 cannot be upgraded in this generated-only repository; its historical metadata is intentionally not rewritten to pretend an upgrade occurred. There is no Hugo server executable in the hosted pages. A future source migration must upgrade and test the actual generator.

Sources: [Hugo security model](https://gohugo.io/about/security/), [Hugo releases](https://github.com/gohugoio/hugo/releases), [utterances](https://github.com/utterance/utterances).

Browser verification: Ego at 320/390/768/1440px on home, archive, article and about pages; no horizontal overflow in sampled layouts. Verified light/dark toggle, denied-localStorage fallback, combined query/category filters, clearing filters, outline anchors, dialog close/Escape/focus return and utterances iframe loading. A test index containing HTML/script text and a `javascript:` link rendered no injected elements and no executable link. No script errors or CSP violations were observed on the instrumented article/comment flow. The representative 768px WebP cover was 25,864 bytes versus 859,463 bytes for its original JPEG; this is one image measurement, not a whole-site performance score.
