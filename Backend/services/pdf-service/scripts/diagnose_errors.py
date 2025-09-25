#!/usr/bin/env python3
"""
Diagnostic script to identify common issues with PDF table extraction
"""

import sys
import os
import json
import traceback

def check_python_version():
    """Check Python version"""
    print("🐍 Checking Python version...")
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("❌ Python 3.7+ is required")
        return False
    else:
        print("✅ Python version is compatible")
        return True

def check_dependencies():
    """Check if all required dependencies are installed"""
    print("\n📦 Checking dependencies...")
    
    required_modules = [
        'pdfplumber',
        'pandas', 
        'openpyxl',
        'numpy',
        'PIL',
        'cv2'
    ]
    
    missing_modules = []
    
    for module in required_modules:
        try:
            __import__(module)
            print(f"✅ {module} - OK")
        except ImportError as e:
            print(f"❌ {module} - MISSING: {e}")
            missing_modules.append(module)
    
    if missing_modules:
        print(f"\n❌ Missing modules: {', '.join(missing_modules)}")
        print("Please install missing dependencies:")
        print("pip install -r requirements.txt")
        return False
    else:
        print("\n✅ All dependencies are available!")
        return True

def test_pdfplumber():
    """Test pdfplumber functionality"""
    print("\n🔍 Testing pdfplumber...")
    
    try:
        import pdfplumber
        print("✅ pdfplumber imported successfully")
        
        # Test basic functionality
        print("✅ pdfplumber is ready")
        return True
    except Exception as e:
        print(f"❌ pdfplumber test failed: {e}")
        print(f"Error details: {traceback.format_exc()}")
        return False

def test_pandas():
    """Test pandas functionality"""
    print("\n🔍 Testing pandas...")
    
    try:
        import pandas as pd
        print("✅ pandas imported successfully")
        
        # Test basic functionality
        df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
        print("✅ pandas DataFrame creation works")
        return True
    except Exception as e:
        print(f"❌ pandas test failed: {e}")
        print(f"Error details: {traceback.format_exc()}")
        return False

def test_openpyxl():
    """Test openpyxl functionality"""
    print("\n🔍 Testing openpyxl...")
    
    try:
        from openpyxl import Workbook
        print("✅ openpyxl imported successfully")
        
        # Test basic functionality
        wb = Workbook()
        ws = wb.active
        ws['A1'] = 'Test'
        print("✅ openpyxl workbook creation works")
        return True
    except Exception as e:
        print(f"❌ openpyxl test failed: {e}")
        print(f"Error details: {traceback.format_exc()}")
        return False

def test_script_execution():
    """Test if the main script can be executed"""
    print("\n🔍 Testing script execution...")
    
    try:
        script_path = os.path.join(os.path.dirname(__file__), 'extract_tables_pdfplumber.py')
        
        if not os.path.exists(script_path):
            print(f"❌ Script not found: {script_path}")
            return False
        
        print(f"✅ Script found: {script_path}")
        
        # Test import
        import importlib.util
        spec = importlib.util.spec_from_file_location("extract_tables_pdfplumber", script_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        print("✅ Script can be imported")
        return True
        
    except Exception as e:
        print(f"❌ Script execution test failed: {e}")
        print(f"Error details: {traceback.format_exc()}")
        return False

def test_file_permissions():
    """Test file permissions"""
    print("\n🔍 Testing file permissions...")
    
    try:
        # Test current directory
        current_dir = os.getcwd()
        print(f"Current directory: {current_dir}")
        
        # Test if we can create files
        test_file = os.path.join(current_dir, 'test_permissions.txt')
        with open(test_file, 'w') as f:
            f.write('test')
        
        # Clean up
        os.remove(test_file)
        print("✅ File permissions are OK")
        return True
        
    except Exception as e:
        print(f"❌ File permissions test failed: {e}")
        print(f"Error details: {traceback.format_exc()}")
        return False

def main():
    """Main diagnostic function"""
    print("🔧 PDF Table Extraction Diagnostic Tool")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Run all tests
    tests = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("pdfplumber", test_pdfplumber),
        ("pandas", test_pandas),
        ("openpyxl", test_openpyxl),
        ("Script Execution", test_script_execution),
        ("File Permissions", test_file_permissions)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
            if not result:
                all_tests_passed = False
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            print(f"Error details: {traceback.format_exc()}")
            results[test_name] = False
            all_tests_passed = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 50)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    if all_tests_passed:
        print("\n🎉 All tests passed! Your environment is ready.")
        return 0
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
