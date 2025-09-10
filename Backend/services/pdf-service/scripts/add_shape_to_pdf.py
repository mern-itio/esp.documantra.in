#!/usr/bin/env python3
"""
Add shapes to PDF using PyMuPDF (fitz)
"""

import sys
import json
import fitz  # PyMuPDF
import argparse
import os
from datetime import datetime

def add_shape_to_pdf(pdf_path, shape_type, points, style):
    """
    Add shape to PDF
    """
    try:
        # Open PDF document
        doc = fitz.open(pdf_path)
        
        # Get the first page (or you could specify a page number)
        page = doc[0]
        
        # Parse style
        color = fitz.utils.getColor(style.get('color', '#000000'))
        stroke_width = style.get('strokeWidth', 2)
        fill_color = fitz.utils.getColor(style.get('fillColor', '#FFFFFF')) if style.get('fillColor') else None
        
        if shape_type == 'rectangle':
            # Points should be [x1, y1, x2, y2]
            rect = fitz.Rect(points[0], points[1], points[2], points[3])
            page.draw_rect(rect, color=color, width=stroke_width, fill=fill_color)
            
        elif shape_type == 'ellipse':
            # Points should be [x1, y1, x2, y2] for bounding rectangle
            rect = fitz.Rect(points[0], points[1], points[2], points[3])
            page.draw_oval(rect, color=color, width=stroke_width, fill=fill_color)
            
        elif shape_type == 'line':
            # Points should be [x1, y1, x2, y2]
            page.draw_line(
                fitz.Point(points[0], points[1]), 
                fitz.Point(points[2], points[3]), 
                color=color, 
                width=stroke_width
            )
            
        elif shape_type == 'arrow':
            # Points should be [x1, y1, x2, y2]
            # Draw line
            page.draw_line(
                fitz.Point(points[0], points[1]), 
                fitz.Point(points[2], points[3]), 
                color=color, 
                width=stroke_width
            )
            # Draw arrowhead (simplified)
            dx = points[2] - points[0]
            dy = points[3] - points[1]
            length = (dx**2 + dy**2)**0.5
            if length > 0:
                # Normalize direction vector
                dx /= length
                dy /= length
                # Arrowhead size
                arrow_size = 10
                # Arrowhead points
                x1 = points[2] - dx * arrow_size + dy * arrow_size * 0.5
                y1 = points[3] - dy * arrow_size - dx * arrow_size * 0.5
                x2 = points[2] - dx * arrow_size - dy * arrow_size * 0.5
                y2 = points[3] - dy * arrow_size + dx * arrow_size * 0.5
                
                page.draw_line(
                    fitz.Point(points[2], points[3]), 
                    fitz.Point(x1, y1), 
                    color=color, 
                    width=stroke_width
                )
                page.draw_line(
                    fitz.Point(points[2], points[3]), 
                    fitz.Point(x2, y2), 
                    color=color, 
                    width=stroke_width
                )
        
        # Generate output filename
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{base_name}_shape_added_{timestamp}.pdf"
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
    parser = argparse.ArgumentParser(description='Add shape to PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('shape_type', help='Type of shape (rectangle, ellipse, line, arrow)')
    parser.add_argument('points', help='JSON array of points')
    parser.add_argument('style', help='JSON object of style properties')
    
    args = parser.parse_args()
    
    try:
        points = json.loads(args.points)
        style = json.loads(args.style)
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Invalid JSON for points or style"
        }
    
    result = add_shape_to_pdf(args.pdf_path, args.shape_type, points, style)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
