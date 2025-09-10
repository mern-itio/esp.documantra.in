#!/usr/bin/env python3
"""
Add annotations to PDF using PyMuPDF (fitz)
"""

import sys
import json
import fitz  # PyMuPDF
import argparse
import os
from datetime import datetime

def add_annotation_to_pdf(pdf_path, annotation):
    """
    Add annotation to PDF
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        # Get the specified page (convert to 0-based index)
        page_num = annotation.get('pageNumber', 1) - 1
        if page_num >= len(doc):
            page_num = 0
        page = doc[page_num]
        
        annotation_type = annotation.get('type', 'highlight')
        
        if annotation_type == 'highlight':
            # Create highlight annotation
            rect = fitz.Rect(
                annotation.get('x', 0), 
                annotation.get('y', 0), 
                annotation.get('x', 0) + annotation.get('width', 100), 
                annotation.get('y', 0) + annotation.get('height', 20)
            )
            
            # Create highlight annotation
            highlight = page.add_highlight_annot(rect)
            highlight.set_colors(stroke=annotation.get('color', '#FFFF00'))
            highlight.update()
            
        elif annotation_type == 'comment':
            # Create text annotation (comment)
            rect = fitz.Rect(
                annotation.get('x', 0), 
                annotation.get('y', 0), 
                annotation.get('x', 0) + 20, 
                annotation.get('y', 0) + 20
            )
            
            comment = page.add_text_annot(rect.tl, annotation.get('comment', ''))
            comment.set_info(title=annotation.get('author', 'User'))
            comment.update()
            
        elif annotation_type == 'stamp':
            # Create stamp annotation
            rect = fitz.Rect(
                annotation.get('x', 0), 
                annotation.get('y', 0), 
                annotation.get('x', 0) + annotation.get('width', 100), 
                annotation.get('y', 0) + annotation.get('height', 50)
            )
            
            # Create a simple text stamp
            page.insert_text(
                rect.tl, 
                annotation.get('text', annotation.get('stampType', 'STAMP').upper()),
                fontsize=12,
                color=fitz.utils.getColor(annotation.get('color', '#FF0000'))
            )
            
        elif annotation_type == 'drawing':
            # Create freehand drawing annotation
            drawing_data = annotation.get('drawingData', [])
            if drawing_data:
                # Convert drawing data to points
                points = []
                for point in drawing_data:
                    points.append(fitz.Point(point['x'], point['y']))
                
                if len(points) > 1:
                    # Draw lines between consecutive points
                    for i in range(len(points) - 1):
                        page.draw_line(
                            points[i], 
                            points[i + 1], 
                            color=fitz.utils.getColor(annotation.get('style', {}).get('color', '#000000')),
                            width=annotation.get('style', {}).get('strokeWidth', 2)
                        )
        
        # Generate output filename
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{base_name}_annotated_{timestamp}.pdf"
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
    parser = argparse.ArgumentParser(description='Add annotation to PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('annotation', help='JSON object of annotation data')
    
    args = parser.parse_args()
    
    try:
        annotation = json.loads(args.annotation)
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Invalid JSON for annotation"
        }
    
    result = add_annotation_to_pdf(args.pdf_path, annotation)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
