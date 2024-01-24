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
    only works reliably for same-origin references, due to browser security restrictions (see `CORS reference <https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS>`__).

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
