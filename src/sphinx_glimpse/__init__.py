"""Sphinx extension for in-place link previews, via static HTML fragments and native popovers."""

from __future__ import annotations

from dataclasses import dataclass, fields
from dataclasses import field as field_orig
import json
from pathlib import Path
import shutil
from typing import TYPE_CHECKING, Any, cast

from docutils import nodes
from docutils.statemachine import StringList
from docutils.utils import new_document
from sphinx import addnodes
from sphinx.util.docutils import SphinxDirective
from sphinx.util.logging import getLogger

if TYPE_CHECKING:
    from sphinx.application import Sphinx
    from sphinx.builders.html import StandaloneHTMLBuilder
    from sphinx.config import Config
    from sphinx.writers.html5 import HTML5Translator

__version__ = "0.0.1"

LOGGER = getLogger(__name__)

FRAGMENTS_DIR = "_fragments"
"""Name of the output folder (relative to the output root) that fragments are written to."""

PAGE_FRAGMENT = "__page__"
"""Fragment file name (less extension) representing the page itself, rather than an anchor."""


def setup(app: Sphinx) -> dict[str, Any]:
    """Setup the sphinx extension."""

    # add configuration values
    for _field in fields(GlimpseConfig):
        app.add_config_value(f"glimpse_{_field.name}", getattr(GlimpseConfig, _field.name), "html")

    # write the javascript configuration, once the configuration has been initialized
    app.connect("config-inited", add_js_config)

    # write the preview fragments for each page
    # (during the write phase, so that this is compatible with parallel builds)
    app.connect("html-page-context", write_page_fragments)

    # add static assets
    # (copied directly, since `sphinx.util.fileutil.copy_asset` warns rather than
    # overwriting outdated copies from a previous build)
    assets = Path(__file__).parent / "assets"
    static = Path(app.outdir, "_static")
    static.mkdir(parents=True, exist_ok=True)
    # note sphinx 7.1+ will add checksum to the URL,
    # only if in the _static folder
    for asset_js in sorted(assets.glob("*.js")):
        app.add_js_file(asset_js.name)
        shutil.copyfile(asset_js, static / asset_js.name)
    for asset_css in sorted(assets.glob("*.css")):
        app.add_css_file(asset_css.name)
        shutil.copyfile(asset_css, static / asset_css.name)

    # add a private directive to document the configuration
    app.add_directive("glimpse-config", GlimpseConfigDirective)

    return {
        "version": __version__,
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }


def f(doc: str, default: Any) -> Any:
    """Helper function to set default value for dataclass fields."""
    return field_orig(default=default, metadata={"doc": doc})


@dataclass
class GlimpseConfig:
    """Configuration for the sphinx-glimpse extension."""

    selector: str = f("CSS selector for finding previewable references", "a.reference.internal")
    unselector: str = f(
        "Discard any found references matching this CSS selector",
        ".toctree-wrapper a, .toc-tree a, .sidebar-tree a",
    )
    open_delay: int = f("Hover intent delay (milliseconds) before showing a preview", 150)
    close_delay: int = f(
        "Grace period (milliseconds) before hiding, allowing the pointer into the preview", 300
    )
    max_width: int = f("Maximum width of the preview popover (pixels)", 500)
    max_height: int = f("Maximum height of the preview popover (pixels)", 300)
    section_paragraphs: int = f(
        "Maximum number of leading paragraphs to include in section/page fragments", 2
    )

    @classmethod
    def from_config(cls, config: Config) -> GlimpseConfig:
        """Create from the sphinx configuration."""
        inst = cls()
        for _field in fields(cls):
            setattr(inst, _field.name, config[f"glimpse_{_field.name}"])
        return inst


