#!/bin/bash

# PDF Editor Python Dependencies Installation Script

echo "Installing Python dependencies for PDF Editor..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install PyMuPDF (fitz) - Main PDF processing library
echo "Installing PyMuPDF..."
pip3 install PyMuPDF==1.23.14

# Install other PDF processing libraries
echo "Installing PDF processing libraries..."
pip3 install pdf2pic==3.2.0
pip3 install pdf-parse==1.1.1

# Install image processing libraries
echo "Installing image processing libraries..."
pip3 install Pillow==10.1.0
pip3 install opencv-python==4.8.1.78

# Install text processing libraries
echo "Installing text processing libraries..."
pip3 install pytesseract==0.3.10
pip3 install nltk==3.8.1

# Install data processing libraries
echo "Installing data processing libraries..."
pip3 install pandas==2.1.4
pip3 install numpy==1.24.3

# Install web framework libraries
echo "Installing web framework libraries..."
pip3 install Flask==3.0.0
pip3 install Flask-CORS==4.0.0

# Install utility libraries
echo "Installing utility libraries..."
pip3 install python-dotenv==1.0.0
pip3 install requests==2.31.0

echo "All Python dependencies installed successfully!"
echo "You can now run the PDF Editor service."
