#!/usr/bin/env python3
"""
Test script for PDF table extraction functionality
This script tests the table extraction with a sample PDF or creates a test PDF
"""

import sys
import os
import json
import tempfile
from pathlib import Path

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from extract_tables_pdfplumber import PDFTableExtractor

def create_test_pdf():
    """Create a simple test PDF with tables using reportlab"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors
        
        # Create temporary PDF
        temp_pdf = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        temp_pdf.close()
        
        # Create PDF document
        doc = SimpleDocTemplate(temp_pdf.name, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Add title
        title = Paragraph("Test PDF with Tables", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Create sample table 1
        table1_data = [
            ['Name', 'Age', 'City', 'Salary'],
            ['John Doe', '30', 'New York', '$50,000'],
            ['Jane Smith', '25', 'Los Angeles', '$45,000'],
            ['Bob Johnson', '35', 'Chicago', '$55,000'],
            ['Alice Brown', '28', 'Houston', '$48,000']
        ]
        
        table1 = Table(table1_data)
        table1.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(Paragraph("Employee Data", styles['Heading2']))
        story.append(table1)
        story.append(Spacer(1, 20))
        
        # Create sample table 2
        table2_data = [
            ['Product', 'Price', 'Stock', 'Category'],
            ['Laptop', '$999', '50', 'Electronics'],
            ['Mouse', '$25', '200', 'Electronics'],
            ['Keyboard', '$75', '150', 'Electronics'],
            ['Monitor', '$299', '75', 'Electronics']
        ]
        
        table2 = Table(table2_data)
        table2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(Paragraph("Product Inventory", styles['Heading2']))
        story.append(table2)
        
        # Build PDF
        doc.build(story)
        
        print(f"✅ Test PDF created: {temp_pdf.name}")
        return temp_pdf.name
        
    except ImportError:
        print("❌ reportlab not available. Please install: pip install reportlab")
        return None
    except Exception as e:
        print(f"❌ Error creating test PDF: {e}")
        return None

def test_table_extraction(pdf_path):
    """Test table extraction with the given PDF"""
    print(f"\n🔍 Testing table extraction with: {pdf_path}")
    print("=" * 60)
    
    try:
        # Create extractor
        extractor = PDFTableExtractor(pdf_path)
        
        # Test different extraction methods
        methods = ['auto', 'all']
        
        for method in methods:
            print(f"\n📊 Testing method: {method}")
            print("-" * 40)
            
            result = extractor.extract_tables(
                detection_method=method,
                output_format='xlsx',
                preserve_formatting=True,
                extract_headers=True,
                merge_tables=False,
                page_range=None,
                language='eng'
            )
            
            if result['success']:
                print(f"✅ Success! Found {result['tables_found']} tables")
                print(f"📁 Output file: {result['output_file']}")
                print(f"⏱️  Processing time: {result['stats']['processing_time']:.2f} seconds")
                print(f"📄 Pages processed: {result['stats']['total_pages']}")
                print(f"📊 Success rate: {result['stats']['success_rate']:.1f}%")
                
                # Show table details
                if result['tables']:
                    for i, table in enumerate(result['tables']):
                        print(f"  Table {i+1}: {table['name']}")
                        print(f"    - Rows: {len(table['rows'])}")
                        print(f"    - Columns: {table['columns']}")
                        print(f"    - Confidence: {table.get('confidence', 'N/A')}")
                        print(f"    - Method: {table.get('detection_method', 'N/A')}")
            else:
                print(f"❌ Failed: {result.get('error', 'Unknown error')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing PDF Table Extraction")
    print("=" * 60)
    
    # Check if test PDF exists or create one
    test_pdf_path = None
    
    # Look for existing test PDF
    possible_paths = [
        'test_sample.pdf',
        '../test_sample.pdf',
        '../../test_sample.pdf'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            test_pdf_path = path
            print(f"📄 Found existing test PDF: {path}")
            break
    
    # Create test PDF if none found
    if not test_pdf_path:
        print("📄 Creating test PDF...")
        test_pdf_path = create_test_pdf()
        
        if not test_pdf_path:
            print("❌ Could not create test PDF. Please provide a PDF file manually.")
            return False
    
    # Test table extraction
    success = test_table_extraction(test_pdf_path)
    
    if success:
        print("\n🎉 Table extraction test completed successfully!")
        return True
    else:
        print("\n❌ Table extraction test failed!")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
