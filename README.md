# Malu Blog

Live site: https://malu.moe/

This repository serves generated HTML from `master` through GitHub Pages. The original Hugo source/configuration is **not** in this repository. Do not deploy the separate historical `malusama/hexo` project over this site: it contains an older set of articles.

## Maintain the presentation

Use Node.js 24:

```sh
npm ci --ignore-scripts
npm run check
python3 -m http.server 4178 --bind 127.0.0.1
```

- `assets/blog.css`: layout, typography, both color schemes and responsive styles.
- `assets/theme.js`: early theme selection, storage fallback and accessible switch.
- `assets/blog.js`: search, article outline, image dialog, code copying and opt-in comments.
- `scripts/enhance.mjs`: re-applies shared navigation, home/archive/article templates, dates, summaries, image sizing and metadata to generated HTML. It preserves article content and existing routes. Run it **after** any future Hugo generation and before publishing.
- `assets/image-metadata.json`: checked image dimensions; refresh with `node scripts/refresh-images.mjs` when adding OSS images. Normal builds are offline and deterministic.
- `scripts/content-baseline.json`: preservation baseline for the original 36 articles. Tests check text, code, images and anchors, exact-case links, search index and repeat-build stability. Update the relevant baseline deliberately when editing an existing article.

The home/about copy lives in `scripts/enhance.mjs`. Summaries and reading estimates are derived from each article rather than maintained separately. Search is lazy-loaded, uses pinned self-hosted Fuse.js, and renders index strings as text. Comments retain the original GitHub repository/pathname association and only contact utteranc.es after clicking “加载评论”.

`npm run build` writes the publishable HTML in place. Review and commit the generated output together with the scripts/assets. A read-only CI configuration is supplied as `docs/ci-workflow.yml.example`; the current GitHub OAuth token lacks workflow scope, so it is not installed as an active Actions workflow. It can be copied to `.github/workflows/check.yml` with a workflow-authorized login. Production changes when the approved commit reaches `master`.

If the Hugo source is recovered, move these templates into its layouts and pin a supported Hugo release there. The old `Hugo 0.80.0` generator metadata describes the original build, not an executable included here; changing that string would not upgrade the generator.
