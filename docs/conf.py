from sphinx_glimpse import __version__

project = "sphinx-glimpse"
copyright = "Chris Sewell"
version = __version__

extensions = ["myst_parser", "sphinx_glimpse"]

myst_enable_extensions = ["colon_fence", "dollarmath"]

html_theme = "furo"
html_title = "sphinx-glimpse"
