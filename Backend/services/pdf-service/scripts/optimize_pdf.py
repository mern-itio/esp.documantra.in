#!/usr/bin/env python3
"""
Optimize PDF using PyMuPDF (fitz)
"""

import sys
import json
import fitz  # PyMuPDF
import argparse
import os
from datetime import datetime

def optimize_pdf(pdf_path, options):
    """
    Optimize PDF by removing unused objects, compressing images, etc.
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        # Get original file size
        original_size = os.path.getsize(pdf_path)
        
        # Apply optimizations
        if options.get('removeUnusedObjects', True):
            # Remove unused objects
            doc.scrub()
        
        if options.get('compressImages', True):
            # Compress images
            for page in doc:
                image_list = page.get_images()
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)
                    if pix.n - pix.alpha < 4:  # GRAY or RGB
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    pix.save(f"temp_img_{img_index}.png")
                    # Replace with compressed version
                    page.replace_image(xref, filename=f"temp_img_{img_index}.png")
                    os.remove(f"temp_img_{img_index}.png")
        
        if options.get('removeMetadata', True):
            # Remove metadata
            doc.set_metadata({})
        
        # Generate output filename
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{base_name}_optimized_{timestamp}.pdf"
        output_path = os.path.join(os.path.dirname(pdf_path), output_filename)
        
        # Save the optimized PDF
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
        
        # Get optimized file size
        optimized_size = os.path.getsize(output_path)
        compression_ratio = (1 - optimized_size / original_size) * 100 if original_size > 0 else 0
        
        return {
            "success": True,
            "optimizedFileName": output_filename,
            "outputPath": output_path,
            "originalSize": original_size,
            "optimizedSize": optimized_size,
            "compressionRatio": round(compression_ratio, 2)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    parser = argparse.ArgumentParser(description='Optimize PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('options', help='JSON object of optimization options')
    
    args = parser.parse_args()
    
    try:
        options = json.loads(args.options)
    except json.JSONDecodeError:
        options = {}
    
    result = optimize_pdf(args.pdf_path, options)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
