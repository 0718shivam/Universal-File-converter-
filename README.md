# Convertify - Image & PDF Converter

A comprehensive full-stack web application for image format conversion and PDF manipulation with an extensive suite of PDF tools.

## Features...

### Image Converter
- Convert images between multiple formats (PNG, JPEG, WEBP, BMP, GIF, TIFF, ICO)
- Beautiful, modern UI with drag-and-drop support
- Real-time image preview
- Fast server-side conversion using Pillow

### PDF Tools
- **PDF to Images**: Convert PDF pages to PNG, JPEG, or WEBP
- **Images to PDF**: Combine multiple images into a single PDF
- **PDF to PowerPoint**: Convert PDF to PPTX presentation
- **Merge PDFs**: Combine multiple PDF files
- **Split PDF**: Extract individual pages or split by range
- **Compress PDF**: Reduce PDF file size
- **Delete Pages**: Remove specific pages from PDF
- **Rotate Pages**: Rotate PDF pages (90°, 180°, 270°)
- **PDF Info**: View PDF metadata and page count

### General Features
- Multi-page navigation between converters
- Privacy-focused (all conversions happen on your server)
- Comprehensive end-to-end tests
- Responsive design for mobile and desktop

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- React Router for navigation
- Vite for build tooling
- Modern CSS with responsive design and gradients
- Playwright for E2E testing

**Backend:**
- Python Flask
- Pillow (PIL) for image processing
- PyPDF2 & pypdf for PDF manipulation
- PyMuPDF (fitz) for PDF to image conversion - **No system dependencies required!**
- reportlab for PDF generation
- python-pptx for PowerPoint creation
- Flask-CORS for cross-origin support

## Project Structure

```
tes/
├── backend/
│   ├── venv/                 # Python virtual environment
│   ├── app.py               # Flask server
│   ├── requirements.txt     # Python dependencies
│   └── create_test_image.py # Utility to create test images
├── fronted/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageConverter.tsx
│   │   │   ├── ImageConverter.css
│   │   │   ├── PDFConverter.tsx
│   │   │   ├── PDFConverter.css
│   │   │   ├── Navigation.tsx
│   │   │   └── Navigation.css
│   │   ├── App.tsx
│   │   └── App.css
│   ├── e2e/                 # End-to-end tests
│   │   ├── fixtures/        # Test images & PDFs
│   │   ├── image-converter.spec.ts
│   │   └── pdf-converter.spec.ts
│   ├── playwright.config.ts
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Activate the virtual environment:
```bash
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Start the Flask server:
```bash
python app.py
```

The backend server will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd fronted
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. Start both the backend and frontend servers (see setup instructions above)
2. Open your browser to `http://localhost:5173`
3. Use the navigation to switch between Image Converter and PDF Tools

### Image Converter
1. Click the upload area or drag and drop an image
2. Select your desired output format from the dropdown
3. Click "Convert Image" to download the converted file

### PDF Tools
1. Select an operation from the dropdown:
   - **PDF to Images**: Upload PDF, choose format (PNG/JPEG/WEBP), download images
   - **Images to PDF**: Upload multiple images, choose page size, create PDF
   - **PDF to PowerPoint**: Upload PDF, convert to PPTX presentation
   - **Merge PDFs**: Upload multiple PDFs, merge into one
   - **Split PDF**: Upload PDF, choose split type (all pages or range)
   - **Compress PDF**: Upload PDF, get compressed version
   - **Delete Pages**: Upload PDF, specify pages to delete (e.g., 1,3,5 or 1-3)
   - **Rotate Pages**: Upload PDF, choose rotation angle (90°, 180°, 270°)
   - 
2. Upload your file(s)
3. Configure operation-specific options if needed
4. Click "Convert" to process and download


## Supported Formats

### Image Formats
- PNG
- JPEG/JPG
- WEBP
- BMP
- GIF
- TIFF
- ICO

### PDF Operations
- PDF to Images (PNG, JPEG, WEBP, JPG)
- Images to PDF (A4, Letter, Legal)
- PDF to PowerPoint (PPTX)
- Merge, Split, Compress PDFs
- Delete and Rotate PDF pages

## Running Tests

### End-to-End Tests

Make sure both the backend and frontend servers are running, then:

```bash
cd fronted

# Run tests in headless mode
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:report
```

## API Endpoints

### Image Converter API

**GET /health**
- Returns server health status

**GET /formats**
- Returns list of supported image formats

**POST /convert**
- Converts an image to the specified format
- Form data: `file`, `format`
- Returns: Converted image file

### PDF Converter API

**POST /pdf/to-images**
- Convert PDF to images
- Form data: `file`, `format`, `dpi`
- Returns: ZIP file with images (or single image)

**POST /pdf/from-images**
- Convert images to PDF
- Form data: `files[]`, `pageSize`
- Returns: PDF file

**POST /pdf/to-ppt**
- Convert PDF to PowerPoint
- Form data: `file`
- Returns: PPTX file

**POST /pdf/merge**
- Merge multiple PDFs
- Form data: `files[]`
- Returns: Merged PDF

**POST /pdf/split**
- Split PDF into pages
- Form data: `file`, `splitType`, `pageRange`
- Returns: ZIP file with PDFs

**POST /pdf/compress**
- Compress PDF file
- Form data: `file`
- Returns: Compressed PDF

**POST /pdf/delete-pages**
- Delete specific pages
- Form data: `file`, `pages` (e.g., "1,3,5" or "1-3")
- Returns: Edited PDF

**POST /pdf/rotate**
- Rotate PDF pages
- Form data: `file`, `rotation`, `pages`
- Returns: Rotated PDF

**POST /pdf/info**
- Get PDF information
- Form data: `file`
- Returns: JSON with metadata


## Development

### Backend Development

The backend uses Flask with Pillow for image processing. Key features:
- CORS enabled for local development
- Automatic RGBA to RGB conversion for JPEG
- Quality optimization (95%)
- Secure filename handling

### Frontend Development

The frontend is built with React and TypeScript:
- Component-based architecture
- TypeScript for type safety
- Modern CSS with gradient backgrounds
- Responsive design for mobile and desktop

### Adding New Features

**To add a new image format:**
1. Add the format to `SUPPORTED_FORMATS` in `backend/app.py`
2. Add the format to `SUPPORTED_FORMATS` in `fronted/src/components/ImageConverter.tsx`
3. Update tests in `fronted/e2e/image-converter.spec.ts`

## Troubleshooting

**Backend won't start:**
- Make sure virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check that port 5000 is not in use

**Frontend won't start:**
- Delete `node_modules` and run `npm install` again
- Check that port 5173 is not in use

**Tests failing:**
- Ensure both backend and frontend servers are running
- Check that test fixtures exist in `fronted/e2e/fixtures/`
- Run `python backend/create_test_image.py` to regenerate test images


**CORS errors:**
- Verify backend is running on port 5000
- Check Flask-CORS is installed

## License
MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
