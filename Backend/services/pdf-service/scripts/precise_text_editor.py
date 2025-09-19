#!/usr/bin/env python3
"""
Precise text editing for PDF documents - replaces existing text at exact coordinates
"""

import sys
import json
import fitz  # PyMuPDF
import os
import tempfile
from datetime import datetime

class PreciseTextEditor:
    def __init__(self, input_path):
        self.doc = fitz.open(input_path)
        self.input_path = input_path
        
    def replace_text_at_position(self, page_num, old_text, new_text, x, y, width, height, style=None):
        """
        Replace text at specific position with new text using precise coordinates
        """
        try:
            # Validate inputs
            if page_num < 1 or page_num > self.doc.page_count:
                raise ValueError(f"Page number {page_num} is out of range (1-{self.doc.page_count})")
            
            if not new_text:
                raise ValueError("New text cannot be empty")
            
            page = self.doc[page_num - 1]
            
            # Get page dimensions for validation
            page_rect = page.rect
            page_width = page_rect.width
            page_height = page_rect.height
            
            # Validate coordinates
            if x < 0 or y < 0 or width <= 0 or height <= 0:
                raise ValueError(f"Invalid coordinates: x={x}, y={y}, width={width}, height={height}")
            
            # Check if coordinates are within page bounds
            if x + width > page_width or y + height > page_height:
                raise ValueError(f"Coordinates exceed page bounds: x={x}, y={y}, width={width}, height={height}, page_size=({page_width}, {page_height})")
            
            # Round coordinates to avoid precision issues
            x, y, width, height = round(x, 2), round(y, 2), round(width, 2), round(height, 2)
            
            # Create rectangle for the text area
            rect = fitz.Rect(x, y, x + width, y + height)
            
            # Add white rectangle to cover old text
            page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))
            
            # Set font properties
            font_size = style.get('fontSize', 12) if style else 12
            font_family = style.get('fontFamily', 'helv') if style else 'helv'
            color = style.get('color', (0, 0, 0)) if style else (0, 0, 0)
            
            # Convert hex color to RGB if needed
            if isinstance(color, str) and color.startswith('#'):
                color = self.hex_to_rgb(color)
            
            # Font fallback - use standard fonts if custom font fails
            font_fallback = ['helv', 'times', 'courier', 'symbol', 'zapf']
            if font_family not in font_fallback:
                font_family = 'helv'  # Use Helvetica as fallback
            
            # Create text insertion point (adjust for baseline)
            point = fitz.Point(x, y + font_size * 0.8)  # Adjust for font baseline
            
            # Insert new text with error handling
            try:
                page.insert_text(
                    point,
                    new_text,
                    fontsize=font_size,
                    color=color,
                    fontname=font_family
                )
                return True
            except Exception as text_error:
                # Try with fallback font if original font fails
                try:
                    page.insert_text(
                        point,
                        new_text,
                        fontsize=font_size,
                        color=color,
                        fontname='helv'  # Use Helvetica as fallback
                    )
                    return True
                except Exception as fallback_error:
                    raise Exception(f"Text insertion failed with original font '{font_family}': {text_error}. Fallback font also failed: {fallback_error}")
        except Exception as e:
            # Return error details instead of just False
            return {"error": f"Error in replace_text_at_position: {str(e)}"}
    
    def add_text_element(self, page_num, text, x, y, width, height, style=None):
        """
        Add new text element to PDF
        """
        try:
            page = self.doc[page_num - 1]
            
            # Set font properties
            font_size = style.get('fontSize', 12) if style else 12
            font_family = style.get('fontFamily', 'helv') if style else 'helv'
            color = style.get('color', (0, 0, 0)) if style else (0, 0, 0)
            
            # Convert hex color to RGB if needed
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
            return False
    
    def add_image_element(self, page_num, image_data, x, y, width, height, rotation=0):
        """
        Add image element to PDF
        """
        try:
            page = self.doc[page_num - 1]
            
            # Decode base64 image data
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            import base64
            image_bytes = base64.b64decode(image_data)
            
            # Create temporary file for image
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                temp_file.write(image_bytes)
                temp_path = temp_file.name
            
            try:
                # Insert image
                rect = fitz.Rect(x, y, x + width, y + height)
                page.insert_image(rect, filename=temp_path)
                
                return True
            finally:
                # Clean up temporary file
                os.unlink(temp_path)
                
        except Exception as e:
            return False
    
    def add_drawing_element(self, page_num, element_type, points, style=None):
        """
        Add drawing elements (shapes, lines, etc.)
        """
        try:
            page = self.doc[page_num - 1]
            
            color = style.get('color', (0, 0, 0)) if style else (0, 0, 0)
            stroke_width = style.get('strokeWidth', 2) if style else 2
            
            if isinstance(color, str) and color.startswith('#'):
                color = self.hex_to_rgb(color)
            
            if element_type == 'rectangle':
                if len(points) >= 2:
                    rect = fitz.Rect(
                        min(p['x'] for p in points),
                        min(p['y'] for p in points),
                        max(p['x'] for p in points),
                        max(p['y'] for p in points)
                    )
                    page.draw_rect(rect, color=color, width=stroke_width)
            
            elif element_type == 'ellipse':
                if len(points) >= 2:
                    rect = fitz.Rect(
                        min(p['x'] for p in points),
                        min(p['y'] for p in points),
                        max(p['x'] for p in points),
                        max(p['y'] for p in points)
                    )
                    page.draw_oval(rect, color=color, width=stroke_width)
            
            elif element_type == 'line':
                if len(points) >= 2:
                    page.draw_line(
                        fitz.Point(points[0]['x'], points[0]['y']),
                        fitz.Point(points[1]['x'], points[1]['y']),
                        color=color,
                        width=stroke_width
                    )
            
            return True
        except Exception as e:
            return False
    
    def hex_to_rgb(self, hex_color):
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    
    def save_document(self, output_path, optimize=True):
        """Save document with optimization"""
        try:
            if optimize:
                self.doc.save(
                    output_path,
                    garbage=4,
                    deflate=True,
                    clean=True,
                    linear=True,
                    expand=0
                )
            else:
                self.doc.save(output_path)
            
            return True
        except Exception as e:
            return False
    
    def close(self):
        """Close the document"""
        self.doc.close()

