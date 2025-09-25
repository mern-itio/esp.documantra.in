#!/bin/bash

# Install Python dependencies for PDF table extraction
# This script installs the required Python packages for the table extraction functionality

echo "🐍 Installing Python dependencies for PDF table extraction..."
echo "=============================================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ Python 3 and pip3 are available"

# Install dependencies from requirements.txt
echo "📦 Installing dependencies from requirements.txt..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Test the installation
echo "🧪 Testing installation..."
python3 scripts/test_python_deps.py

if [ $? -eq 0 ]; then
    echo "🎉 Python environment is ready for PDF table extraction!"
else
    echo "❌ Installation test failed. Please check the error messages above."
    exit 1
fi