def add_js_config(app: Sphinx, config: Config) -> None:
    """Add a javascript file which sets the user-defined configuration."""
    glimpse_config = GlimpseConfig.from_config(config)
    name = "sphinx_glimpse_config.js"
    app.add_js_file(name)
    data = {
        "selector": glimpse_config.selector,
        "notSelector": glimpse_config.unselector,
        "fragmentsDir": FRAGMENTS_DIR,
        "pageFragment": PAGE_FRAGMENT,
        "openDelay": glimpse_config.open_delay,
        "closeDelay": glimpse_config.close_delay,
        "maxWidth": glimpse_config.max_width,
        "maxHeight": glimpse_config.max_height,
    }
    static = Path(app.outdir, "_static")
    static.mkdir(parents=True, exist_ok=True)
    static.joinpath(name).write_text(
        f"window.sphinxGlimpseConfig = {json.dumps(data, indent=2)};\n", encoding="utf-8"
    )


def write_page_fragments(
    app: Sphinx,
    pagename: str,
    templatename: str,
    context: dict[str, Any],
    doctree: nodes.document | None,
) -> None:
    """Write a static HTML fragment file for each previewable target on the page.

    Fragments are written to predictable paths: ``_fragments/<page>/<anchor>.html``,
    so that the client-side javascript can compute the fragment URL for any internal
    reference, without requiring a manifest of all references in the project.

    This is called during the write phase, for a single page, and requires no
    cross-page state, so it is safe for parallel and incremental builds.
    """
    if doctree is None:
        return
    if app.builder.name not in {"html", "dirhtml"}:
        return
    builder = cast("StandaloneHTMLBuilder", app.builder)
    config = GlimpseConfig.from_config(app.config)

    fragments: dict[str, str] = {}

    # fragment representing the page itself (for references without a target anchor)
    if (page_node := _page_fragment_node(doctree, config)) is not None:
        fragments[PAGE_FRAGMENT] = _render(builder, doctree, page_node)

    for node in doctree.findall(nodes.Element):
        ids, fragment_node = _fragment_for_node(node, config)
        if fragment_node is None:
            continue
        rendered: str | None = None
        for node_id in ids:
            if node_id and node_id not in fragments:
                if rendered is None:
                    rendered = _render(builder, doctree, fragment_node)
                fragments[node_id] = rendered

    # mirror the builder's target URI scheme, so the fragment path is client computable:
    # html: `page.html#anchor` -> `_fragments/page/anchor.html`
    # dirhtml: `page/#anchor` -> `_fragments/page/index/anchor.html`
    uri = builder.get_target_uri(pagename)
    if uri.endswith(".html"):
        rel = uri[:-5]
    elif uri.endswith("/") or not uri:
        rel = uri + "index"
    else:
        rel = uri

    out_folder = Path(app.outdir, FRAGMENTS_DIR, *rel.split("/"))
    # remove fragments from a previous build of this page
    shutil.rmtree(out_folder, ignore_errors=True)
    if not fragments:
        return
    out_folder.mkdir(parents=True, exist_ok=True)
    for node_id, html_str in fragments.items():
        out_folder.joinpath(f"{node_id}.html").write_text(html_str, encoding="utf-8")


def _render(builder: StandaloneHTMLBuilder, doctree: nodes.document, node: nodes.Element) -> str:
    """Render a lone doctree node to HTML, using the builder's own translator.

    Since the node comes from the resolved doctree, during the write of its own page,
    any references/images within it are already correctly resolved,
    relative to the target page (the client resolves them against the target page URL).

    Note, ``builder.render_partial`` is not used here, since it runs the full docutils
    publishing pipeline, whose writer transforms are not applied to normal sphinx pages,
    and can fail on sphinx-specific nodes
    (e.g. ``desc`` subclasses ``Admonition``, breaking ``writer_aux.Admonitions``).
    Instead the node is passed directly through the translator,
    mirroring how the page body itself is rendered.
    """
    document = new_document("<glimpse-fragment>", doctree.settings)
    document.append(node)
    translator = cast("HTML5Translator", builder.create_translator(document, builder))
    document.walkabout(translator)
    return "".join(translator.body)


