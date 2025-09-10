@echo off
REM PDF Editor Python Dependencies Installation Script for Windows

echo Installing Python dependencies for PDF Editor...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python first.
    pause
    exit /b 1
)

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo pip is not installed. Please install pip first.
    pause
    exit /b 1
)

REM Install PyMuPDF (fitz) - Main PDF processing library
echo Installing PyMuPDF...
pip install PyMuPDF==1.23.14

REM Install other PDF processing libraries
echo Installing PDF processing libraries...
pip install pdf2pic==3.2.0
pip install pdf-parse==1.1.1

REM Install image processing libraries
echo Installing image processing libraries...
pip install Pillow==10.1.0
pip install opencv-python==4.8.1.78

REM Install text processing libraries
echo Installing text processing libraries...
pip install pytesseract==0.3.10
pip install nltk==3.8.1

REM Install data processing libraries
echo Installing data processing libraries...
pip install pandas==2.1.4
pip install numpy==1.24.3

REM Install web framework libraries
echo Installing web framework libraries...
pip install Flask==3.0.0
pip install Flask-CORS==4.0.0

REM Install utility libraries
echo Installing utility libraries...
pip install python-dotenv==1.0.0
pip install requests==2.31.0

echo All Python dependencies installed successfully!
echo You can now run the PDF Editor service.
pause