def process_text_edits(input_path, edits, output_path):
    """Process text edits and save result"""
    try:
        editor = PreciseTextEditor(input_path)
        
        for edit in edits:
            edit_type = edit.get('type')
            page_num = edit.get('pageNumber', 1)
            
            if edit_type == 'replaceText':
                # Extract edit data with validation
                old_text = edit.get('oldText', '')
                new_text = edit.get('newText', '')
                position = edit.get('position', {})
                x = position.get('x', 0)
                y = position.get('y', 0)
                width = position.get('width', 100)
                height = position.get('height', 20)
                style = edit.get('style', {})
                
                # Debug info (commented out to avoid JSON interference)
                # print(f"Processing replaceText: page={page_num}, old='{old_text}', new='{new_text}', pos=({x},{y},{width},{height})")
                
                result = editor.replace_text_at_position(
                    page_num,
                    old_text,
                    new_text,
                    x, y, width, height,
                    style
                )
                if result != True:
                    if isinstance(result, dict) and 'error' in result:
                        return {"success": False, "error": f"Failed to replace text on page {page_num}: {result['error']}"}
                    else:
                        return {"success": False, "error": f"Failed to replace text on page {page_num}: old='{old_text}' -> new='{new_text}' at position ({x},{y},{width},{height})"}
            
            elif edit_type == 'addText':
                editor.add_text_element(
                    page_num,
                    edit.get('text', ''),
                    edit.get('position', {}).get('x', 0),
                    edit.get('position', {}).get('y', 0),
                    edit.get('position', {}).get('width', 100),
                    edit.get('position', {}).get('height', 20),
                    edit.get('style', {})
                )
            
            elif edit_type == 'addImage':
                editor.add_image_element(
                    page_num,
                    edit.get('imageData', ''),
                    edit.get('position', {}).get('x', 0),
                    edit.get('position', {}).get('y', 0),
                    edit.get('position', {}).get('width', 100),
                    edit.get('position', {}).get('height', 100),
                    edit.get('style', {}).get('rotation', 0)
                )
            
            elif edit_type == 'addShape':
                editor.add_drawing_element(
                    page_num,
                    edit.get('shapeType', 'rectangle'),
                    edit.get('points', []),
                    edit.get('style', {})
                )
        
        # Save the document
        success = editor.save_document(output_path, optimize=False)
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
    edits_file = sys.argv[2]
    output_path = sys.argv[3]
    
    try:
        # Read edits from file
        with open(edits_file, 'r', encoding='utf-8') as f:
            edits = json.load(f)
        
        result = process_text_edits(input_path, edits, output_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
