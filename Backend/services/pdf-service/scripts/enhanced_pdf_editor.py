#!/usr/bin/env python3
"""
Enhanced PDF Editor Script
Handles text editing, drawing, images, and redaction with better PDF manipulation
"""

import fitz
import json
import base64
import os
import sys
from datetime import datetime
from io import BytesIO
from PIL import Image
import tempfile

class EnhancedPDFEditor:
    def __init__(self, input_path):
        self.doc = fitz.open(input_path)
        self.input_path = input_path
        
    def add_text_element(self, page_num, text, x, y, width, height, style):
        """Add or modify text element in PDF"""
        try:
            page = self.doc[page_num - 1]
            
            # Create text rectangle
            rect = fitz.Rect(x, y, x + width, y + height)
            
            # Set font properties
            font_size = style.get('fontSize', 12)
            font_family = style.get('fontFamily', 'helv')
            color = style.get('color', (0, 0, 0))
            
            # Convert hex color to RGB
            if isinstance(color, str) and color.startswith('#'):
                color = self.hex_to_rgb(color)
            
            # Create text insertion point
            point = fitz.Point(x, y + font_size)
            
            # Insert text
            page.insert_text(
                point,
                text,
                fontsize=font_size,
                color=color,
                fontname=font_family
            )
            
            return True
        except Exception as e:
            print(f"Error adding text element: {e}")
            return False
    
    def add_drawing_element(self, page_num, element_type, points, style):
        """Add drawing element (pen, shapes) to PDF"""
        try:
            page = self.doc[page_num - 1]
            
            if element_type == 'pen':
                # Draw freehand path
                if len(points) > 1:
                    path = page.new_path()
                    path.move_to(points[0]['x'], points[0]['y'])
                    for point in points[1:]:
                        path.line_to(point['x'], point['y'])
                    
                    page.draw_path(
                        path,
                        color=style.get('color', (0, 0, 0)),
                        width=style.get('strokeWidth', 2),
                        fill=None
                    )
            
            elif element_type == 'rectangle':
                if len(points) >= 2:
                    rect = fitz.Rect(
                        min(p['x'] for p in points),
                        min(p['y'] for p in points),
                        max(p['x'] for p in points),
                        max(p['y'] for p in points)
                    )
                    page.draw_rect(
                        rect,
                        color=style.get('color', (0, 0, 0)),
                        width=style.get('strokeWidth', 2),
                        fill=style.get('fillColor', None)
                    )
            
            elif element_type == 'ellipse':
                if len(points) >= 2:
                    rect = fitz.Rect(
                        min(p['x'] for p in points),
                        min(p['y'] for p in points),
                        max(p['x'] for p in points),
                        max(p['y'] for p in points)
                    )
                    page.draw_oval(
                        rect,
                        color=style.get('color', (0, 0, 0)),
                        width=style.get('strokeWidth', 2),
                        fill=style.get('fillColor', None)
                    )
            
            elif element_type == 'line':
                if len(points) >= 2:
                    page.draw_line(
                        fitz.Point(points[0]['x'], points[0]['y']),
                        fitz.Point(points[1]['x'], points[1]['y']),
                        color=style.get('color', (0, 0, 0)),
                        width=style.get('strokeWidth', 2)
                    )
            
            return True
        except Exception as e:
            print(f"Error adding drawing element: {e}")
            return False
    
    def add_image_element(self, page_num, image_data, x, y, width, height, rotation=0):
        """Add image element to PDF"""
        try:
            page = self.doc[page_num - 1]
            
            # Decode base64 image data
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Create temporary file for image
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                temp_file.write(image_bytes)
                temp_path = temp_file.name
            
            try:
                # Insert image
                rect = fitz.Rect(x, y, x + width, y + height)
                page.insert_image(rect, filename=temp_path)
                
                # Apply rotation if needed
                if rotation != 0:
                    page.set_rotation(rotation)
                
                return True
            finally:
                # Clean up temporary file
                os.unlink(temp_path)
                
        except Exception as e:
            print(f"Error adding image element: {e}")
            return False
    
    def add_redaction(self, page_num, x, y, width, height, reason, is_permanent=False):
        """Add redaction to PDF"""
        try:
            page = self.doc[page_num - 1]
            rect = fitz.Rect(x, y, x + width, y + height)
            
            # Create redaction annotation
            redact_annot = page.add_redact_annot(rect, reason)
            redact_annot.set_colors(stroke=(0, 0, 0), fill=(0, 0, 0))
            redact_annot.update()
            
            # Apply redaction
            page.apply_redactions()
            
            return True
        except Exception as e:
            print(f"Error adding redaction: {e}")
            return False
    
    def add_highlight(self, page_num, x, y, width, height, text, highlight_type='highlight', style=None):
        """Add highlight annotation to PDF"""
        try:
            page = self.doc[page_num - 1]
            rect = fitz.Rect(x, y, x + width, y + height)
            
            if highlight_type == 'highlight':
                annot = page.add_highlight_annot(rect)
            elif highlight_type == 'underline':
                annot = page.add_underline_annot(rect)
            elif highlight_type == 'strikethrough':
                annot = page.add_strikeout_annot(rect)
            elif highlight_type == 'squiggly':
                annot = page.add_squiggly_annot(rect)
            else:
                annot = page.add_highlight_annot(rect)
            
            # Set style
            if style:
                color = style.get('color', (1, 1, 0))  # Yellow default
                if isinstance(color, str) and color.startswith('#'):
                    color = self.hex_to_rgb(color)
                
                annot.set_colors(stroke=color)
                annot.set_opacity(style.get('opacity', 0.3))
            
            annot.update()
            return True
        except Exception as e:
            print(f"Error adding highlight: {e}")
            return False
    
    def add_comment(self, page_num, x, y, width, height, comment, style=None):
        """Add comment annotation to PDF"""
        try:
            page = self.doc[page_num - 1]
            rect = fitz.Rect(x, y, x + width, y + height)
            
            annot = page.add_text_annot(rect.tl, comment)
            
            # Set style
            if style:
                color = style.get('color', (1, 0.5, 0))  # Orange default
                if isinstance(color, str) and color.startswith('#'):
                    color = self.hex_to_rgb(color)
                
                annot.set_colors(stroke=color)
                annot.set_opacity(style.get('opacity', 0.8))
            
            annot.update()
            return True
        except Exception as e:
            print(f"Error adding comment: {e}")
            return False
    
    def hex_to_rgb(self, hex_color):
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    
    def save_document(self, output_path, optimize=True):
        """Save document with optimization"""
        try:
            if optimize:
                # Optimize the document
                self.doc.save(
                    output_path,
                    garbage=4,  # Remove unused objects
                    deflate=True,  # Compress streams
                    clean=True,  # Clean and sanitize content
                    linear=True,  # Linearize for web viewing
                    expand=0  # Don't expand objects
                )
            else:
                self.doc.save(output_path)
            
            return True
        except Exception as e:
            print(f"Error saving document: {e}")
            return False
    
    def close(self):
        """Close the document"""
        self.doc.close()

