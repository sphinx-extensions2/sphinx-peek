sphinx-peek
===========

    Sphinx extension for peeking at :ref:`references <other-note>`

**In Development!**

The extension adds a small icon next to select references,
that can be clicked to peek at the target of the reference.

- Resizable modal window
- Anchored to the reference during scrolling and window resizing
- Nested reference peeking supported

.. video:: _static/sphinx-peek-demo.mp4
    :alt: sphinx-peek demo
    :width: 600
    :preload: none

Usage
-----

.. image:: https://img.shields.io/pypi/v/sphinx-peek.svg
   :target: https://pypi.org/project/sphinx-peek/
   :alt: PyPI

Simply install and add ``sphinx_peek`` to your ``conf.py`` extensions list.

.. code-block:: bash

    pip install sphinx-peek

.. code-block:: python

    extensions = [
        ...
        'sphinx_peek',
        ...
    ]

.. important::

    The scroll-to-target behaviour, inside the iframe,
    only works reliably for same-origin_ or CORS_ enabled references.

    To test the feature locally, rather than directly opening the ``.html`` file, you can serve the documentation using a simple HTTP server, e.g.:

    .. code-block:: bash

        cd docs/_build/html
        python -m http.server

The following configuration variables are available:

.. peek-config::

Also, the CSS of the peek modal can be customized (see `html_css_files <https://www.sphinx-doc.org/en/master/usage/configuration.html#confval-html_css_files>`__) by targeting the classes:

- ``.sp-icon-container``: the parent of the icon
- ``.sp-icon``: the SVG icon itself
- ``.sp-icon-open``: the SVG icon when the modal is closed
- ``.sp-icon-close``: the SVG icon when the modal is open
- ``.sp-modal``: the modal window containing the iframe
- ``.sp-iframe``: the iframe containing the target document
- ``.sp-overlay``: the overlay that covers the rest of the page

After loading the page, into the iframe, the extension will also add a class ``.sp-iframe-document`` to the root document.
This allows you to customize the CSS of the target document, e.g. to hide header and footer elements in the furo theme:

.. code-block:: css

    .sp-iframe-document .mobile-header,
    .sp-iframe-document .back-to-top,
    .sp-iframe-document .bottom-of-page,
    .sp-iframe-document .related-pages {
        display: none;
    }

Design Discussion
-----------------

It can be desirable to show previews to referenced content, without navigating away from the current page.

This feature is not usually provided by the browser itself,
and Sphinx extensions also have other constraints:

- Sphinx documentation is usually built as static HTML files, so any dynamic modifications to the page must be done on the front-end (in the browser), using JavaScript.
- Front-end Javascript can only access same-origin_ resources, or resources that explicitly allows cross-origin resource sharing (CORS_).
- It is desirable for the extension to be able to work with any theme, without requiring modifications to the theme itself
- It is desirable for the previews to work for different types of references, even ones created by other extensions

.. note::

    If opening a HTML file directly in the browser, from the file system,
    other local files will be considered cross-origin, and will not be accessible to the extension.
    To make the local files same-origin, a simple HTTP server can be used, e.g.::

        cd docs/_build/html
        python -m http.server

    Then, the documentation can be accessed at ``http://localhost:8000``.

To show preview content, the following options could be considered:

    1. Use an iframe to load the target URL, and show it in a modal window.

This is probably the simplest option, and is the one currently implemented here.

| It does not require much build-time processing ✅
| It will work for any URL (same-origin or cross-origin) ✅
| It will work with any theme (since the CSS/JS is sand-boxed) ✅
| It allows for following nested previews ✅
| However, it will need to load the entire page,
  which can be slow and will clutter the preview with unnecessary artefacts, like the page header ❌
| Some browsers (like Chrome) appear to not handle loading a URL like ``page.html#id`` with the target id correctly in view within the iframe ❌

The loaded document, within the iframe, is only available to be modified with Javascript if it is same-origin or CORS enabled.
If same-origin, then the issues can be mitigated with Javascript / CSS,

- by hiding unnecessary elements (e.g. header and footer) in the target document
- by scrolling to the target element (e.g. ``#id``) within the target document

    2. Identify all the previewable content at build time, and allow it to be accessed by the reference page(s).

| This allows for a more efficient preview, since only the relevant content needs to be shown ✅
| The content must "work" with the referencing page's CSS / Javascript though ❌
| Also any local references (like links and images) may need to be modified to be relative to the referencing page  ❌
| If there are a lot of previewable content, then this can increase the size and time of the build ❌
| The implementation can be tricky to implement into the Sphinx build flow, since we need to gather the previewable content from all the pages, and then make it available to the referencing pages

This is done in `sphinx-tippy <https://github.com/sphinx-extensions2/sphinx-tippy>`__, but is not applicable to all use cases.

    3. Use a server-side proxy to load the target URL content on the front-end

| The primary disadvantage is that it requires the documentation to be hosted on a server that supports the proxy, and will not work locally ❌

This is done in `sphinx-hoverxref <https://github.com/readthedocs/sphinx-hoverxref>`__, which only works when the documentation is hosted on ReadTheDocs, and also suffers in complexity and applicability the same as (2).

Positioning the preview window
..............................

Currently, the preview window is positioned/sized relative to the reference preview icon and page window, via custom JavaScript, which is triggered on page load and on window resize or scroll.
This appears to work fine, although may not work as well with asynchronous panning (see `this discussion <https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html>`__).

One could also look to use an existing library, like `@popperjs/core <https://www.npmjs.com/package/@popperjs/core>`__ (now called Floating UI).
If this is done, it might be nice to have the option of bundling the library with the extension, rather than requiring it to be downloaded on page load.

In the future, it may be possible to use the `CSS Anchor API <https://drafts.csswg.org/css-anchor-position-1/>`__.


More Examples
-------------

A reference to :ref:`other:subsection` within a paragraph.

.. table:: Simple Table
    :widths: 20 20
    :name: index-table

    +------------------+--------------------------+
    |      Column 1    |      Column 2            |
    +==================+==========================+
    |      Header      | :ref:`Note <other-note>` |
    +------------------+--------------------------+

.. toctree::
    :hidden:

    other


.. _CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
.. _same-origin: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
