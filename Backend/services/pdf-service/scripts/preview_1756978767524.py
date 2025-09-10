
import fitz
import re
import json
import sys

def preview_highlights(input_path, search_text, use_regex=False, case_sensitive=True):
    try:
        doc = fitz.open(input_path)
        matches = []
        pages = {}
        
        print(f"Searching for: {search_text}")
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            if not search_text:
                continue
                
            # Prepare search pattern
            if use_regex:
                try:
                    flags = 0 if case_sensitive else re.IGNORECASE
                    pattern = re.compile(search_text, flags)
                except re.error as e:
                    print(f"Invalid regex pattern: {e}")
                    continue
            else:
                pattern = re.compile(re.escape(search_text), 0 if case_sensitive else re.IGNORECASE)
            
            # Find matches
            for match in pattern.finditer(text):
                match_text = match.group()
                start_pos = match.start()
                end_pos = match.end()
                
                # Get context
                context_start = max(0, start_pos - 50)
                context_end = min(len(text), end_pos + 50)
                context = text[context_start:context_end]
                
                # Get coordinates (approximate)
                rects = page.search_for(match_text)
                if rects:
                    rect = rects[0]
                    x, y, width, height = rect.x0, rect.y0, rect.width, rect.height
                else:
                    x, y, width, height = 100, 100, 100, 20
                
                match_data = {
                    "text": match_text,
                    "position": start_pos,
                    "page": page_num + 1,
                    "context": context,
                    "contextStart": context_start,
                    "contextEnd": context_end,
                    "matchStart": start_pos - context_start,
                    "matchEnd": end_pos - context_start,
                    "coordinates": {
                        "x": x,
                        "y": y,
                        "width": width,
                        "height": height
                    }
                }
                
                matches.append(match_data)
                
                # Group by page
                if page_num + 1 not in pages:
                    pages[page_num + 1] = []
                pages[page_num + 1].append(match_data)
        
        # Convert pages to array format
        pages_array = []
        for page_num in sorted(pages.keys()):
            pages_array.append({
                "page": page_num,
                "matchCount": len(pages[page_num]),
                "matches": pages[page_num]
            })
        
        result = {
            "totalMatches": len(matches),
            "matches": matches,
            "pages": pages_array,
            "extractedText": text[:1000] if 'text' in locals() else ""
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(f"Error previewing highlights: {str(e)}")
        sys.exit(1)
    finally:
        if 'doc' in locals():
            doc.close()

# Main execution
if __name__ == "__main__":
    input_path = "/app/services/pdf-service/uploads/highlight-1756978767358-730187933-dummy-pdf_2.pdf"
    search_text = "dummy"
    use_regex = false
    case_sensitive = false
    
    preview_highlights(input_path, search_text, use_regex, case_sensitive)
