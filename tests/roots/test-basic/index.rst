Test project
============

First paragraph of the page.

Second paragraph of the page.

Third paragraph, not included in excerpts.

.. _section-label:

A section
---------

Section paragraph, with a reference to :ref:`other-label`.

.. figure:: example.png
    :name: figure-label

    A figure caption.

.. list-table:: A table
    :name: table-label

    * - Cell

.. math:: e = mc^2
    :label: equation-label

.. admonition:: Admonition title
    :name: admonition-label

    Admonition content.

.. code-block:: python
    :name: code-label
    :caption: Code caption

    print("hello")

.. glossary::

    a term
        The term definition.

.. py:function:: foo(bar)

    A function description.

A footnote reference [#footnote-label]_.

.. [#footnote-label] The footnote content.

.. toctree::
    :hidden:

    other
