#!/usr/bin/env python3
"""
Test script to verify the main extraction script works
"""

import sys
import os
import json
import tempfile

def test_script_help():
    """Test if the script can show help"""
    try:
        script_path = os.path.join(os.path.dirname(__file__), 'extract_tables_pdfplumber.py')
        
        if not os.path.exists(script_path):
            print(f"❌ Script not found: {script_path}")
            return False
        
        # Test help command
        import subprocess
        result = subprocess.run([sys.executable, script_path, '--help'], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Script help command works")
            return True
        else:
            print(f"❌ Script help failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Script test failed: {e}")
        return False

def test_script_with_invalid_file():
    """Test script with invalid file"""
    try:
        script_path = os.path.join(os.path.dirname(__file__), 'extract_tables_pdfplumber.py')
        
        # Test with non-existent file
        result = subprocess.run([
            sys.executable, script_path, 
            'nonexistent.pdf', '--json'
        ], capture_output=True, text=True, timeout=30)
        
        # Should return error but not crash
        if result.returncode != 0:
            try:
                error_data = json.loads(result.stdout)
                if not error_data.get('success', True):
                    print("✅ Script handles invalid file correctly")
                    return True
            except json.JSONDecodeError:
                pass
        
        print(f"❌ Script didn't handle invalid file correctly: {result.stdout}")
        return False
        
    except Exception as e:
        print(f"❌ Script test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing extraction script...")
    print("=" * 40)
    
    help_ok = test_script_help()
    invalid_ok = test_script_with_invalid_file()
    
    if help_ok and invalid_ok:
        print("\n🎉 Script tests passed!")
        return 0
    else:
        print("\n❌ Some script tests failed!")
        return 1

if __name__ == '__main__':
    sys.exit(main())
