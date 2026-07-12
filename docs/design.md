# Design discussion

It can be desirable to show previews of referenced content, without navigating away from the
current page. This page sets out the design space, why previous approaches hit ceilings,
and the rationale for the approach taken here.

## The problem, decomposed

Any link-preview mechanism must answer three independent questions:

1. **Content**: what to show for a given target
   (extraction granularity, link/image correctness, math, theming of the excerpt)
2. **Transport**: how the browser obtains it
   (inline embed vs lazy fetch vs iframe vs server API)
3. **Presentation**: how it is shown
   (hover tooltip vs click modal, positioning, accessibility, theme chrome)

Sphinx documentation also imposes constraints:

- Output is static HTML, so dynamic behaviour must happen in the browser.
- Front-end JavaScript can only access same-origin resources, or CORS-enabled ones.
- The extension should work with any theme, without modifying the theme.
- Previews should work for any reference type, including ones created by other extensions.

## Prior approaches

- [sphinx-hoverxref](https://github.com/readthedocs/sphinx-hoverxref) *(server-everything)*:
  fetches previews at view time from the Read the Docs embed API.
  Content extraction is done properly (server-side, per target), but the documentation
  must be hosted on Read the Docs for previews to work at all.

- [sphinx-tippy](https://github.com/sphinx-extensions2/sphinx-tippy) *(inline-everything)*:
  scrapes the built HTML of every page, and inlines all preview content needed by a page
  into a per-page JS file, displayed with tippy.js.
  The core problem is *eager cross-page aggregation*: page A embeds content extracted from
  page B, so the build must gather everything before writing anything. Consequences:

  - Incompatible with parallel builds: `html-page-context` runs in forked worker processes,
    so state accumulated there never reaches the main process for `build-finished`.
  - Links inside excerpts must be rewritten heuristically (regexes over scraped HTML),
    which breaks for cases like `:term:` references within glossary definitions.
  - Content is duplicated into every referencing page (build size and time),
    with manual cache-busting of the generated JS files.
  - Excerpts are styled outside the theme's normal flow, needing per-theme CSS overrides
    (dark mode, background colors), and math needs a global MathJax hack.

- [sphinx-peek](https://github.com/sphinx-extensions2/sphinx-peek) *(iframe-everything)*:
  loads the whole target page in an iframe modal, opened from an icon.
  Zero build-time cost, theme-sandboxed, and works for any URL, but the iframe transports
  too much: whole pages are heavy, cluttered with page chrome that can only be hidden with
  per-theme CSS (and only same-origin), and scrolling the iframe to the target anchor is
  unreliable across browsers (and impossible cross-origin).

## The approach taken here: static fragments + lazy fetch

This extension occupies the previously empty corner of the design space:
*emit per-target HTML fragments as static files at build time, fetch them lazily at view time*.
This is what the Read the Docs embed API does dynamically, and what
[mystmd](https://mystmd.org) does with structured JSON, but as plain static output that works
on any host.

### Content

For each element with an id, the *resolved doctree* node is rendered to
`_fragments/<page>/<anchor>.html`, using the builder's own HTML translator
(`StandaloneHTMLBuilder.render_partial`). Therefore:

- References and images inside a fragment are already resolved, relative to the target page;
  the client resolves them against the target page URL with `new URL(relative, base)`.
  No heuristic link rewriting.
- Markup (admonitions, highlighting, math) is identical to the rest of the site,
  so the theme's CSS styles it natively, including dark mode.
- Sections and pages are excerpted (title plus leading paragraphs);
  figures, tables, equations, admonitions, code blocks, glossary terms, footnotes and
  API objects are rendered in full.

### Transport

The fragment URL is *computable* from any internal `href`:
`page.html#anchor` maps to `_fragments/page/anchor.html`
(mirroring the builder's URI scheme, including for `dirhtml`).
The client fetches it on hover intent or focus, with caching; a 404 simply means
"not previewable" and nothing is shown.

This has a decisive architectural consequence: **no cross-page state exists at build time**.
Each page's fragments are written during the write of that page, so the build is parallel-safe
and incremental-safe by construction, pages carry no inlined preview content (O(1) overhead),
and there is no manifest or generated per-page JS to cache-bust.

The trade-off: `fetch()` requires an http(s) origin, so previews are disabled for `file://`
(serve locally with `python -m http.server`, as any host does in production).

### Presentation

Previews use the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
(top-layer rendering, light dismiss, ESC-to-close) and are anchored to the reference with
[CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning)
(including viewport flip fallbacks), both of which are baseline in current browsers.
A small JS fallback covers older browsers. No third-party libraries are bundled or fetched.

Interaction is hover-intent based, with a grace period allowing the pointer to move into the
popover (so it can be scrolled), plus keyboard focus support. Preview of references *within*
a popover works naturally, since event handling is delegated.

## Roadmap

- **Provider registry** for external URLs, fetched client-side at view time:
  Wikipedia REST summaries and DOI metadata (both CORS-enabled), and a generic
  `{url pattern → fetch + template}` mechanism; with an iframe provider
  (à la sphinx-peek) as the last-resort tier for arbitrary URLs.
- **Cross-project previews**: publish fragments as a static convention alongside
  `objects.inv`, so intersphinx references can be previewed from any statically-hosted
  project (CORS permitting) — and interoperate with the MyST ecosystem's
  [`myst.xref.json`](https://mystmd.org/guide/website-metadata) so Sphinx and mystmd sites
  can preview each other.
- **Click-icon trigger mode** (à la sphinx-peek), as an alternative to hover.
- **Trimming controls** for large fragments (e.g. long API object descriptions).
- **On-demand math**: only load MathJax when a fetched fragment requires it.
