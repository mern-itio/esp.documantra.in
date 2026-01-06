#!/usr/bin/env python3
"""
Advanced PDF Field Analyzer using Python
This script provides more accurate PDF analysis using PyMuPDF (fitz) and pdfplumber.
Can be used as a fallback or for complex PDFs that Node.js PDF.js struggles with.

Installation:
    pip install pymupdf pdfplumber openai

Usage:
    python pdf_analyzer.py <pdf_path> [--output output.json]
"""

import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional
import os

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False
    print("Warning: PyMuPDF (fitz) not installed. Install with: pip install pymupdf")

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    print("Warning: pdfplumber not installed. Install with: pip install pdfplumber")

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    print("Warning: OpenAI not installed. Install with: pip install openai")


class PDFFieldAnalyzer:
    """Advanced PDF field analyzer using multiple libraries and AI"""
    
    def __init__(self, use_ai: bool = True, openai_api_key: Optional[str] = None):
        self.use_ai = use_ai and HAS_OPENAI
        self.openai_client = None
        if self.use_ai and openai_api_key:
            self.openai_client = OpenAI(api_key=openai_api_key)
        elif self.use_ai:
            # Try to get from environment
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                self.openai_client = OpenAI(api_key=api_key)
            else:
                self.use_ai = False
                print("Warning: OpenAI API key not found. AI analysis disabled.")
    
    def analyze_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Analyze PDF and return field suggestions"""
        suggestions = []
        page_texts = []
        
        # Use PyMuPDF for better text extraction
        if HAS_FITZ:
            doc = fitz.open(pdf_path)
            num_pages = len(doc)
            
            for page_num in range(num_pages):
                page = doc[page_num]
                viewport = page.rect
                
                # Extract text with positions
                text_dict = page.get_text("dict")
                text_content = page.get_text()
                
                page_texts.append({
                    'pageNum': page_num + 1,
                    'text': text_content,
                    'textDict': text_dict,
                    'viewport': {
                        'width': viewport.width,
                        'height': viewport.height
                    }
                })
            
            doc.close()
        elif HAS_PDFPLUMBER:
            # Fallback to pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                num_pages = len(pdf.pages)
                
                for page_num, page in enumerate(pdf.pages):
                    text_content = page.extract_text() or ""
                    
                    page_texts.append({
                        'pageNum': page_num + 1,
                        'text': text_content,
                        'textDict': None,
                        'viewport': {
                            'width': page.width,
                            'height': page.height
                        }
                    })
        else:
            return {
                'success': False,
                'error': 'No PDF library available. Install PyMuPDF or pdfplumber.',
                'suggestions': []
            }
        
        # Use AI to analyze if available
        if self.use_ai and self.openai_client:
            ai_suggestions = self._analyze_with_ai(page_texts)
            suggestions.extend(ai_suggestions)
        
        # Also use heuristic analysis
        heuristic_suggestions = self._heuristic_analysis(page_texts)
        suggestions.extend(heuristic_suggestions)
        
        # Deduplicate suggestions
        final_suggestions = self._deduplicate_suggestions(suggestions)
        
        return {
            'success': True,
            'suggestions': final_suggestions,
            'totalPages': len(page_texts)
        }
    
    def _analyze_with_ai(self, page_texts: List[Dict]) -> List[Dict]:
        """Use OpenAI to intelligently analyze PDF text"""
        if not self.openai_client:
            return []
        
        # Build context
        pages_context = "\n\n---\n\n".join([
            f"Page {p['pageNum']}:\n{p['text'][:2000]}{'...' if len(p['text']) > 2000 else ''}"
            for p in page_texts
        ])
        
        prompt = f"""You are an expert at analyzing PDF documents to identify where form fields should be placed.

Analyze this PDF document and suggest ONLY the fields that are actually needed based on the document content.

IMPORTANT RULES:
1. Be CONSERVATIVE - only suggest fields where there is clear evidence they are needed
2. Do NOT suggest multiple signature fields on the same page unless the document explicitly requires multiple signers
3. Look for actual field labels like "Signature:", "Date:", "Name:", etc. in the text
4. Consider the document context - a contract typically needs 1-2 signatures, not 10
5. Only suggest fields where there is space and context indicating a field is needed
6. Avoid suggesting fields in headers, footers, or document metadata areas
7. For signature fields, prefer suggesting them near the bottom of pages where signatures typically appear
8. Do NOT add default/fallback fields - only suggest fields based on actual document content

Return a JSON array of suggestions with this structure:
[
  {{
    "type": "signature|date|name|email",
    "page": 1,
    "x": 0.5,  // normalized 0-1
    "y": 0.9,  // normalized 0-1
    "width": 150,
    "height": 50,
    "confidence": 0.85,
    "reason": "Found signature keyword: Signature:",
    "context": "Surrounding text..."
  }}
]

PDF Content:
{pages_context}

Total pages: {len(page_texts)}

