@echo off
REM Install Python dependencies for PDF table extraction
REM This script installs the required Python packages for the table extraction functionality

echo 🐍 Installing Python dependencies for PDF table extraction...
echo ==============================================================

REM Check if Python 3 is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3 first.
    pause
    exit /b 1
)

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not installed. Please install pip first.
    pause
    exit /b 1
)

echo ✅ Python and pip are available

REM Install dependencies from requirements.txt
echo 📦 Installing dependencies from requirements.txt...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Test the installation
echo 🧪 Testing installation...
python scripts/test_python_deps.py

if errorlevel 1 (
    echo ❌ Installation test failed. Please check the error messages above.
    pause
    exit /b 1
)

echo 🎉 Python environment is ready for PDF table extraction!
pause