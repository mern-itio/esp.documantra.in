#!/usr/bin/env python3
import sys
import json
from pdf2docx import Converter

def pdf_to_docx_editable(pdf_path: str, docx_path: str, start: int = 0, end: int = None):
    cv = Converter(pdf_path)
    try:
        cv.convert(docx_path, start=start, end=end, detect_font=True)
    finally:
        cv.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: pdf_to_docx_editable.py <input.pdf> <output.docx> [start] [end]"}))
        sys.exit(1)
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    start = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    end = int(sys.argv[4]) if len(sys.argv) > 4 else None
    try:
        pdf_to_docx_editable(pdf_path, docx_path, start=start, end=end)
        print(json.dumps({"success": True, "output": docx_path}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


