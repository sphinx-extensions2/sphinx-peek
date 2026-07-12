# sphinx-glimpse

> Sphinx extension for in-place link previews, via static HTML fragments and native popovers

**In Development!**

Hover over (or focus) an internal reference, and a popover shows a preview of the target content,
without navigating away from the current page.
Try it on the references below!

## Usage

Simply install and add `sphinx_glimpse` to your `conf.py` extensions list:

```bash
pip install sphinx-glimpse
```

```python
extensions = [
    "sphinx_glimpse",
]
```

:::{important}
Previews are fetched by the browser, so the site must be served over HTTP
(as on any host), not opened directly from the file system.
To test locally:

```bash
cd docs/_build/html
python -m http.server
```

:::

## Configuration

The following configuration variables are available:

```{glimpse-config}
```

The popover can also be styled with CSS
(see [`html_css_files`](https://www.sphinx-doc.org/en/master/usage/configuration.html#confval-html_css_files)),
by targeting the `.sg-popover` class, or setting the CSS variables:

- `--sg-background`: background color of the popover
- `--sg-color`: text color of the popover
- `--sg-border-color`: border color of the popover

Fragment content is rendered by the same theme as the rest of the site,
so it will generally already match the page's styling (including dark mode).

## Examples

- Reference to a section: [](#example-section)
- Reference to a figure: [](#example-figure)
- Reference to a table: [](#example-table)
- Reference to an equation: {eq}`example-equation`
- Reference to an admonition: [](#example-admonition)
- Reference to a code block: [](#example-code)
- Reference to a glossary term: {term}`Fragment`
- Reference to another page: [](./other.md)
- Reference to a target on another page: [](#other-section)
- Footnote reference [^1]

[^1]: This is a footnote

## How it works

At build time, each element with an id is rendered to a static HTML *fragment* file,
at a predictable path: `_fragments/<page>/<anchor>.html`.
Fragments are rendered directly from the resolved doctree, using the theme's own HTML translator,
so links and images within them are correct by construction,
and the markup matches the rest of the site.
Since fragments depend only on their own page, the build remains parallel and incremental safe.

In the browser, the extension *computes* the fragment URL for any internal reference
(`page.html#anchor` → `_fragments/page/anchor.html`) and lazily fetches it on hover intent
(or keyboard focus), with caching.
No manifest of references is required, and pages carry no inlined preview content.

Previews are displayed using the native
[Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
and anchored to the reference with
[CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning),
falling back to simple JS positioning in older browsers.

See the [design discussion](./design.md) for the full rationale and roadmap.

## Example content

(example-section)=
### A section

This is the first paragraph of the section, which is included in the preview.

This is the second paragraph of the section, which is also included.

This is the third paragraph, which is not included (by default).

(example-figure)=
### A figure

```{figure} fun-fish.png
:name: example-figure-name
:width: 200px

This is a figure caption.
```

(example-table)=
### A table

```{list-table} A table caption
:name: example-table-name
:header-rows: 1

* - Header 1
  - Header 2
* - Cell 1
  - Cell 2
```

### An equation

$$e = mc^2$$ (example-equation)

(example-admonition)=
### An admonition

```{admonition} An admonition title
:name: example-admonition-name

This is the admonition content.
```

(example-code)=
### A code block

```{code-block} python
:name: example-code-name
:caption: A code caption

print("hello world")
```

### A glossary

```{glossary}
Fragment
    A self-contained piece of HTML, rendered at build time,
    representing a single referenceable element of a page.

Popover
    A native browser primitive for transient overlay content,
    rendered in the top layer.
```

```{toctree}
:hidden:

design
other
```
