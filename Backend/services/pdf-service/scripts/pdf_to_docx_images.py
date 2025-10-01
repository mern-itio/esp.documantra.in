#!/usr/bin/env python3
import sys
import os
import json
import fitz  # PyMuPDF
from docx import Document
from docx.shared import Inches

def pdf_to_docx_images(pdf_path: str, docx_path: str, dpi: int = 200):
    doc = Document()
    pdf = fitz.open(pdf_path)

    # A4 width approximation in inches for Word; image will scale to page width
    page_width_inches = 6.5  # 8.27in A4 width minus margins ~ fits typical content width

    for page_index in range(len(pdf)):
        page = pdf[page_index]
        # Render page to image
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        # Save to temp PNG
        img_bytes = pix.tobytes('png')
        tmp_img = f"{docx_path}.page_{page_index+1}.png"
        with open(tmp_img, 'wb') as f:
            f.write(img_bytes)

        # Add image to document
        doc.add_picture(tmp_img, width=Inches(page_width_inches))
        if page_index < len(pdf) - 1:
            doc.add_page_break()

        try:
            os.remove(tmp_img)
        except Exception:
            pass

    doc.save(docx_path)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: pdf_to_docx_images.py <input.pdf> <output.docx> [dpi]"}))
        sys.exit(1)
    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]
    dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 200
    try:
        pdf_to_docx_images(input_pdf, output_docx, dpi)
        print(json.dumps({"success": True, "output": output_docx}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


