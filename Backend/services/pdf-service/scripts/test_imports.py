#!/usr/bin/env python3
"""
Simple test to verify all imports work correctly
"""

import sys
import os

def test_basic_imports():
    """Test basic Python imports"""
    try:
        import time
        print("✅ time module - OK")
    except ImportError as e:
        print(f"❌ time module - FAILED: {e}")
        return False
    
    try:
        import json
        print("✅ json module - OK")
    except ImportError as e:
        print(f"❌ json module - FAILED: {e}")
        return False
    
    try:
        import os
        print("✅ os module - OK")
    except ImportError as e:
        print(f"❌ os module - FAILED: {e}")
        return False
    
    return True

def test_script_imports():
    """Test if the main script can be imported"""
    try:
        script_path = os.path.join(os.path.dirname(__file__), 'extract_tables_pdfplumber.py')
        
        if not os.path.exists(script_path):
            print(f"❌ Script not found: {script_path}")
            return False
        
        # Test import
        import importlib.util
        spec = importlib.util.spec_from_file_location("extract_tables_pdfplumber", script_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        print("✅ Main script can be imported")
        return True
        
    except Exception as e:
        print(f"❌ Script import failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Python imports...")
    print("=" * 40)
    
    basic_ok = test_basic_imports()
    script_ok = test_script_imports()
    
    if basic_ok and script_ok:
        print("\n🎉 All import tests passed!")
        return 0
    else:
        print("\n❌ Some import tests failed!")
        return 1

if __name__ == '__main__':
    sys.exit(main())
