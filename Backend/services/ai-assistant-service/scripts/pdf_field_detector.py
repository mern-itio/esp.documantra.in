#!/usr/bin/env python3
"""
Enhanced PDF Form Field Detector using PyMuPDF and pdfplumber
This script provides accurate form field detection using multiple techniques:
1. PyMuPDF for form field extraction (if PDF has fillable forms)
2. pdfplumber for text and layout analysis
3. Pattern matching for common field labels
4. AI analysis for complex cases

Usage:
    python pdf_field_detector.py <pdf_path> [--output output.json]
"""

import sys
import json
import argparse
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import os
import base64

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False
    print("Error: PyMuPDF (fitz) not installed. Install with: pip install pymupdf", file=sys.stderr)
    sys.exit(1)

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    print("Error: pdfplumber not installed. Install with: pip install pdfplumber", file=sys.stderr)
    sys.exit(1)

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    print("Warning: OpenAI not installed. AI analysis will be disabled.", file=sys.stderr)


class PDFFieldDetector:
    """Enhanced PDF form field detector using PyMuPDF and pdfplumber"""
    
    def __init__(self, use_ai: bool = True, openai_api_key: Optional[str] = None):
        self.use_ai = use_ai and HAS_OPENAI
        self.openai_client = None
        if self.use_ai and openai_api_key:
            self.openai_client = OpenAI(api_key=openai_api_key)
        elif self.use_ai:
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                self.openai_client = OpenAI(api_key=api_key)
            else:
                self.use_ai = False
    
    def detect_fields(self, pdf_path: str) -> Dict[str, Any]:
        """Detect form fields in PDF using multiple methods"""
        all_suggestions = []
        
        # Method 1: Use PyMuPDF to extract existing form fields
        form_fields = self._extract_existing_form_fields(pdf_path)
        
        # Method 2: Use pdfplumber for text-based field detection
        text_based_fields = self._detect_fields_from_text(pdf_path)
        
        # Method 3: Pattern matching for common field patterns
        pattern_fields = self._detect_fields_by_patterns(pdf_path)
        
        # Combine all methods
        all_suggestions.extend(form_fields)
        all_suggestions.extend(text_based_fields)
        all_suggestions.extend(pattern_fields)
        
        # Deduplicate
        deduplicated = self._deduplicate_suggestions(all_suggestions)
        
        # Use AI for final refinement if available
        if self.use_ai and len(deduplicated) > 0:
            ai_refined = self._refine_with_ai(pdf_path, deduplicated)
            if ai_refined:
                deduplicated = ai_refined
        
        return {
            'success': True,
            'suggestions': deduplicated,
            'totalPages': self._get_page_count(pdf_path)
        }
    
    def _extract_existing_form_fields(self, pdf_path: str) -> List[Dict]:
        """Extract existing fillable form fields from PDF"""
        fields = []
        if not HAS_FITZ:
            return fields
        
        try:
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                widget_list = page.widgets()
                
                for widget in widget_list:
                    rect = widget.rect
                    field_type = self._map_widget_type(widget.field_type)
                    
                    if field_type:
                        fields.append({
                            'page': page_num + 1,
                            'x': rect.x0,
                            'y': rect.y0,
                            'width': rect.width,
                            'height': rect.height,
                            'type': field_type,
                            'confidence': 1.0,  # Existing fields have 100% confidence
                            'reason': f'Existing form field: {widget.field_name or "unnamed"}',
                            'context': widget.field_value or ''
                        })
            
            doc.close()
        except Exception as e:
            print(f"Error extracting form fields: {e}", file=sys.stderr)
        
        return fields
    
    def _map_widget_type(self, widget_type: int) -> Optional[str]:
        """Map PyMuPDF widget type to our field type"""
        type_map = {
            2: 'text',      # Text field
            3: 'checkbox',  # Checkbox
            4: 'radio',     # Radio button
            5: 'dropdown',  # Dropdown
        }
        return type_map.get(widget_type)
    
    def _detect_fields_from_text(self, pdf_path: str) -> List[Dict]:
        """Detect fields by analyzing text content and layout"""
        fields = []
        if not HAS_PDFPLUMBER:
            return fields
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    words = page.extract_words()
                    
                    # Field label patterns
                    patterns = {
                        'signature': [
                            r'signature\s*:',
                            r'sign\s+here\s*:',
                            r'signature\s+line\s*:',
                            r'signature\s+of\s*:',
                        ],
                        'date': [
                            r'date\s*:',
                            r'dated\s*:',
                            r'date\s+signed\s*:',
                            r'execution\s+date\s*:',
                        ],
                        'name': [
                            r'name\s*:',
                            r'full\s+name\s*:',
                            r'printed\s+name\s*:',
                            r'candidate\s+name\s*:',
                            r'signer\s+name\s*:',
                        ],
                        'email': [
                            r'email\s*:',
                            r'e-mail\s*:',
                            r'email\s+address\s*:',
                        ],
                        'initial': [
                            r'initial\s*:',
                            r'initials\s*:',
                        ],
                        'company': [
                            r'company\s*:',
                            r'company\s+name\s*:',
                        ],
                        'title': [
                            r'title\s*:',
                            r'job\s+title\s*:',
                        ],
                        'phone': [
                            r'phone\s*:',
                            r'phone\s+number\s*:',
                            r'telephone\s*:',
                        ],
                    }
                    
                    # Find field labels in text
                    for field_type, pattern_list in patterns.items():
                        for pattern in pattern_list:
                            matches = re.finditer(pattern, text, re.IGNORECASE)
                            for match in matches:
                                # Find the word position
                                match_text = match.group(0)
                                for word in words:
                                    if match_text.lower() in word['text'].lower():
                                        # Check if there's a blank space or underscore after
                                        x0, y0 = word['x0'], word['top']
                                        x1, y1 = word['x1'], word['bottom']
                                        
                                        # Look for blank space or underscore indicator
                                        field_pos = self._find_field_position_after_label(
                                            words, word, x1, y0, page.width, page.height
                                        )
                                        
                                        if field_pos:
                                            fields.append({
                                                'page': page_num + 1,
                                                'x': field_pos['x'],
                                                'y': field_pos['y'],
                                                'width': field_pos.get('width', 150),
                                                'height': field_pos.get('height', 30),
                                                'type': field_type,
                                                'confidence': field_pos.get('confidence', 0.85),
                                                'reason': f'Found {field_type} label: "{match_text}"{field_pos.get("has_underline", False) and " with underline" or ""}',
                                                'context': text[max(0, match.start()-50):match.end()+50]
                                            })
                                        break
        except Exception as e:
            print(f"Error in text-based detection: {e}", file=sys.stderr)
        
        return fields
    
    def _has_field_indicator(self, words: List[Dict], x: float, y: float, 
                             page_width: float, page_height: float) -> bool:
        """Check if there's a field indicator (blank space, underscore) near the label"""
        # Look for words with underscores or check nearby area for blank space
        for word in words:
            # Check if word is to the right of the label (within reasonable distance)
            if (word['x0'] > x and word['x0'] < x + 200 and 
                abs(word['top'] - y) < 20):
                # Check if it contains underscores, dashes, or is blank (field indicator)
                text = word['text'].strip()
                if '_' in text or '-' in text or len(text) == 0 or re.match(r'^[_\-\s\.]+$', text):
                    return True
        # Also check for blank space (gap between words)
        for word in words:
            if word['x0'] > x and word['x0'] < x + 300 and abs(word['top'] - y) < 20:
                gap = word['x0'] - x
                if gap > 30:  # Significant gap suggests blank space
                    return True
        return True  # Default to True if label found
    
    def _find_field_position_after_label(self, words: List[Dict], label_word: Dict, 
                                         label_x1: float, label_y: float,
                                         page_width: float, page_height: float) -> Optional[Dict]:
        """Find field position after a label by looking for underlines or blank spaces"""
        result = {
            'x': label_x1 + 10,
            'y': label_y + 5,
            'width': 150,
            'height': 30,
            'confidence': 0.7,
            'has_underline': False
        }
        
        # Look for words after the label
        for word in words:
            word_x = word['x0']
            word_y = word['top']
            word_text = word['text'].strip()
            
            # Check if word is on the same line (within 15 pixels vertically)
            if abs(word_y - label_y) < 15:
                # Check if it's to the right of the label
                if word_x > label_x1:
                    # Check if it's an underline (underscores, dashes, dots)
                    if len(word_text) > 3 and re.match(r'^[_\-\s\.]+$', word_text):
                        result['x'] = word_x
                        result['y'] = word_y
                        result['width'] = min(word['x1'] - word['x0'], 300)
                        result['height'] = 30
                        result['confidence'] = 0.85
                        result['has_underline'] = True
                        return result
                    
                    # If there's a gap (blank space), use that position
                    gap = word_x - label_x1
                    if 20 < gap < 100:
                        result['x'] = label_x1 + 10
                        result['y'] = label_y + 5
                        result['width'] = min(gap - 10, 200)
                        result['confidence'] = 0.75
                        return result
        
        # Default: position to the right of label
        return result
    
    def _detect_fields_by_patterns(self, pdf_path: str) -> List[Dict]:
        """Detect fields using pattern matching on text layout"""
        fields = []
        if not HAS_PDFPLUMBER:
            return fields
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Look for lines with underscores (common field indicator)
                    words = page.extract_words()
                    
                    for word in words:
                        text = word['text'].strip()
                        # Check for lines of underscores, dashes, or dots
                        if len(text) > 5 and re.match(r'^[_\-\s\.]+$', text):
                            # Try to find label before this line
                            label = self._find_label_before(word, words, page.width)
                            field_type = label['type'] if label else 'text'
                            confidence = 0.8 if label else 0.7
                            
                            reason = 'Found field indicator line'
                            if label:
                                reason += f' with {field_type} label: {label["text"]}'
                            
                            fields.append({
                                'page': page_num + 1,
                                'x': word['x0'],
                                'y': word['top'],
                                'width': max(word['x1'] - word['x0'], 150),
                                'height': max(word['bottom'] - word['top'], 30),
                                'type': field_type,
                                'confidence': confidence,
                                'reason': reason,
                                'context': ''
                            })
                    
                    # Also detect blank lines (large gaps between words)
                    sorted_words = sorted(words, key=lambda w: (w['top'], w['x0']))
                    for i in range(len(sorted_words) - 1):
                        current = sorted_words[i]
                        next_word = sorted_words[i + 1]
                        
                        # Check for vertical gap (blank line)
                        vertical_gap = next_word['top'] - current['bottom']
                        if 30 < vertical_gap < 100:
                            # Check if words are in similar X position (same column)
                            if abs(current['x0'] - next_word['x0']) < 50:
                                fields.append({
                                    'page': page_num + 1,
                                    'x': current['x0'],
                                    'y': current['bottom'] + (vertical_gap / 2),
                                    'width': 200,
                                    'height': 30,
                                    'type': 'text',
                                    'confidence': 0.65,
                                    'reason': 'Found blank line/empty space',
                                    'context': ''
                                })
        except Exception as e:
            print(f"Error in pattern detection: {e}", file=sys.stderr)
        
        return fields
    
    def _find_label_before(self, word: Dict, all_words: List[Dict], 
                          page_width: float) -> Optional[Dict]:
        """Find field label before a field indicator"""
        field_types = {
            'signature': ['signature', 'sign'],
            'date': ['date', 'dated'],
            'name': ['name', 'candidate'],
            'email': ['email'],
            'initial': ['initial'],
            'company': ['company'],
            'title': ['title'],
            'phone': ['phone', 'telephone'],
        }
        
        # Look for words to the left and slightly above
        for other_word in all_words:
            if (other_word['x1'] < word['x0'] and 
                abs(other_word['top'] - word['top']) < 15 and
                other_word['x1'] > word['x0'] - 200):
                text_lower = other_word['text'].lower()
                for field_type, keywords in field_types.items():
                    if any(kw in text_lower for kw in keywords):
                        return {'type': field_type, 'text': other_word['text']}
        
        return None
    
    def _refine_with_ai(self, pdf_path: str, suggestions: List[Dict]) -> Optional[List[Dict]]:
        """Use AI to refine and validate field suggestions"""
        if not self.openai_client:
            return None
        
        try:
            # Extract text from PDF
            doc = fitz.open(pdf_path)
            page_texts = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                page_texts.append({
                    'pageNum': page_num + 1,
                    'text': text[:2000]  # Limit text length
                })
            doc.close()
            
            # Build prompt
            suggestions_json = json.dumps(suggestions, indent=2)
            pages_text = '\n\n---\n\n'.join([
                f"Page {p['pageNum']}:\n{p['text']}" for p in page_texts
            ])
            
            prompt = f"""Analyze these PDF form field suggestions and refine them:

PDF Content:
{pages_text}

Current Suggestions:
{suggestions_json}

Review and refine the suggestions:
1. Remove false positives
2. Add missing fields
3. Correct coordinates if needed
4. Adjust confidence scores
5. Ensure all field types are detected (not just signatures)

Return a JSON object with a "suggestions" array containing refined field suggestions."""
            
            response = self.openai_client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': 'You are an expert at analyzing PDF form fields. Return only valid JSON.'},
                    {'role': 'user', 'content': prompt}
                ],
                response_format={'type': 'json_object'},
                temperature=0.2
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get('suggestions', suggestions)
            
        except Exception as e:
            print(f"AI refinement failed: {e}", file=sys.stderr)
            return None
    
    def _deduplicate_suggestions(self, suggestions: List[Dict]) -> List[Dict]:
        """Remove duplicate and overlapping suggestions"""
        if not suggestions:
            return []
        
        # Sort by confidence (highest first)
        sorted_suggestions = sorted(suggestions, key=lambda x: x.get('confidence', 0), reverse=True)
        deduplicated = []
        processed = set()
        
        for i, suggestion in enumerate(sorted_suggestions):
            if i in processed:
                continue
            
            # Check for duplicates on same page
            is_duplicate = False
            for j, other in enumerate(sorted_suggestions):
                if i == j or j in processed:
                    continue
                
                if (suggestion['page'] == other['page'] and
                    suggestion['type'] == other['type']):
                    # Calculate distance
                    distance = ((suggestion['x'] - other['x'])**2 + 
                              (suggestion['y'] - other['y'])**2)**0.5
                    
                    if distance < 100:  # Within 100 pixels
                        is_duplicate = True
                        break
            
            if not is_duplicate:
                deduplicated.append(suggestion)
                processed.add(i)
        
        return deduplicated
    
    def _get_page_count(self, pdf_path: str) -> int:
        """Get total number of pages in PDF"""
        try:
            if HAS_FITZ:
                doc = fitz.open(pdf_path)
                count = len(doc)
                doc.close()
                return count
            elif HAS_PDFPLUMBER:
                with pdfplumber.open(pdf_path) as pdf:
                    return len(pdf.pages)
        except:
            pass
        return 0


def main():
    parser = argparse.ArgumentParser(description='Detect form fields in PDF')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    parser.add_argument('--no-ai', action='store_true', help='Disable AI refinement')
    parser.add_argument('--api-key', help='OpenAI API key')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.pdf_path):
        print(f"Error: PDF file not found: {args.pdf_path}", file=sys.stderr)
        sys.exit(1)
    
    detector = PDFFieldDetector(
        use_ai=not args.no_ai,
        openai_api_key=args.api_key
    )
    
    result = detector.detect_fields(args.pdf_path)
    
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Results saved to {args.output}")
    else:
        print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()