_DIRECT_NODES: tuple[type[nodes.Element], ...] = (
    nodes.figure,
    nodes.table,
    nodes.image,
    nodes.math_block,
    nodes.literal_block,
    nodes.footnote,
    nodes.container,
)
"""Node types which are rendered directly, in full, as their own fragment."""


def _node_ids(node: nodes.Element) -> list[str]:
    """Return the ids of a node."""
    return [str(node_id) for node_id in cast("list[Any]", node.get("ids", ()))]


def _fragment_for_node(
    node: nodes.Element, config: GlimpseConfig
) -> tuple[list[str], nodes.Element | None]:
    """Return (target ids, node to render) for a previewable node, or no node if skipped."""
    ids = _node_ids(node)

    if isinstance(node, nodes.section):
        if not ids:
            return ids, None
        return ids, _section_excerpt(node, config)

    if isinstance(node, addnodes.desc):
        # object descriptions (e.g. py:function): the ids are on the signature children
        sig_ids = [
            node_id for sig in node.findall(addnodes.desc_signature) for node_id in _node_ids(sig)
        ]
        if not sig_ids:
            return sig_ids, None
        return sig_ids, node.deepcopy()

    if isinstance(node, nodes.term):
        # glossary terms: render the parent definition list item (term + definition),
        # wrapped in a definition list for valid HTML
        if ids and isinstance(node.parent, nodes.definition_list_item):
            return ids, nodes.definition_list("", node.parent.deepcopy())
        return ids, None

    if isinstance(node, (nodes.Admonition, *_DIRECT_NODES)):
        if not ids:
            return ids, None
        return ids, node.deepcopy()

    return [], None


def _leading_paragraphs(parent: nodes.Element, section: nodes.section, count: int) -> None:
    """Append copies of up to ``count`` leading paragraphs of ``parent`` to ``section``."""
    added = 0
    for child in parent.children:
        if isinstance(child, nodes.paragraph):
            section += child.deepcopy()
            added += 1
            if added >= count:
                break
        elif isinstance(child, (nodes.title, nodes.target, nodes.comment, addnodes.index)):
            continue  # skip non-content nodes
        else:
            break  # stop at the first other content (e.g. a figure or subsection)


def _section_excerpt(section: nodes.section, config: GlimpseConfig) -> nodes.Element | None:
    """Create an excerpt of a section: its title plus some leading paragraphs."""
    # the ids are retained, since e.g. the writer requires them for title permalinks
    # (the client resolves them against the target page, so they remain functional)
    excerpt = nodes.section(ids=list(section["ids"]) or ["glimpse-excerpt"])
    if (title := section.next_node(nodes.title)) is not None:
        excerpt += title.deepcopy()
    _leading_paragraphs(section, excerpt, config.section_paragraphs)
    if not excerpt.children:
        return None
    return excerpt


def _page_fragment_node(doctree: nodes.document, config: GlimpseConfig) -> nodes.Element | None:
    """Create an excerpt representing the page itself: its title plus some leading paragraphs."""
    first_section = doctree.next_node(nodes.section)
    if first_section is not None:
        return _section_excerpt(first_section, config)
    return None


class GlimpseConfigDirective(SphinxDirective):
    """Directive to document the extension's configuration options."""

    def run(self) -> list[nodes.Node]:
        """Run the directive."""
        container = nodes.admonition()
        container["classes"].append("hint")
        title = nodes.title("", "Configuration Options")
        container += title

        content = []
        for _field in fields(GlimpseConfig):
            name = f"glimpse_{_field.name}"
            default = getattr(GlimpseConfig, _field.name)
            content.append(f":{name}: {_field.metadata['doc']} (default: ``{default!r}``)\n")

        content_list = StringList(content)
        self.state.nested_parse(content_list, 0, container)
        return [container]
