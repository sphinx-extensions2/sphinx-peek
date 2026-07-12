# sphinx-glimpse

[![PyPI][pypi-badge]][pypi-link]

> Sphinx extension for in-place link previews, via static HTML fragments and native popovers

**In Development!**

Hover over (or focus) an internal reference, and a popover shows a preview of the target content,
without navigating away from the current page.

## Design

This is the successor to (and synthesis of) two earlier experiments:

- [sphinx-tippy](https://github.com/sphinx-extensions2/sphinx-tippy):
  inlines all preview content into every page at build time, and shows it with tippy.js.
  Simple to deploy, but it duplicates content per referencing page, requires cross-page state
  (breaking parallel builds), rewrites links heuristically, and needs per-theme CSS.
- [sphinx-peek](https://github.com/sphinx-extensions2/sphinx-peek):
  loads the whole target page in an iframe modal.
  Zero build-time cost and theme-sandboxed, but heavyweight, cluttered with page chrome,
  and scroll-to-anchor in iframes is unreliable across browsers.

sphinx-glimpse instead separates the three concerns:

1. **Content**: at build time, each element with an id is rendered to a static HTML *fragment*
   (`_fragments/<page>/<anchor>.html`), directly from the resolved doctree,
   using the theme's own HTML translator.
   Fragments depend only on their own page, so this is parallel and incremental build safe,
   and links within fragments are correct by construction.
2. **Transport**: the client *computes* the fragment URL from any internal `href`
   (`page.html#anchor` → `_fragments/page/anchor.html`) and lazily fetches it on hover intent,
   with caching. No manifest, no per-page JS blobs, O(1) page overhead.
3. **Presentation**: previews are shown with the native
   [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) and
   [CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning)
   (both baseline in current browsers, with a small JS fallback),
   so no third-party JS libraries are required, and content is styled by the page's own theme CSS.

Note: fragments are fetched, so the site must be served over HTTP (as on any host),
not opened directly from the file system, e.g. locally:

```bash
cd docs/_build/html
python -m http.server
```

See the documentation at <https://sphinx-glimpse.readthedocs.io/> for details,
including the full design discussion and roadmap
(external providers, intersphinx fragments, `myst.xref.json` interoperability).

[pypi-badge]: https://img.shields.io/pypi/v/sphinx-glimpse.svg
[pypi-link]: https://pypi.org/project/sphinx-glimpse