Return ONLY valid JSON, no markdown, no code blocks."""

        try:
            response = self.openai_client.chat.completions.create(
                model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
                messages=[
                    {'role': 'system', 'content': 'You are a PDF analysis expert. Return only valid JSON.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.3,
                response_format={'type': 'json_object'}
            )
            
            result = json.loads(response.choices[0].message.content)
            suggestions = result.get('suggestions', [])
            
            # Convert normalized coordinates to pixel coordinates
            for suggestion in suggestions:
                page_data = next((p for p in page_texts if p['pageNum'] == suggestion['page']), None)
                if page_data:
                    viewport = page_data['viewport']
                    suggestion['x'] = suggestion['x'] * viewport['width']
                    suggestion['y'] = suggestion['y'] * viewport['height']
                    suggestion['width'] = suggestion.get('width', 150)
                    suggestion['height'] = suggestion.get('height', 50)
            
            return suggestions
        except Exception as e:
            print(f"Error in AI analysis: {e}")
            return []
    
    def _heuristic_analysis(self, page_texts: List[Dict]) -> List[Dict]:
        """Heuristic-based field detection"""
        suggestions = []
        
        signature_keywords = [
            'signature:', 'sign here', 'signature line', 'signature of',
            'signature block', 'signature field', 'signature required'
        ]
        
        date_keywords = [
            'date:', 'date signed', 'signature date', 'execution date',
            'dated:', 'date of signature'
        ]
        
        name_keywords = [
            'name:', 'full name', 'printed name', 'name of signer',
            'signer name', 'your name'
        ]
        
        email_keywords = [
            'email:', 'e-mail:', 'email address', 'e-mail address'
        ]
        
        for page_data in page_texts:
            page_num = page_data['pageNum']
            text = page_data['text'].lower()
            viewport = page_data['viewport']
            found_positions = set()
            
            # Check for signature fields
            for keyword in signature_keywords:
                if keyword in text:
                    # Simple heuristic: place at bottom-right if signature keyword found
                    # Only if not already found
                    if f'sig_{page_num}' not in found_positions:
                        found_positions.add(f'sig_{page_num}')
                        suggestions.append({
                            'type': 'signature',
                            'page': page_num,
                            'x': viewport['width'] - 200,
                            'y': viewport['height'] - 100,
                            'width': 150,
                            'height': 50,
                            'confidence': 0.7,
                            'reason': f'Found signature keyword: {keyword}'
                        })
                        break  # Only one signature per page from heuristics
            
            # Check for date fields
            for keyword in date_keywords:
                if keyword in text:
                    if f'date_{page_num}' not in found_positions:
                        found_positions.add(f'date_{page_num}')
                        suggestions.append({
                            'type': 'date',
                            'page': page_num,
                            'x': viewport['width'] - 150,
                            'y': viewport['height'] - 150,
                            'width': 120,
                            'height': 40,
                            'confidence': 0.65,
                            'reason': f'Found date keyword: {keyword}'
                        })
                        break
            
            # Check for name fields
            for keyword in name_keywords:
                if keyword in text:
                    if f'name_{page_num}' not in found_positions:
                        found_positions.add(f'name_{page_num}')
                        suggestions.append({
                            'type': 'name',
                            'page': page_num,
                            'x': 50,
                            'y': viewport['height'] - 100,
                            'width': 200,
                            'height': 40,
                            'confidence': 0.65,
                            'reason': f'Found name keyword: {keyword}'
                        })
                        break
        
        return suggestions
    
    def _deduplicate_suggestions(self, suggestions: List[Dict], min_confidence: float = 0.7) -> List[Dict]:
        """Remove duplicate and low-confidence suggestions"""
        # Filter by confidence
        filtered = [s for s in suggestions if s.get('confidence', 0) >= min_confidence]
        
        # Sort by confidence (highest first)
        filtered.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        
        deduplicated = []
        processed = set()
        
        for i, current in enumerate(filtered):
            if i in processed:
                continue
            
            deduplicated.append(current)
            processed.add(i)
            
            # Mark nearby suggestions as duplicates
            for j in range(i + 1, len(filtered)):
                if j in processed:
                    continue
                
                other = filtered[j]
                if (current['page'] == other['page'] and 
                    current['type'] == other['type']):
                    distance = ((current['x'] - other['x'])**2 + 
                               (current['y'] - other['y'])**2)**0.5
                    
                    if distance < 100:  # Within 100 pixels
                        processed.add(j)
        
        return deduplicated


def main():
    parser = argparse.ArgumentParser(description='Analyze PDF for field suggestions')
    parser.add_argument('pdf_path', help='Path to PDF file')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    parser.add_argument('--no-ai', action='store_true', help='Disable AI analysis')
    parser.add_argument('--openai-key', help='OpenAI API key (or set OPENAI_API_KEY env var)')
    
    args = parser.parse_args()
    
    if not Path(args.pdf_path).exists():
        print(f"Error: PDF file not found: {args.pdf_path}")
        sys.exit(1)
    
    analyzer = PDFFieldAnalyzer(
        use_ai=not args.no_ai,
        openai_api_key=args.openai_key
    )
    
    result = analyzer.analyze_pdf(args.pdf_path)
    
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Results saved to {args.output}")
    else:
        print(json.dumps(result, indent=2))
    
    if result['success']:
        print(f"\nFound {len(result['suggestions'])} field suggestions", file=sys.stderr)
        sys.exit(0)
    else:
        print(f"Error: {result.get('error', 'Unknown error')}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

