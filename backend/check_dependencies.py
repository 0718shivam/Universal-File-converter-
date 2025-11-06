#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick script to check if backend dependencies are installed and server can start
"""
import sys
import os

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')

def check_imports():
    """Check if all required modules can be imported"""
    errors = []
    
    try:
        import flask
        print("[OK] Flask installed")
    except ImportError:
        errors.append("Flask not installed")
        print("[FAIL] Flask not installed")
    
    try:
        import flask_cors
        print("[OK] Flask-CORS installed")
    except ImportError:
        errors.append("Flask-CORS not installed")
        print("[FAIL] Flask-CORS not installed")
    
    try:
        from PIL import Image
        print("[OK] Pillow installed")
    except ImportError:
        errors.append("Pillow not installed")
        print("[FAIL] Pillow not installed")
    
    try:
        import pytesseract
        print("[OK] pytesseract installed")
    except ImportError:
        errors.append("pytesseract not installed")
        print("[FAIL] pytesseract not installed")
    
    try:
        from docx import Document
        print("[OK] python-docx installed")
    except ImportError:
        errors.append("python-docx not installed")
        print("[FAIL] python-docx not installed")
    
    # Check if Tesseract is accessible
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        print("[OK] Tesseract OCR is accessible")
    except Exception as e:
        errors.append(f"Tesseract OCR not accessible: {e}")
        print(f"[FAIL] Tesseract OCR not accessible: {e}")
        print("  Please install Tesseract OCR from https://github.com/tesseract-ocr/tesseract")
    
    return errors

if __name__ == '__main__':
    print("Checking backend dependencies...\n")
    errors = check_imports()
    
    if errors:
        print(f"\n[FAIL] Found {len(errors)} issue(s). Please install missing dependencies:")
        print("  pip install -r requirements.txt")
        sys.exit(1)
    else:
        print("\n[OK] All dependencies are installed!")
        print("\nTo start the backend server, run:")
        print("  python app.py")
        sys.exit(0)