def process_pdf_edits(input_path, edits, output_path):
    """Process PDF edits and save result"""
    try:
        editor = EnhancedPDFEditor(input_path)
        
        for edit in edits:
            edit_type = edit.get('type')
            page_num = edit.get('pageNumber', 1)
            
            if edit_type == 'text':
                editor.add_text_element(
                    page_num,
                    edit.get('content', ''),
                    edit.get('position', {}).get('x', 0),
                    edit.get('position', {}).get('y', 0),
                    edit.get('position', {}).get('width', 100),
                    edit.get('position', {}).get('height', 20),
                    edit.get('style', {})
                )
            
            elif edit_type == 'pen' or edit_type == 'shape':
                editor.add_drawing_element(
                    page_num,
                    edit_type,
                    edit.get('points', []),
                    edit.get('style', {})
                )
            
            elif edit_type == 'image':
                editor.add_image_element(
                    page_num,
                    edit.get('content', ''),
                    edit.get('position', {}).get('x', 0),
                    edit.get('position', {}).get('y', 0),
                    edit.get('position', {}).get('width', 100),
                    edit.get('position', {}).get('height', 100),
                    edit.get('style', {}).get('rotation', 0)
                )
            
            elif edit_type == 'highlight':
                editor.add_highlight(
                    page_num,
                    edit.get('position', {}).get('x', 0),
                    edit.get('position', {}).get('y', 0),
                    edit.get('position', {}).get('width', 100),
                    edit.get('position', {}).get('height', 20),
                    edit.get('content', ''),
                    edit.get('highlightType', 'highlight'),
                    edit.get('style', {})
                )
            
            elif edit_type == 'comment':
                editor.add_comment(
                    page_num,
                    edit.get('position', {}).get('x', 0),
                    edit.get('position', {}).get('y', 0),
                    edit.get('position', {}).get('width', 100),
                    edit.get('position', {}).get('height', 20),
                    edit.get('content', ''),
                    edit.get('style', {})
                )
            
            elif edit_type == 'redaction':
                editor.add_redaction(
                    page_num,
                    edit.get('position', {}).get('x', 0),
                    edit.get('position', {}).get('y', 0),
                    edit.get('position', {}).get('width', 100),
                    edit.get('position', {}).get('height', 20),
                    edit.get('reason', 'Redacted'),
                    edit.get('isPermanent', False)
                )
        
        # Save the document
        success = editor.save_document(output_path, optimize=True)
        editor.close()
        
        if success:
            file_size = os.path.getsize(output_path)
            return {
                "success": True,
                "filename": os.path.basename(output_path),
                "fileSize": file_size
            }
        else:
            return {"success": False, "error": "Failed to save document"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Missing arguments"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    edits_json = sys.argv[2]
    output_path = sys.argv[3]
    
    try:
        edits = json.loads(edits_json)
        result = process_pdf_edits(input_path, edits, output_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
