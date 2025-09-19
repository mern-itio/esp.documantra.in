#!/usr/bin/env python3
"""
Extract text blocks from PDF with precise positioning information
"""

import sys
import json
import fitz  # PyMuPDF
import os

def extract_text_blocks(pdf_path, page_number):
    """
    Extract text blocks from a specific page with precise positioning for inline editing
    """
    try:
        doc = fitz.open(pdf_path)
        
        # Check if page number is valid
        if page_number < 1 or page_number > doc.page_count:
            return {
                "success": False,
                "error": f"Page number {page_number} is out of range. PDF has {doc.page_count} pages.",
                "textBlocks": []
            }
        
        page = doc[page_number - 1]  # Convert to 0-based index
        
        if page is None:
            return {
                "success": False,
                "error": f"Could not load page {page_number}",
                "textBlocks": []
            }
        
        
        # Get page dimensions first
        page_width = page.rect.width
        page_height = page.rect.height
        
        # Get text blocks with detailed information
        text_dict = page.get_text("dict")
        
        text_blocks = []
        block_id = 0
        
        for block in text_dict["blocks"]:
            if "lines" in block:  # Text block
                for line in block["lines"]:
                    for span in line["spans"]:
                        # Extract text and positioning
                        text = span["text"].strip()
                        if text:  # Only include non-empty text
                            bbox = span["bbox"]  # [x0, y0, x1, y1]
                            
                            # Get font color if available
                            color = "#000000"  # Default black
                            if "color" in span:
                                color_rgb = span["color"]
                                if color_rgb and isinstance(color_rgb, (list, tuple)) and len(color_rgb) >= 3:
                                    # Convert RGB to hex
                                    r, g, b = int(color_rgb[0] * 255), int(color_rgb[1] * 255), int(color_rgb[2] * 255)
                                    color = f"#{r:02x}{g:02x}{b:02x}"
                            
                            text_block = {
                                "id": f"text-{page_number}-{block_id}",
                                "text": text,
                                "pageNumber": page_number,
                                "x": bbox[0],
                                "y": bbox[1],
                                "width": bbox[2] - bbox[0],
                                "height": bbox[3] - bbox[1],
                                "fontSize": span["size"],
                                "fontFamily": span["font"],
                                "color": color,
                                "flags": span["flags"],
                                "bbox": bbox,  # Keep original bbox for reference
                                "isEditable": True
                            }
                            
                            text_blocks.append(text_block)
                            block_id += 1
        
        doc.close()
        
        return {
            "success": True,
            "textBlocks": text_blocks,
            "totalBlocks": len(text_blocks),
            "pageDimensions": {
                "width": page_width,
                "height": page_height
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "textBlocks": []
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing arguments"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    page_number = int(sys.argv[2])
    
    result = extract_text_blocks(pdf_path, page_number)
    print(json.dumps(result))
