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
import math
from datetime import datetime
from io import BytesIO
from PIL import Image
import tempfile


def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple (0-1 range)"""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        r = int(hex_color[0:2], 16) / 255.0
        g = int(hex_color[2:4], 16) / 255.0
        b = int(hex_color[4:6], 16) / 255.0
        return (r, g, b)
    elif len(hex_color) == 3:
        r = int(hex_color[0:1] * 2, 16) / 255.0
        g = int(hex_color[1:2] * 2, 16) / 255.0
        b = int(hex_color[2:3] * 2, 16) / 255.0
        return (r, g, b)
    else:
        return (0, 0, 0)  # Default to black

class EnhancedPDFEditor:
    def __init__(self, input_path):
        self.doc = fitz.open(input_path)
        self.input_path = input_path
        
    def add_text_element(self, page_num, text, x, y, width, height, style):
        """Add or modify text element in PDF"""
        try:
            page = self.doc[page_num - 1]
            
            # Set font properties
            font_size = style.get('fontSize', 12)
            font_family = style.get('fontFamily', 'helv')
            color = style.get('color', (0, 0, 0))
            flags = style.get('flags', 0)
            
            # Convert hex color to RGB
            if isinstance(color, str) and color.startswith('#'):
                color = self.hex_to_rgb(color)
            
            # For replaceText operations, add a white background rectangle to cover old text
            if hasattr(self, '_is_replace_text') and self._is_replace_text:
                # Create rectangle for the text area
                rect = fitz.Rect(x, y, x + width, y + height)
                # Add white rectangle to cover old text
                page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))
            
            # Enhanced font mapping with Liberation fonts
            font_map = {
                'Helvetica': 'helv',
                'Helvetica-Bold': 'hebo',
                'Helvetica-Oblique': 'heit',
                'Helvetica-BoldOblique': 'hebi',
                'Times-Roman': 'tiro',
                'Times-Bold': 'tibo',
                'Times-Italic': 'tiit',
                'Times-BoldItalic': 'tibi',
                'Courier': 'cour',
                'Courier-Bold': 'cobo',
                'Courier-Oblique': 'coit',
                'Courier-BoldOblique': 'cobi',
                'DejaVuSans': 'helv',
                'DejaVuSans-Bold': 'hebo',
                'DejaVuSans-Oblique': 'heit',
                'DejaVuSans-BoldOblique': 'hebi',
                # Add Liberation font mappings
                'LiberationSans': 'helv',
                'LiberationSans-Bold': 'hebo',
                'LiberationSans-Italic': 'heit',
                'LiberationSans-BoldItalic': 'hebi',
                'LiberationSerif': 'tiro',
                'LiberationSerif-Bold': 'tibo',
                'LiberationSerif-Italic': 'tiit',
                'LiberationSerif-BoldItalic': 'tibi',
                'LiberationMono': 'cour',
                'LiberationMono-Bold': 'cobo',
                'LiberationMono-Italic': 'coit',
                'LiberationMono-BoldItalic': 'cobi'
            }
            
            # Get mapped font or default to helv
            mapped_font = font_map.get(font_family, 'helv')
            
            # Extract bold and italic from flags if present
            is_bold = bool(flags & (1 << 18))  # Flag bit 18 = superscript, but often used for bold
            is_italic = bool(flags & (1 << 6))  # Flag bit 6 = italic
            
            # Alternative: Check if flags == 20 (common bold flag)
            if flags == 20:
                is_bold = True
            if flags == 64:
                is_italic = True
            
            print(f"Font processing - Original: {font_family}, Flags: {flags}, Bold: {is_bold}, Italic: {is_italic}, Mapped: {mapped_font}", file=sys.stderr)
            
            # Apply flags to determine correct font variant ONLY if not already in font name
            if mapped_font in ['helv', 'tiro', 'cour']:  # Base fonts only
                base_font = mapped_font
                
                if 'helv' in base_font:
                    if is_bold and is_italic:
                        mapped_font = 'hebi'
                    elif is_bold:
                        mapped_font = 'hebo'
                    elif is_italic:
                        mapped_font = 'heit'
                    else:
                        mapped_font = 'helv'
                elif 'ti' in base_font or 'tiro' in base_font:
                    if is_bold and is_italic:
                        mapped_font = 'tibi'
                    elif is_bold:
                        mapped_font = 'tibo'
                    elif is_italic:
                        mapped_font = 'tiit'
                    else:
                        mapped_font = 'tiro'
                elif 'co' in base_font or 'cour' in base_font:
                    if is_bold and is_italic:
                        mapped_font = 'cobi'
                    elif is_bold:
                        mapped_font = 'cobo'
                    elif is_italic:
                        mapped_font = 'coit'
                    else:
                        mapped_font = 'cour'
            
            print(f"Final mapped font: {mapped_font}", file=sys.stderr)
            
            # Create text insertion point (adjust for baseline)
            point = fitz.Point(x, y + font_size * 0.8) 

            # Insert text with error handling
            try:
                page.insert_text(
                    point,
                    text,
                    fontsize=font_size,
                    color=color,
                    fontname=mapped_font
                )
                return True
            except Exception as text_error:
                print(f"Text insertion failed with {mapped_font}: {text_error}", file=sys.stderr)
                # Try with fallback font if original font fails
                try:
                    fallback = 'hebo' if is_bold else 'helv'
                    page.insert_text(
                        point,
                        text,
                        fontsize=font_size,
                        color=color,
                        fontname=fallback
                    )
                    print(f"Successfully inserted with fallback: {fallback}", file=sys.stderr)
                    return True
                except Exception as fallback_error:
                    print(f"Fallback also failed: {fallback_error}", file=sys.stderr)
                    return False
            
        except Exception as e:
            print(f"Error adding text element: {e}", file=sys.stderr)
            return False
        
    def add_drawing_element(self, page_num, element_type, points, style):
        """Add drawing element (pen, shapes) to PDF"""
        try:
            page = self.doc[page_num - 1]
            
            # Convert color to RGB format
            color_hex = style.get('color', '#000000')
            if isinstance(color_hex, str) and color_hex.startswith('#'):
                color = hex_to_rgb(color_hex)
            else:
                color = (0, 0, 0)  # Default to black
            
            if element_type == 'pen':
                # Draw freehand path
                if len(points) > 1:
                    # Draw line segments between consecutive points
                    for i in range(1, len(points)):
                        start_point = fitz.Point(points[i-1]['x'], points[i-1]['y'])
                        end_point = fitz.Point(points[i]['x'], points[i]['y'])
                        
                        # Draw line segment
                        page.draw_line(
                            start_point,
                            end_point,
                            color=color,
                            width=style.get('strokeWidth', 2)
                        )
            
            elif element_type == 'rectangle' or element_type == 'square':
                if len(points) >= 2:
                    rect = fitz.Rect(
                        min(p['x'] for p in points),
                        min(p['y'] for p in points),
                        max(p['x'] for p in points),
                        max(p['y'] for p in points)
                    )
                    page.draw_rect(
                        rect,
                        color=color,
                        width=style.get('strokeWidth', 2),
                        fill=style.get('fillColor', None)
                    )
            
            elif element_type == 'ellipse' or element_type == 'circle':
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
            
            elif element_type == 'pen':
                # Draw freehand path
                if len(points) >= 2:
                    # Create a path from the points
                    path = fitz.Path()
                    path.move_to(fitz.Point(points[0]['x'], points[0]['y']))
                    
                    # Add line segments for each subsequent point
                    for i in range(1, len(points)):
                        path.line_to(fitz.Point(points[i]['x'], points[i]['y']))
                    
                    # Draw the path
                    page.draw_path(
                        path,
                        color=style.get('color', (0, 0, 0)),
                        width=style.get('strokeWidth', 2),
                        fill=None
                    )
            
            return True
        except Exception as e:
            # print(f"Error adding drawing element: {e}")
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
            # print(f"Error adding image element: {e}")
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
            # print(f"Error adding redaction: {e}")
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
            # print(f"Error adding highlight: {e}")
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
            # print(f"Error adding comment: {e}")
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
            # print(f"Error saving document: {e}")
            return False
    
    def close(self):
        """Close the document"""
        self.doc.close()
    
    def extract_text_style(self, page_num, x, y, width, height):
        """Extract text style from a specific region in the PDF"""
        try:
            page = self.doc[page_num - 1]
            
            # Create rectangle for the text area with some padding for better detection
            padding = 2
            rect = fitz.Rect(x - padding, y - padding, x + width + padding, y + height + padding)
            
            # Extract text with detailed information
            text_dict = page.get_text("dict", clip=rect)
            
            style = {}
            
            # Look through blocks to find text
            if "blocks" in text_dict:
                for block in text_dict["blocks"]:
                    if block.get("type") == 0:  # Text block
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                # Extract font properties
                                style['fontSize'] = span.get('size', 12)
                                style['fontFamily'] = span.get('font', 'Helvetica')
                                
                                # Extract color (RGB)
                                color = span.get('color', 0)
                                if isinstance(color, int):
                                    # Convert integer color to RGB tuple
                                    r = ((color >> 16) & 255) / 255.0
                                    g = ((color >> 8) & 255) / 255.0
                                    b = (color & 255) / 255.0
                                    style['color'] = (r, g, b)
                                
                                # Extract font flags
                                style['flags'] = span.get('flags', 0)
                                
                                # Return the first span's style found
                                return style
            
            # Return default style if nothing found
            return {
                'fontSize': 12,
                'fontFamily': 'Helvetica',
                'color': (0, 0, 0),
                'flags': 0
            }
            
        except Exception as e:
            print(f"Error extracting text style: {e}", file=sys.stderr)
            return {
                'fontSize': 12,
                'fontFamily': 'Helvetica',
                'color': (0, 0, 0),
                'flags': 0
            }
        
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
            
            elif edit_type == 'addText':
                # Handle addText operations from frontend
                editor.add_text_element(
                    page_num,
                    edit.get('text', ''),
                    edit.get('position', {}).get('x', 0),
                    edit.get('position', {}).get('y', 0),
                    edit.get('position', {}).get('width', 100),
                    edit.get('position', {}).get('height', 20),
                    edit.get('style', {})
                )
            
            elif edit_type == 'replaceText':
                position = edit.get('position', {})
                
                # Extract original text style from the PDF
                original_style = editor.extract_text_style(
                    page_num,
                    position.get('x', 0),
                    position.get('y', 0),
                    position.get('width', 100),
                    position.get('height', 20)
                )
                
                # Get frontend style (should contain the extracted style)
                frontend_style = edit.get('style', {})
                
                # Frontend style should OVERRIDE original if provided
                # This ensures we use the style that was sent from frontend
                final_style = {**original_style, **frontend_style}
                
                print(f"Using style: {final_style}", file=sys.stderr)

                editor._is_replace_text = True
                # Add the new text with the extracted styling
                editor.add_text_element(
                    page_num,
                    edit.get('newText', ''),
                    position.get('x', 0),
                    position.get('y', 0),
                    position.get('width', 100),
                    position.get('height', 20),
                    final_style  # ✅ Use the extracted and merged style
                )
                # Reset flag
                editor._is_replace_text = False
            
            elif edit_type == 'pen' or edit_type == 'shape':
                editor.add_drawing_element(
                    page_num,
                    edit_type,
                    edit.get('points', []),
                    edit.get('style', {})
                )
            
            elif edit_type == 'addShape':
                # Handle addShape operations from frontend
                shape_type = edit.get('shapeType', 'square')
                style = edit.get('style', {})
                
                # For pen drawings, skip position calculation
                if shape_type == 'pen':
                    points = edit.get('points', [])
                else:
                    # For other shapes, calculate position
                    position = edit.get('position', {})
                    x = position.get('x', 0)
                    y = position.get('y', 0)
                    width = position.get('width', 50)
                    height = position.get('height', 50)
                
                
                # Create points based on shape type (only for non-pen shapes)
                if shape_type != 'pen':
                    if shape_type == 'square' or shape_type == 'rectangle':
                        points = [
                            {'x': x, 'y': y},
                            {'x': x + width, 'y': y},
                            {'x': x + width, 'y': y + height},
                            {'x': x, 'y': y + height},
                            {'x': x, 'y': y}  # Close the rectangle
                        ]
                    elif shape_type == 'circle':
                        # For circle, create points around the circumference
                        center_x = x + width / 2
                        center_y = y + height / 2
                        radius = min(width, height) / 2
                        points = []
                        for i in range(0, 360, 10):
                            angle = math.radians(i)
                            px = center_x + radius * math.cos(angle)
                            py = center_y + radius * math.sin(angle)
                            points.append({'x': px, 'y': py})
                    elif shape_type == 'line':
                        points = [
                            {'x': x, 'y': y},
                            {'x': x + width, 'y': y + height}
                        ]
                    else:
                        # Default to rectangle
                        points = [
                            {'x': x, 'y': y},
                            {'x': x + width, 'y': y},
                            {'x': x + width, 'y': y + height},
                            {'x': x, 'y': y + height},
                            {'x': x, 'y': y}
                        ]
                
                # For pen drawings, use 'pen' as element_type, otherwise use shape_type
                element_type = 'pen' if shape_type == 'pen' else shape_type
                editor.add_drawing_element(
                    page_num,
                    element_type,
                    points,
                    style
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
    edits_file = sys.argv[2]
    output_path = sys.argv[3]
    
    try:
        # Read edits from file
        with open(edits_file, 'r') as f:
            edits = json.load(f)
        
        result = process_pdf_edits(input_path, edits, output_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
