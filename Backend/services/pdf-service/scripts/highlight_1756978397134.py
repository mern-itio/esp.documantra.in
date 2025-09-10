
import fitz
import json
import sys
import os

def highlight_pdf(input_path, output_path, highlights, preserve_layout=True, output_format='pdf'):
    try:
        # Open the PDF
        doc = fitz.open(input_path)
        
        print(f"Processing {len(highlights)} highlights...")
        
        # Process each highlight
        for i, highlight in enumerate(highlights):
            page_num = highlight['pageNumber'] - 1  # Convert to 0-based index
            
            if page_num >= len(doc):
                print(f"Warning: Page {highlight['pageNumber']} does not exist")
                continue
                
            page = doc[page_num]
            
            # Get highlight style
            style = highlight.get('style', {})
            color = style.get('color', '#FFFF00')
            opacity = style.get('opacity', 0.3)
            highlight_type = style.get('type', 'highlight')
            thickness = style.get('thickness', 1)
            
            # Convert hex color to RGB
            if color.startswith('#'):
                color = color[1:]
            r = int(color[0:2], 16) / 255.0
            g = int(color[2:4], 16) / 255.0
            b = int(color[4:6], 16) / 255.0
            
            # Get position
            pos = highlight.get('position', {})
            x = pos.get('x', 0)
            y = pos.get('y', 0)
            width = pos.get('width', 100)
            height = pos.get('height', 20)
            
            # Create rectangle
            rect = fitz.Rect(x, y, x + width, y + height)
            
            # Apply highlight based on type
            if highlight_type == 'highlight':
                # Create highlight annotation
                annot = page.add_highlight_annot(rect)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.update()
                
            elif highlight_type == 'underline':
                # Create underline annotation
                annot = page.add_underline_annot(rect)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.set_border(width=thickness)
                annot.update()
                
            elif highlight_type == 'strikethrough':
                # Create strikethrough annotation
                annot = page.add_strikeout_annot(rect)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.set_border(width=thickness)
                annot.update()
                
            elif highlight_type == 'squiggly':
                # Create squiggly underline annotation
                annot = page.add_squiggly_annot(rect)
                annot.set_colors(stroke=(r, g, b))
                annot.set_opacity(opacity)
                annot.set_border(width=thickness)
                annot.update()
            
            print(f"Added {highlight_type} highlight {i+1}/{len(highlights)} on page {highlight['pageNumber']}")
        
        # Save the document
        if output_format == 'pdfa':
            doc.save(output_path, garbage=4, deflate=True, clean=True)
        else:
            doc.save(output_path)
        
        doc.close()
        
        print(f"Highlighted PDF saved to: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error highlighting PDF: {str(e)}")
        return False

# Main execution
if __name__ == "__main__":
    input_path = "/app/services/pdf-service/uploads/highlight-1756978397126-956656266-dummy-pdf_2.pdf"
    output_path = "/app/services/pdf-service/uploads/highlighted-1756978397134.pdf"
    highlights = [{"id":"highlight_1756978331872_6467tmue5","text":"dummy","pageNumber":1,"position":{"x":100,"y":100,"width":200,"height":20},"style":{"color":"#FFFF00","opacity":0.3,"type":"highlight","thickness":1},"author":"Current User","createdAt":"2025-09-04T09:32:11.872Z"}]
    preserve_layout = true
    output_format = "pdf"
    
    success = highlight_pdf(input_path, output_path, highlights, preserve_layout, output_format)
    
    if success:
        print("Highlighting completed successfully")
    else:
        print("Highlighting failed")
        sys.exit(1)
