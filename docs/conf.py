"""Sphinx configuration for BitSplit docs."""

import os
import sys

sys.path.insert(0, os.path.abspath(".."))

from bitsplit import __version__

project = "BitSplit"
author = "Paul"
release = __version__
copyright = "2026, Paul"

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.napoleon",
    "sphinx.ext.viewcode",
    "myst_parser",
]

templates_path = ["_templates"]
exclude_patterns = ["_build"]

# Theme
html_theme = "furo"
html_title = "BitSplit"
html_static_path = ["_static"]

# MyST (Markdown support)
source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

# Autodoc
autodoc_member_order = "bysource"
autodoc_typehints = "description"
