#!/usr/bin/env python3
"""
Extract text with precise positions from PDF using PyMuPDF (fitz)
"""

import sys
import json
import fitz  # PyMuPDF
import argparse

def extract_text_positions(pdf_path, page_number=1):
    """
    Extract text with precise positions from PDF
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
        
        # Get page dimensions
        page_rect = page.rect
        page_width = page_rect.width
        page_height = page_rect.height
        
        # Extract text with positions
        text_blocks = []
        text_dict = page.get_text("dict")
        
        for block in text_dict["blocks"]:
            if "lines" in block:  # Text block
                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"].strip()
                        if text:
                            bbox = span["bbox"]  # [x0, y0, x1, y1]
                            
                            text_blocks.append({
                                "id": f"text_{len(text_blocks)}",
                                "text": text,
                                "pageNumber": page_number,
                                "x": bbox[0],
                                "y": bbox[1],
                                "width": bbox[2] - bbox[0],
                                "height": bbox[3] - bbox[1],
                                "fontSize": span["size"],
                                "fontFamily": span["font"],
                                "color": f"#{span['color']:06x}" if span['color'] != 0 else "#000000",
                                "flags": span["flags"]  # Bold, italic, etc.
                            })
        
        doc.close()
        
        return {
            "success": True,
            "textBlocks": text_blocks,
            "pageInfo": {
                "pageNumber": page_number,
                "width": page_width,
                "height": page_height,
                "totalPages": len(doc)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    parser = argparse.ArgumentParser(description='Extract text positions from PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('page_number', type=int, default=1, help='Page number to extract (1-based)')
    
    args = parser.parse_args()
    
    result = extract_text_positions(args.pdf_path, args.page_number)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
