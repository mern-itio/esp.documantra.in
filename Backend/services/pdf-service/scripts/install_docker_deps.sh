#!/bin/bash

# Docker-specific Python dependency installation script
# This script ensures all Python dependencies are properly installed in the Docker container

echo "🐍 Installing Python dependencies for Docker container..."
echo "=============================================================="

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Virtual environment detected: $VIRTUAL_ENV"
else
    echo "⚠️  No virtual environment detected, using system Python"
fi

# Check Python version
echo "🔍 Checking Python version..."
python --version

# Upgrade pip
echo "📦 Upgrading pip..."
python -m pip install --upgrade pip

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

# Test installation
echo "🧪 Testing installation..."
python scripts/test_python_deps.py

if [ $? -eq 0 ]; then
    echo "🎉 Python dependencies installed successfully in Docker!"
else
    echo "❌ Python dependency installation failed!"
    exit 1
fi

# Test table extraction script
echo "🧪 Testing table extraction script..."
python scripts/extract_tables_pdfplumber.py --help

if [ $? -eq 0 ]; then
    echo "✅ Table extraction script is working!"
else
    echo "❌ Table extraction script test failed!"
    exit 1
fi

echo "🎉 All Docker Python dependencies are ready!"
