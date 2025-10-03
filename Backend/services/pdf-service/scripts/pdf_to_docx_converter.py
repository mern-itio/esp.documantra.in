#!/usr/bin/env python3
"""
PDF to DOCX Converter using pdf2docx library
This script provides high-fidelity PDF to DOCX conversion with layout preservation
"""

import sys
import os
import argparse
from pathlib import Path

def convert_pdf_to_docx(input_path, output_path):
    """
    Convert PDF to DOCX using pdf2docx library
    
    Args:
        input_path (str): Path to input PDF file
        output_path (str): Path to output DOCX file
    
    Returns:
        dict: Conversion result with success status and details
    """
    try:
        # Import pdf2docx
        from pdf2docx import Converter
        
        # Check if input file exists
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input PDF file not found: {input_path}")
        
        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Initialize converter
        converter = Converter(input_path)
        
        # Convert PDF to DOCX
        converter.convert(output_path, start=0, end=None)
        
        # Close converter
        converter.close()
        
        # Check if output file was created
        if not os.path.exists(output_path):
            raise RuntimeError("Output DOCX file was not created")
        
        # Get file sizes
        input_size = os.path.getsize(input_path)
        output_size = os.path.getsize(output_path)
        
        return {
            "success": True,
            "input_size": input_size,
            "output_size": output_size,
            "message": "PDF converted to DOCX successfully using pdf2docx",
            "conversion_method": "pdf2docx Python library"
        }
        
    except ImportError as e:
        # Fallback to basic text extraction if pdf2docx is not available
        print(f"Warning: pdf2docx not available ({e}), falling back to text extraction")
        return convert_pdf_to_docx_fallback(input_path, output_path)
    except Exception as e:
        # Check if it's a version compatibility issue
        if "PyMuPDF" in str(e) and "required" in str(e):
            print(f"Warning: PyMuPDF version compatibility issue ({e}), falling back to text extraction")
            return convert_pdf_to_docx_fallback(input_path, output_path)
        else:
            print(f"Error in pdf2docx conversion: {e}")
            # Try fallback method
            return convert_pdf_to_docx_fallback(input_path, output_path)

def convert_pdf_to_docx_fallback(input_path, output_path):
    """
    Fallback PDF to DOCX conversion using basic text extraction
    
    Args:
        input_path (str): Path to input PDF file
        output_path (str): Path to output DOCX file
    
    Returns:
        dict: Conversion result with success status and details
    """
    try:
        # Import required libraries
        import PyPDF2
        from docx import Document
        from docx.shared import Inches
        
        # Read PDF file
        with open(input_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text_content = ""
            
            # Extract text from all pages
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content += page.extract_text() + "\n\n"
        
        # Create DOCX document
        doc = Document()
        
        # Split text into paragraphs and add to document
        paragraphs = text_content.split('\n\n')
        for para_text in paragraphs:
            if para_text.strip():
                doc.add_paragraph(para_text.strip())
        
        # Save document
        doc.save(output_path)
        
        # Get file sizes
        input_size = os.path.getsize(input_path)
        output_size = os.path.getsize(output_path)
        
        return {
            "success": True,
            "input_size": input_size,
            "output_size": output_size,
            "message": "PDF converted to DOCX using fallback text extraction method",
            "conversion_method": "Fallback text extraction",
            "warning": "Layout preservation may be limited with fallback method"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Both pdf2docx and fallback conversion methods failed"
        }

def main():
    """Main function to handle command line arguments and execute conversion"""
    parser = argparse.ArgumentParser(description='Convert PDF to DOCX')
    parser.add_argument('input_path', help='Path to input PDF file')
    parser.add_argument('output_path', help='Path to output DOCX file')
    
    args = parser.parse_args()
    
    # Convert PDF to DOCX
    result = convert_pdf_to_docx(args.input_path, args.output_path)
    
    # Print result as JSON for Node.js to parse
    import json
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result.get('success', False) else 1)

if __name__ == "__main__":
    main()
