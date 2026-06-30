#!/usr/bin/env python3
"""Fill ASP Audit preliminary information request form (delegates to package generator)."""
import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).with_name("generate-asp-audit-package.py")))
