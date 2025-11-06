# Installing Tesseract OCR for Windows

## Quick Installation Guide

### Step 1: Download Tesseract OCR

1. Go to: **https://github.com/UB-Mannheim/tesseract/wiki**
2. Download the latest Windows installer (e.g., `tesseract-ocr-w64-setup-5.x.x.exe`)

### Step 2: Install Tesseract OCR

1. Run the downloaded installer
2. **Important:** During installation, check the box that says **"Add to PATH"** or remember the installation path
3. Default installation path is usually: `C:\Program Files\Tesseract-OCR\`
4. Complete the installation

### Step 3: Verify Installation

Open a new PowerShell/Command Prompt and run:
```powershell
tesseract --version
```

You should see the Tesseract version number.

### Step 4: Install Language Packs (Optional but Recommended)

During installation, you can select additional language packs:
- **English** (usually included by default)
- **Hindi** (for Hindi text recognition)
- **Sanskrit** (for Sanskrit text recognition)
- And other languages you need

### Step 5: Restart Backend Server

After installing Tesseract OCR:

1. Stop your backend server (Ctrl+C in the terminal)
2. Restart it:
   ```powershell
   cd backend
   venv\Scripts\activate
   python app.py
   ```

### If Tesseract is Not Found Automatically

If you installed Tesseract but it's still not found, edit `backend/ocr_converter.py` and uncomment/modify line 10:

```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

Replace the path with your actual Tesseract installation path.

### Alternative: Install via Chocolatey (if you have it)

```powershell
choco install tesseract
```

### Troubleshooting

- **"TesseractNotFoundError"**: Tesseract is not installed or not in PATH
- **"Language pack not found"**: Install the language pack you need from the Tesseract installer
- **Still not working**: Restart your computer after installation to refresh PATH variables

### Testing After Installation

Run this command to test:
```powershell
cd backend
venv\Scripts\activate
python -c "import pytesseract; print('Tesseract version:', pytesseract.get_tesseract_version())"
```

If successful, you'll see the version number. Then restart your backend server!

