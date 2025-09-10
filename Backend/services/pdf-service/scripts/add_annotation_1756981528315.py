
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
    document_id = "doc_1756981443397"
    annotation = {"id":"ann_1756981528211_4nja95f00","type":"pen","pageNumber":1,"position":{"x":288.20001220703125,"y":125.19998168945312,"width":125,"height":127},"content":"","style":{"color":"#000000","strokeWidth":1,"opacity":1},"author":"Current User","createdAt":"2025-09-04T10:25:28.211Z","isLocked":false,"isVisible":true,"zIndex":1,"path":[{"x":288.20001220703125,"y":125.19998168945312},{"x":290.20001220703125,"y":127.19998168945312},{"x":295.20001220703125,"y":132.19998168945312},{"x":302.20001220703125,"y":139.19998168945312},{"x":306.20001220703125,"y":142.19998168945312},{"x":310.20001220703125,"y":146.19998168945312},{"x":315.20001220703125,"y":152.19998168945312},{"x":317.20001220703125,"y":152.19998168945312},{"x":320.20001220703125,"y":156.19998168945312},{"x":322.20001220703125,"y":157.19998168945312},{"x":325.20001220703125,"y":160.19998168945312},{"x":327.20001220703125,"y":160.19998168945312},{"x":328.20001220703125,"y":161.19998168945312},{"x":331.20001220703125,"y":164.19998168945312},{"x":332.20001220703125,"y":166.19998168945312},{"x":334.20001220703125,"y":167.19998168945312},{"x":336.20001220703125,"y":169.19998168945312},{"x":337.20001220703125,"y":170.19998168945312},{"x":339.20001220703125,"y":172.19998168945312},{"x":343.20001220703125,"y":176.19998168945312},{"x":344.20001220703125,"y":176.19998168945312},{"x":347.20001220703125,"y":177.19998168945312},{"x":348.20001220703125,"y":180.19998168945312},{"x":352.20001220703125,"y":184.19998168945312},{"x":355.20001220703125,"y":186.19998168945312},{"x":356.20001220703125,"y":188.19998168945312},{"x":358.20001220703125,"y":190.19998168945312},{"x":360.20001220703125,"y":192.19998168945312},{"x":362.20001220703125,"y":195.19998168945312},{"x":367.20001220703125,"y":200.19998168945312},{"x":369.20001220703125,"y":203.19998168945312},{"x":370.20001220703125,"y":205.19998168945312},{"x":371.20001220703125,"y":207.19998168945312},{"x":373.20001220703125,"y":208.19998168945312},{"x":374.20001220703125,"y":208.19998168945312},{"x":375.20001220703125,"y":210.19998168945312},{"x":377.20001220703125,"y":212.19998168945312},{"x":381.20001220703125,"y":216.19998168945312},{"x":383.20001220703125,"y":217.19998168945312},{"x":385.20001220703125,"y":220.19998168945312},{"x":387.20001220703125,"y":224.19998168945312},{"x":394.20001220703125,"y":229.19998168945312},{"x":398.20001220703125,"y":233.19998168945312},{"x":400.20001220703125,"y":236.19998168945312},{"x":404.20001220703125,"y":241.19998168945312},{"x":407.20001220703125,"y":244.19998168945312},{"x":411.20001220703125,"y":248.19998168945312},{"x":412.20001220703125,"y":250.19998168945312},{"x":413.20001220703125,"y":250.19998168945312},{"x":413.20001220703125,"y":252.19998168945312}]}
    page_number = 1
    
    add_annotation(document_id, annotation, page_number)
