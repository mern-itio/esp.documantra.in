#!/usr/bin/env python3
"""
Add new text to PDF using PyMuPDF (fitz)
"""

import sys
import json
import fitz  # PyMuPDF
import argparse
import os
from datetime import datetime

def add_text_to_pdf(pdf_path, text, x, y, fontSize=12, fontFamily='helv', color='#000000'):
    """
    Add new text to PDF at specified position
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        # Get the first page (or you could specify a page number)
        page = doc[0]
        
        # Convert color from hex to RGB
        color_rgb = fitz.utils.getColor(color)
        
        # Add text to the page
        page.insert_text(
            (float(x), float(y)),
            text,
            fontsize=float(fontSize),
            color=color_rgb,
            fontname=fontFamily
        )
        
        # Generate output filename
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{base_name}_text_added_{timestamp}.pdf"
        output_path = os.path.join(os.path.dirname(pdf_path), output_filename)
        
        # Save the modified PDF
        doc.save(output_path)
        doc.close()
        
        return {
            "success": True,
            "editedFileName": output_filename,
            "outputPath": output_path
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    parser = argparse.ArgumentParser(description='Add text to PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('text', help='Text to add')
    parser.add_argument('x', type=float, help='X position')
    parser.add_argument('y', type=float, help='Y position')
    parser.add_argument('fontSize', type=float, default=12, help='Font size')
    parser.add_argument('fontFamily', default='helv', help='Font family')
    parser.add_argument('color', default='#000000', help='Text color (hex)')
    
    args = parser.parse_args()
    
    result = add_text_to_pdf(
        args.pdf_path, 
        args.text, 
        args.x, 
        args.y, 
        args.fontSize, 
        args.fontFamily, 
        args.color
    )
    print(json.dumps(result))

if __name__ == "__main__":
    main()
