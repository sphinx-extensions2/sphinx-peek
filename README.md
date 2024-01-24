# sphinx-peek

[![PyPI][pypi-badge]][pypi-link]

> Sphinx extension for peeking at references

**In Development!**

The extension adds a small icon next to select references,
that can be clicked to peek at the target of the reference.

- Resizable modal window
- Anchored to the reference during scrolling and window resizing
- Nested reference peeking supported

See documentation at <https://sphinx-peek.readthedocs.io/>


## Development notes

Yet another sphinx-extension for previewing links!

Aims:

- As simple as possible
- All CSS and JavaScript is bundled with the extension

There is already:

- [sphinx-hoverxref](https://github.com/readthedocs/sphinx-hoverxref):

  This works by adding specific HTML classes to certain internal and intersphinx references,
  and then using JavaScript to show a preview window on mouseover,
  which is populated with content obtained by making an API call to the ReadTheDocs server.

  The key drawback of this approach is that it only works when the documentation is being served by ReadTheDocs.
  Also intersphinx previews only work when the target documentation is also being served by ReadTheDocs.

- [sphinx-tippy](https://github.com/sphinx-extensions2/sphinx-tippy)

  This works by creating all preview content in advance, during the build process, and uses [tippy.js](https://atomiks.github.io/tippyjs/) to show the preview window on mouseover.

  A drawback is that it can be difficult to make the preview content look good,
  and integrate with the rest of the documentation theme.

- [sphinx-preview](https://github.com/useblocks/sphinx-preview)

  This works by using Javascript to add iframe windows for previewing.

### Changes to sphinx-preview

This extension adapts the approach of `sphinx-preview`, but makes some changes including:

1. Replaces the use of JQuery with vanilla JavaScript
2. Always uses clickable icons to show the preview window, rather than mouseover hover (I feel this gives the user more control, and understanding of which links are preview-able)
3. Fixes some bugs with the scroll-to-anchor behaviour, and preview window positioning
4. Adds anchoring of the preview window to the reference, during scrolling and window resizing
5. For development purposes, also adds [JSDoc type annotations](https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html#providing-type-hints-in-js-via-jsdoc) to the JavaScript code and uses pre-commit hooks to check the formatting and type safety of the code.

[pypi-badge]: https://img.shields.io/pypi/v/sphinx-peek.svg
[pypi-link]: https://pypi.org/project/sphinx-peek
