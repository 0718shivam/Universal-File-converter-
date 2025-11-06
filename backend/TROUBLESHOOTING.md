# Backend Server Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Failed to connect to server"

**Solution 1: Start the Backend Server**

1. Open a terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Activate your virtual environment:
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```
   - **Linux/Mac:**
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```

5. Start the Flask server:
   ```bash
   python app.py
   ```

   You should see:
   ```
   ==================================================
   Starting Convertify Backend Server...
   ==================================================
   Server will run on: http://localhost:5001
   OCR Available: True/False
   ==================================================
   ```

6. Keep this terminal window open while using the application.

**Solution 2: Check if Port 5001 is Already in Use**

If you get an error that port 5001 is already in use:

- **Windows:**
  ```powershell
  netstat -ano | findstr :5001
  ```
  Then kill the process using:
  ```powershell
  taskkill /PID <PID> /F
  ```

- **Linux/Mac:**
  ```bash
  lsof -ti:5001 | xargs kill -9
  ```

**Solution 3: Verify Backend is Running**

Open your browser and go to: `http://localhost:5001/health`

You should see:
```json
{"status": "ok", "message": "Server is running"}
```

### Issue: OCR Module Not Available

If you see "OCR module not available" error:

1. Install Python dependencies:
   ```bash
   pip install pytesseract python-docx
   ```

2. Install Tesseract OCR:
   - **Windows:** Download from https://github.com/UB-Mannheim/tesseract/wiki
   - **Linux:** `sudo apt-get install tesseract-ocr`
   - **Mac:** `brew install tesseract`

3. (Windows only) If Tesseract is not in PATH, edit `backend/ocr_converter.py`:
   ```python
   pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
   ```
   Uncomment line 10 and set the correct path.

### Quick Dependency Check

Run this command to check if all dependencies are installed:
```bash
cd backend
python check_dependencies.py
```

## Testing the Connection

1. Make sure backend is running (see Solution 1 above)
2. Open frontend in browser: `http://localhost:5173`
3. Navigate to OCR page
4. Try uploading an image

If you still get connection errors, check:
- Backend terminal for error messages
- Browser console (F12) for detailed error messages
- Firewall settings (port 5001 should be accessible)

