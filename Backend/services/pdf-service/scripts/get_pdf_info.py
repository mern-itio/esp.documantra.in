#!/usr/bin/env python3
"""
Get comprehensive PDF information including page count, dimensions, and metadata
"""

import sys
import json
import fitz  # PyMuPDF
import os

def get_pdf_info(pdf_path):
    """
    Get comprehensive information about a PDF file
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        # Get basic info
        page_count = len(doc)
        file_size = os.path.getsize(pdf_path)
        
        # Get metadata
        metadata = doc.metadata
        
        # Get first page dimensions (assuming all pages have same dimensions)
        first_page = doc[0]
        page_rect = first_page.rect
        page_width = page_rect.width
        page_height = page_rect.height
        
        # Check if PDF is encrypted
        is_encrypted = doc.is_encrypted
        
        # Get page info for all pages
        pages_info = []
        for page_num in range(page_count):
            page = doc[page_num]
            pages_info.append({
                "pageNumber": page_num + 1,
                "width": page.rect.width,
                "height": page.rect.height,
                "rotation": page.rotation
            })
        
        doc.close()
        
        return {
            "success": True,
            "pageCount": page_count,
            "fileSize": file_size,
            "pageWidth": page_width,
            "pageHeight": page_height,
            "isEncrypted": is_encrypted,
            "metadata": {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "creationDate": metadata.get("creationDate", ""),
                "modificationDate": metadata.get("modDate", "")
            },
            "pages": pages_info
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "PDF path is required"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({"success": False, "error": "PDF file not found"}))
        sys.exit(1)
    
    result = get_pdf_info(pdf_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
