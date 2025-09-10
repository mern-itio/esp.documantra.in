
import fitz
import json
import base64
import os
from datetime import datetime

def add_annotation(document_id, annotation, page_number):
    try:
        # Find the document file
        uploads_dir = "/app/services/pdf-service/uploads"
        doc_files = [f for f in os.listdir(uploads_dir) if f.startswith(f"editor-") and document_id in f]
        
        if not doc_files:
            raise Exception("Document not found")
        
        doc_path = os.path.join(uploads_dir, doc_files[0])
        doc = fitz.open(doc_path)
        
        page = doc[page_number - 1]
        
        # Get annotation data
        pos = annotation.get('position', {})
        x = pos.get('x', 0)
        y = pos.get('y', 0)
        width = pos.get('width', 100)
        height = pos.get('height', 20)
        
        style = annotation.get('style', {})
        color = style.get('color', '#000000')
        stroke_width = style.get('strokeWidth', 1)
        opacity = style.get('opacity', 1.0)
        
        # Convert hex color to RGB
        if color.startswith('#'):
            color = color[1:]
        r = int(color[0:2], 16) / 255.0
        g = int(color[2:4], 16) / 255.0
        b = int(color[4:6], 16) / 255.0
        
        # Create rectangle
        rect = fitz.Rect(x, y, x + width, y + height)
        
        # Add annotation based on type
        if annotation['type'] == 'text':
            # Add text annotation
            annot = page.add_text_annot(rect.tl, annotation.get('content', ''))
            annot.set_colors(stroke=(r, g, b))
            annot.set_opacity(opacity)
            annot.update()
            
        elif annotation['type'] == 'highlight':
            # Add highlight annotation
            highlight_type = annotation.get('highlightType', 'highlight')
            
            if highlight_type == 'highlight':
                annot = page.add_highlight_annot(rect)
            elif highlight_type == 'underline':
                annot = page.add_underline_annot(rect)
            elif highlight_type == 'strikethrough':
                annot = page.add_strikeout_annot(rect)
            elif highlight_type == 'squiggly':
                annot = page.add_squiggly_annot(rect)
            
            annot.set_colors(stroke=(r, g, b))
            annot.set_opacity(opacity)
            annot.update()
            
        elif annotation['type'] == 'pen':
            # Add pen annotation (freehand drawing)
            points = annotation.get('path', [])
            if points:
                # Create a simple line for now
                point_list = [fitz.Point(p['x'], p['y']) for p in points]
                annot = page.add_ink_annot(point_list)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.set_border(width=stroke_width)
                annot.update()
                
        elif annotation['type'] == 'shape':
            # Add shape annotation
            shape_type = annotation.get('shapeType', 'rectangle')
            
            if shape_type == 'rectangle':
                annot = page.add_rect_annot(rect)
            elif shape_type == 'ellipse':
                annot = page.add_ellipse_annot(rect)
            elif shape_type == 'line':
                # Create line from points
                points = annotation.get('points', [])
                if len(points) >= 2:
                    start = fitz.Point(points[0]['x'], points[0]['y'])
                    end = fitz.Point(points[1]['x'], points[1]['y'])
                    annot = page.add_line_annot(start, end)
            
            annot.set_colors(stroke=(r, g, b))
            annot.set_opacity(opacity)
            annot.set_border(width=stroke_width)
            
            # Add fill if specified
            if style.get('fillColor'):
                fill_color = style['fillColor']
                if fill_color.startswith('#'):
                    fill_color = fill_color[1:]
                fill_r = int(fill_color[0:2], 16) / 255.0
                fill_g = int(fill_color[2:4], 16) / 255.0
                fill_b = int(fill_color[4:6], 16) / 255.0
                annot.set_colors(fill=(fill_r, fill_g, fill_b))
            
            annot.update()
            
        elif annotation['type'] == 'comment':
            # Add comment annotation
            annot = page.add_text_annot(rect.tl, annotation.get('comment', ''))
            annot.set_colors(stroke=(r, g, b))
            annot.set_opacity(opacity)
            annot.update()
        
        # Save the document
        doc.save(doc_path)
        doc.close()
        
        # Create updated annotation object
        updated_annotation = {
            "id": annotation.get('id', f"ann_{int(datetime.now().timestamp() * 1000)}"),
            "type": annotation['type'],
            "pageNumber": page_number,
            "position": pos,
            "content": annotation.get('content', ''),
            "style": style,
            "author": annotation.get('author', 'Current User'),
            "createdAt": datetime.now().toISOString(),
            "isLocked": False,
            "isVisible": True,
            "zIndex": 1
        }
        
        result = {
            "annotation": updated_annotation,
            "updatedDocument": True
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(f"Error adding annotation: {str(e)}")
        sys.exit(1)

# Main execution
if __name__ == "__main__":
    document_id = "doc_1756983364210"
    annotation = {"id":"ann_1756983392687_36r72wezc","type":"highlight","pageNumber":1,"position":{"x":294.20001220703125,"y":75,"width":100,"height":15},"content":"Highlighted text","style":{"color":"#000000","strokeWidth":1,"opacity":1,"thickness":2},"author":"Current User","createdAt":"2025-09-04T10:56:32.687Z","isLocked":false,"isVisible":true,"zIndex":1,"highlightType":"highlight"}
    page_number = 1
    
    add_annotation(document_id, annotation, page_number)
