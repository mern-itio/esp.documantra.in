#!/usr/bin/env python3
"""
Add image to PDF using PyMuPDF (fitz)
"""

import sys
import json
import fitz  # PyMuPDF
import argparse
import os
from datetime import datetime

def add_image_to_pdf(pdf_path, image_path, x, y, width, height):
    """
    Add image to PDF at specified position and size
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        # Get the first page (or you could specify a page number)
        page = doc[0]
        
        # Create rectangle for image placement
        rect = fitz.Rect(float(x), float(y), float(x) + float(width), float(y) + float(height))
        
        # Insert image
        page.insert_image(rect, filename=image_path)
        
        # Generate output filename
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{base_name}_image_added_{timestamp}.pdf"
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
    parser = argparse.ArgumentParser(description='Add image to PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('image_path', help='Path to image file')
    parser.add_argument('x', type=float, help='X position')
    parser.add_argument('y', type=float, help='Y position')
    parser.add_argument('width', type=float, help='Image width')
    parser.add_argument('height', type=float, help='Image height')
    
    args = parser.parse_args()
    
    result = add_image_to_pdf(
        args.pdf_path, 
        args.image_path, 
        args.x, 
        args.y, 
        args.width, 
        args.height
    )
    print(json.dumps(result))

if __name__ == "__main__":
    main()
