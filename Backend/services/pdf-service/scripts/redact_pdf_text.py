#!/usr/bin/env python3
"""
Redact text in PDF using PyMuPDF (fitz)
"""

import sys
import json
import fitz  # PyMuPDF
import argparse
import os
from datetime import datetime

def redact_pdf_text(pdf_path, redaction_data):
    """
    Redact text in PDF by covering it with black rectangles
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        # Process each redaction
        for redaction in redaction_data:
            page_num = redaction.get('pageNumber', 1) - 1  # Convert to 0-based index
            
            if page_num >= len(doc):
                continue
                
            page = doc[page_num]
            
            # Create rectangle for redaction
            rect = fitz.Rect(
                redaction.get('x', 0), 
                redaction.get('y', 0), 
                redaction.get('x', 0) + redaction.get('width', 100), 
                redaction.get('y', 0) + redaction.get('height', 20)
            )
            
            # Add redaction annotation
            page.add_redact_annot(rect, fill=(0, 0, 0))  # Black fill
            page.apply_redactions()
        
        # Generate output filename
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{base_name}_redacted_{timestamp}.pdf"
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
    parser = argparse.ArgumentParser(description='Redact text in PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('redaction_data', help='JSON array of redaction data')
    
    args = parser.parse_args()
    
    try:
        redaction_data = json.loads(args.redaction_data)
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Invalid JSON for redaction data"
        }
    
    result = redact_pdf_text(args.pdf_path, redaction_data)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
