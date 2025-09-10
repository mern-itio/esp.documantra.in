#!/usr/bin/env python3
"""
Edit text in PDF using PyMuPDF (fitz)
"""

import sys
import json
import fitz  # PyMuPDF
import argparse
import os
from datetime import datetime

def edit_pdf_text(pdf_path, text_edits):
    """
    Edit text in PDF by replacing existing text
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        # Process each text edit
        for edit in text_edits:
            page_num = edit.get('pageNumber', 1) - 1  # Convert to 0-based index
            
            if page_num >= len(doc):
                continue
                
            page = doc[page_num]
            
            # Find and replace text
            if 'originalText' in edit and 'editedText' in edit:
                # Simple text replacement
                text_instances = page.search_for(edit['originalText'])
                
                for inst in text_instances:
                    # Add a white rectangle to cover the original text
                    rect = fitz.Rect(inst)
                    page.add_redact_annot(rect, fill=(1, 1, 1))  # White fill
                    page.apply_redactions()
                    
                    # Add new text at the same position
                    if edit['editedText']:
                        page.insert_text(
                            (inst.x0, inst.y1),  # Position
                            edit['editedText'],
                            fontsize=edit.get('fontSize', 12),
                            color=fitz.utils.getColor(edit.get('color', '#000000'))
                        )
            
            elif 'text' in edit and 'x' in edit and 'y' in edit:
                # Add new text at specific position
                page.insert_text(
                    (edit['x'], edit['y']),
                    edit['text'],
                    fontsize=edit.get('fontSize', 12),
                    color=fitz.utils.getColor(edit.get('color', '#000000'))
                )
        
        # Generate output filename
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{base_name}_edited_{timestamp}.pdf"
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
    parser = argparse.ArgumentParser(description='Edit text in PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('text_edits', help='JSON string of text edits')
    
    args = parser.parse_args()
    
    try:
        text_edits = json.loads(args.text_edits)
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Invalid JSON for text edits"
        }
    
    result = edit_pdf_text(args.pdf_path, text_edits)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
