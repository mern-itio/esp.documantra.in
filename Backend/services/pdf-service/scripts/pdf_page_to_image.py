#!/usr/bin/env python3
"""
Convert PDF page to high-quality image for preview
"""

import sys
import json
import fitz  # PyMuPDF
import os

def pdf_page_to_image(pdf_path, page_number, output_path, dpi=150):
    """
    Convert a specific PDF page to image
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        if page_number > len(doc) or page_number < 1:
            return {
                "success": False,
                "error": f"Page {page_number} not found. Document has {len(doc)} pages."
            }
        
        # Get the specified page (convert to 0-based index)
        page = doc[page_number - 1]
        
        # Create transformation matrix for high DPI
        zoom = dpi / 72.0  # 72 DPI is default
        mat = fitz.Matrix(zoom, zoom)
        
        # Render page to pixmap
        pix = page.get_pixmap(matrix=mat, alpha=False)
        
        # Save as PNG
        pix.save(output_path)
        
        # Get image dimensions
        width = pix.width
        height = pix.height
        
        doc.close()
        
        return {
            "success": True,
            "outputPath": output_path,
            "width": width,
            "height": height,
            "dpi": dpi
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Missing arguments: pdf_path page_number output_path"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    page_number = int(sys.argv[2])
    output_path = sys.argv[3]
    dpi = int(sys.argv[4]) if len(sys.argv) > 4 else 150
    
    if not os.path.exists(pdf_path):
        print(json.dumps({"success": False, "error": "PDF file not found"}))
        sys.exit(1)
    
    result = pdf_page_to_image(pdf_path, page_number, output_path, dpi)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
