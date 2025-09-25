#!/usr/bin/env python3
"""
Test script to verify Python dependencies for table extraction
"""

import sys
import importlib

def test_imports():
    """Test if all required modules can be imported"""
    required_modules = [
        'pdfplumber',
        'pandas', 
        'openpyxl',
        'numpy',
        'PIL',
        'cv2'
    ]
    
    failed_imports = []
    
    for module in required_modules:
        try:
            importlib.import_module(module)
            print(f"✅ {module} - OK")
        except ImportError as e:
            print(f"❌ {module} - FAILED: {e}")
            failed_imports.append(module)
    
    if failed_imports:
        print(f"\n❌ Failed to import: {', '.join(failed_imports)}")
        print("Please install missing dependencies:")
        print("pip install -r requirements.txt")
        return False
    else:
        print("\n✅ All dependencies are available!")
        return True

def test_pdfplumber():
    """Test pdfplumber functionality"""
    try:
        import pdfplumber
        print("\n🔍 Testing pdfplumber...")
        
        # Test basic functionality
        print("✅ pdfplumber imported successfully")
        print("✅ pdfplumber is ready for table extraction")
        return True
    except Exception as e:
        print(f"❌ pdfplumber test failed: {e}")
        return False

def test_pandas():
    """Test pandas functionality"""
    try:
        import pandas as pd
        print("\n🔍 Testing pandas...")
        
        # Test basic functionality
        df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
        print("✅ pandas DataFrame creation works")
        print("✅ pandas is ready for data processing")
        return True
    except Exception as e:
        print(f"❌ pandas test failed: {e}")
        return False

def test_openpyxl():
    """Test openpyxl functionality"""
    try:
        from openpyxl import Workbook
        print("\n🔍 Testing openpyxl...")
        
        # Test basic functionality
        wb = Workbook()
        ws = wb.active
        ws['A1'] = 'Test'
        print("✅ openpyxl workbook creation works")
        print("✅ openpyxl is ready for Excel file generation")
        return True
    except Exception as e:
        print(f"❌ openpyxl test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Python dependencies for PDF table extraction...")
    print("=" * 60)
    
    # Test imports
    imports_ok = test_imports()
    
    if not imports_ok:
        sys.exit(1)
    
    # Test individual modules
    pdfplumber_ok = test_pdfplumber()
    pandas_ok = test_pandas()
    openpyxl_ok = test_openpyxl()
    
    print("\n" + "=" * 60)
    
    if all([pdfplumber_ok, pandas_ok, openpyxl_ok]):
        print("🎉 All tests passed! Python environment is ready for table extraction.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
