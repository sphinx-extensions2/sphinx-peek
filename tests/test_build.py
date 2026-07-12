"""Test building a project with the extension."""

from __future__ import annotations

from pathlib import Path

import pytest
from sphinx.application import Sphinx


def fragments(app: Sphinx, page: str) -> dict[str, str]:
    """Read all fragments written for a page."""
    folder = Path(app.outdir) / "_fragments" / page
    if not folder.is_dir():
        return {}
    return {path.stem: path.read_text(encoding="utf-8") for path in sorted(folder.glob("*.html"))}


@pytest.mark.sphinx("html", testroot="basic")
def test_page_assets(app: Sphinx) -> None:
    """The JS/CSS assets should be copied, and referenced on each page."""
    app.build()
    static = Path(app.outdir) / "_static"
    assert (static / "sphinx_glimpse.js").is_file()
    assert (static / "sphinx_glimpse.css").is_file()
    assert (static / "sphinx_glimpse_config.js").is_file()
    index_html = (Path(app.outdir) / "index.html").read_text(encoding="utf-8")
    assert "sphinx_glimpse.js" in index_html
    assert "sphinx_glimpse.css" in index_html
    assert "sphinx_glimpse_config.js" in index_html


@pytest.mark.sphinx("html", testroot="basic")
def test_fragments_written(app: Sphinx) -> None:
    """A fragment file should be written for each previewable target."""
    app.build()
    index = fragments(app, "index")
    assert set(index) == {
        "__page__",
        "section-label",
        "a-section",
        "figure-label",
        "table-label",
        "equation-equation-label",
        "admonition-label",
        "code-label",
        "term-a-term",
        "foo",
        "footnote-label",
        "test-project",
    }
    other = fragments(app, "other")
    assert set(other) == {
        "__page__",
        "other-label",
        "other-section",
        "other-figure-label",
        "other-page",
    }


@pytest.mark.sphinx("html", testroot="basic")
def test_fragment_content(app: Sphinx) -> None:
    """Fragment content should be rendered HTML, without ids, resolved against its own page."""
    app.build()
    index = fragments(app, "index")

    # page fragment: title plus leading paragraphs (bounded by glimpse_section_paragraphs)
    assert "Test project" in index["__page__"]
    assert "First paragraph" in index["__page__"]
    assert "Second paragraph" in index["__page__"]
    assert "Third paragraph" not in index["__page__"]

    # section fragments are excerpts, with references resolved relative to the source page
    assert "A section" in index["section-label"]
    assert 'href="other.html#other-label"' in index["section-label"]
    # primary and secondary ids map to the same fragment
    assert index["section-label"] == index["a-section"]

    # directly rendered nodes
    assert "<figure" in index["figure-label"]
    assert "A figure caption" in index["figure-label"]
    assert "<table" in index["table-label"]
    assert "Admonition content" in index["admonition-label"]
    assert "highlight" in index["code-label"]
    # glossary terms include the definition
    assert "<dt" in index["term-a-term"]
    assert "The term definition" in index["term-a-term"]
    # API objects include the signature
    assert "foo" in index["foo"]
    assert "A function description" in index["foo"]


@pytest.mark.sphinx("html", testroot="basic", srcdir="basic-incremental")
def test_incremental_rebuild(app: Sphinx) -> None:
    """Fragments should be regenerated cleanly when a page is rebuilt."""
    app.build()
    assert fragments(app, "index")
    # trigger a rebuild of a single page
    index_rst = Path(app.srcdir) / "index.rst"
    index_rst.write_text(
        index_rst.read_text(encoding="utf-8").replace("First paragraph", "Altered paragraph"),
        encoding="utf-8",
    )
    app.build()
    index = fragments(app, "index")
    assert "Altered paragraph" in index["__page__"]
