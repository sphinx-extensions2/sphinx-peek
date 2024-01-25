from sphinx_peek import __version__

project = "sphinx-peek"
copyright = "Chris Sewell"
version = __version__

extensions = ["sphinx_peek", "sphinxcontrib.video"]

html_theme = "furo"
html_title = "sphinx-peek"
html_favicon = "_static/favicon.svg"
html_static_path = ["_static"]
html_theme_options = {
    "light_logo": "logo-light-mode.png",
    "dark_logo": "logo-dark-mode.png",
}
html_css_files = ["custom.css"]
