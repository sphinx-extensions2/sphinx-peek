"""A sphinx extension for peeking at internal references."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from sphinx.application import Sphinx
from sphinx.util.fileutil import copy_asset

__version__ = "0.0.1"


def setup(app: Sphinx) -> dict[str, Any]:
    """Setup the sphinx extension."""

    # add assets
    assets = Path(__file__).parent / "assets"
    # note sphinx 7.1+ will add checksum to filename,
    # only if in _static folder
    for asset_js in assets.glob("*.js"):
        app.add_js_file(asset_js.name)
        copy_asset(asset_js, Path(app.outdir, "_static"))
    for asset_css in assets.glob("*.css"):
        app.add_css_file(asset_css.name)
        copy_asset(asset_css, Path(app.outdir, "_static"))

    return {
        "version": __version__,
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
