# sphinx-peek

**IMPORTANT this is still in development**

> Sphinx extension for peeking at references

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

  This works by ...

The difference here is that ...
