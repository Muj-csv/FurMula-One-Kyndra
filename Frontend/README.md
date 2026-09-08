# Kyndra — front end

Static prototype. Four pages, no build step, no framework, no bundler.
Open `index.html` in a browser, or serve the folder over HTTP.

| Page | Contents |
|---|---|
| `index.html` | Hero (cursor-scrubbed dog video) and the "how it works" explainer |
| `cohort.html` | Six simulated animal profiles, filters, pet detail modal |
| `match.html` | Applicant intake, results board, swap / equity dial / unmatched / impact, stability check |
| `evidence.html` | Citations and the what's-real-what's-simulated panel |

## Two things to know before editing

**The nav, the footer and the SVG sprite are not in the HTML.** They are built
once in `shared.js` and injected into every page. Edit them there — pasting a
`<nav>` back into a page defeats the point and gives you two navs.

**`match.js` must load after `shared.js`.** It calls `iconSvg()`, which
`shared.js` defines. Reorder the two script tags and the results board renders
without thumbnails and throws.

## Files

- `styles.css` — every rule for every page, one file
- `shared.js` — sprite, nav, footer, active-link marking, photo lookup, pet
  modal, hero video scrub, cohort filters. Each block no-ops on pages where its
  elements are absent, so the one file is safe everywhere.
- `match.js` — the matching engine (hard constraints → independent preference
  derivation → Gale–Shapley deferred acceptance) plus its UI. Loaded only by
  `match.html`.
- `index-kyndra-dog-scrub.html.backup` — the pre-split single-file prototype,
  kept for reference.
