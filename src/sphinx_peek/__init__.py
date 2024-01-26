"""A sphinx extension for peeking at internal references."""
from __future__ import annotations

from dataclasses import dataclass, fields
from dataclasses import field as field_orig
from pathlib import Path
from textwrap import dedent
from typing import Any

from docutils import nodes
from docutils.statemachine import StringList
from sphinx.application import Sphinx
from sphinx.config import Config
from sphinx.util.docutils import SphinxDirective
from sphinx.util.fileutil import copy_asset

__version__ = "0.0.3"


def setup(app: Sphinx) -> dict[str, Any]:
    """Setup the sphinx extension."""

    # add configuration values
    for _field in fields(PeekConfig):
        app.add_config_value(f"peek_{_field.name}", getattr(PeekConfig, _field.name), "html")

    # add event hook after configuration has been initialized
    # to write javascript configuration
    app.connect("config-inited", add_js_config)

    # add static assets
    assets = Path(__file__).parent / "assets"
    # note sphinx 7.1+ will add checksum to filename,
    # only if in _static folder
    for asset_js in assets.glob("*.js"):
        app.add_js_file(asset_js.name)
        copy_asset(str(asset_js), Path(app.outdir, "_static"))
    for asset_css in assets.glob("*.css"):
        app.add_css_file(asset_css.name)
        copy_asset(str(asset_css), Path(app.outdir, "_static"))

    # add a private directive to document the configuration
    app.add_directive("peek-config", PeekConfigDirective)

    return {
        "version": __version__,
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }


def f(doc: str, default: Any) -> Any:
    """Helper function to set default value for dataclass fields."""
    return field_orig(default=default, metadata={"doc": doc})


@dataclass
class PeekConfig:
    """Configuration for the sphinx-peek extension."""

    selector: str = f("CSS selector for finding references", "div.main a.reference.internal")
    unselector: str = f(
        "Discard any found references matching this CSS selector", ".toctree-wrapper a,.toc-tree a"
    )
    icon_element: str = f("HTML element type to contain icon", "sup")
    icon_height: str = f("Height of icon", "1.5em")
    preview_width: int = f("Width of preview window", 500)
    preview_height: int = f("Height of preview window", 300)
    offset_x: int = f("Distance of preview window from icon (horizontal)", 20)
    offset_y: int = f("Distance of preview window from icon (vertical)", 20)
    open_delay: int = f("Delay (milliseconds) before displaying preview window", 200)

    @classmethod
    def from_config(cls, config: Config) -> PeekConfig:
        """Update configuration from sphinx config."""
        inst = cls()
        for _field in fields(cls):
            setattr(inst, _field.name, config[f"peek_{_field.name}"])
        return inst


def add_js_config(app: Sphinx, config: Config) -> None:
    """Add a javascript file which sets the user-defined configuration."""
    peek_config = PeekConfig.from_config(config)
    name = "sphinx_peek_config.js"
    app.add_js_file(name)
    Path(app.outdir, "_static").joinpath(name).write_text(
        dedent(
            f"""\
        window.sphinxPeekConfig = {{
            selector: "{peek_config.selector}",
            notSelector: "{peek_config.unselector}",
            iconType: "{peek_config.icon_element}",
            iconOpen:
                '<svg class="sp-icon sp-icon-open" height="{peek_config.icon_height}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.30147 15.5771C4.77832 14.2684 3.6904 12.7726 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C14.1843 6 16.1261 7.07185 17.6986 8.42294C19.2218 9.73158 20.3097 11.2274 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18C9.81574 18 7.87402 16.9282 6.30147 15.5771ZM12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C2.00757 13.8624 3.23268 15.5772 4.99812 17.0941C6.75717 18.6054 9.14754 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C21.9925 10.1376 20.7674 8.42276 19.002 6.90595C17.2429 5.39462 14.8525 4 12 4ZM10 12C10 10.8954 10.8955 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8955 14 10 13.1046 10 12ZM12 8C9.7909 8 8.00004 9.79086 8.00004 12C8.00004 14.2091 9.7909 16 12 16C14.2092 16 16 14.2091 16 12C16 9.79086 14.2092 8 12 8Z"></path></svg>',
            iconClose:
                '<svg class="sp-icon sp-icon-close" height="{peek_config.icon_height}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.7071 5.70711C20.0976 5.31658 20.0976 4.68342 19.7071 4.29289C19.3166 3.90237 18.6834 3.90237 18.2929 4.29289L14.032 8.55382C13.4365 8.20193 12.7418 8 12 8C9.79086 8 8 9.79086 8 12C8 12.7418 8.20193 13.4365 8.55382 14.032L4.29289 18.2929C3.90237 18.6834 3.90237 19.3166 4.29289 19.7071C4.68342 20.0976 5.31658 20.0976 5.70711 19.7071L9.96803 15.4462C10.5635 15.7981 11.2582 16 12 16C14.2091 16 16 14.2091 16 12C16 11.2582 15.7981 10.5635 15.4462 9.96803L19.7071 5.70711ZM12.518 10.0677C12.3528 10.0236 12.1792 10 12 10C10.8954 10 10 10.8954 10 12C10 12.1792 10.0236 12.3528 10.0677 12.518L12.518 10.0677ZM11.482 13.9323L13.9323 11.482C13.9764 11.6472 14 11.8208 14 12C14 13.1046 13.1046 14 12 14C11.8208 14 11.6472 13.9764 11.482 13.9323ZM15.7651 4.8207C14.6287 4.32049 13.3675 4 12 4C9.14754 4 6.75717 5.39462 4.99812 6.90595C3.23268 8.42276 2.00757 10.1376 1.46387 10.9698C1.05306 11.5985 1.05306 12.4015 1.46387 13.0302C1.92276 13.7326 2.86706 15.0637 4.21194 16.3739L5.62626 14.9596C4.4555 13.8229 3.61144 12.6531 3.18002 12C3.6904 11.2274 4.77832 9.73158 6.30147 8.42294C7.87402 7.07185 9.81574 6 12 6C12.7719 6 13.5135 6.13385 14.2193 6.36658L15.7651 4.8207ZM12 18C11.2282 18 10.4866 17.8661 9.78083 17.6334L8.23496 19.1793C9.37136 19.6795 10.6326 20 12 20C14.8525 20 17.2429 18.6054 19.002 17.0941C20.7674 15.5772 21.9925 13.8624 22.5362 13.0302C22.947 12.4015 22.947 11.5985 22.5362 10.9698C22.0773 10.2674 21.133 8.93627 19.7881 7.62611L18.3738 9.04043C19.5446 10.1771 20.3887 11.3469 20.8201 12C20.3097 12.7726 19.2218 14.2684 17.6986 15.5771C16.1261 16.9282 14.1843 18 12 18Z"/></svg>',
            width: {peek_config.preview_width},
            height: {peek_config.preview_height},
            offset: {{ left: {peek_config.offset_x}, top: {peek_config.offset_y} }},
            openDelay: {peek_config.open_delay},
        }};
        """
        ),
        encoding="utf-8",
    )


class PeekConfigDirective(SphinxDirective):
    def run(self) -> list[nodes.Element]:
        """Run the directive."""
        container = nodes.admonition()
        container["classes"].append("hint")
        title = nodes.title("", "Configuration Options")
        container += title

        content = []
        for _field in fields(PeekConfig):
            name = f"peek_{_field.name}"
            default = getattr(PeekConfig, _field.name)
            content.append(f":{name}: {_field.metadata['doc']} (default: ``{default!r}``)\n")

        content_list = StringList(content)
        self.state.nested_parse(content_list, 0, container)
        return [container]
