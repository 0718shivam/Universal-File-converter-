from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image
import io
import os
import zipfile
from werkzeug.utils import secure_filename

# Import with error handling
try:
    from pdf_converter import (
        pdf_to_images, images_to_pdf, merge_pdfs, split_pdf,
        compress_pdf, get_pdf_info, delete_pdf_pages, pdf_to_ppt, rotate_pdf_pages
    )
except ImportError as e:
    print(f"Warning: Could not import pdf_converter: {e}")

try:
    from ocr_converter import (
        extract_text_from_image, create_text_file, create_word_file, get_supported_languages
    )
    OCR_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import ocr_converter: {e}")
    OCR_AVAILABLE = False
    # Create dummy functions to prevent errors
    def extract_text_from_image(*args, **kwargs):
        raise Exception("OCR module not available. Please install pytesseract and python-docx.")
    def create_text_file(*args, **kwargs):
        raise Exception("OCR module not available.")
    def create_word_file(*args, **kwargs):
        raise Exception("OCR module not available.")
    def get_supported_languages():
        return ['english']

app = Flask(__name__)
CORS(app)

# Supported formats
SUPPORTED_FORMATS = ['PNG', 'JPEG', 'JPG', 'WEBP', 'BMP', 'GIF', 'TIFF', 'ICO']

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Server is running'}), 200

@app.route('/convert', methods=['POST'])
def convert_image():
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        target_format = request.form.get('format', 'PNG').upper()

        # Validate file
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate format
        if target_format not in SUPPORTED_FORMATS:
            return jsonify({'error': f'Unsupported format. Supported formats: {", ".join(SUPPORTED_FORMATS)}'}), 400

        # Read the image
        image_data = file.read()
        img = Image.open(io.BytesIO(image_data))

        # Convert RGBA to RGB if saving as JPEG
        if target_format in ['JPEG', 'JPG'] and img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = rgb_img

        # Create output buffer
        output = io.BytesIO()

        # Save image in target format
        save_format = 'JPEG' if target_format == 'JPG' else target_format
        img.save(output, format=save_format, quality=95)
        output.seek(0)

        # Generate filename
        original_name = os.path.splitext(secure_filename(file.filename))[0]
        extension = target_format.lower()
        if extension == 'jpeg':
            extension = 'jpg'
        new_filename = f"{original_name}.{extension}"

        # Return the converted image
        return send_file(
            output,
            mimetype=f'image/{extension}',
            as_attachment=True,
            download_name=new_filename
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/formats', methods=['GET'])
def get_formats():
    return jsonify({'formats': SUPPORTED_FORMATS}), 200

# ============= PDF CONVERTER ENDPOINTS =============

@app.route('/pdf/to-images', methods=['POST'])
def pdf_to_images_endpoint():
    """Convert PDF to images"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        output_format = request.form.get('format', 'PNG').upper()
        dpi = int(request.form.get('dpi', 200))

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Convert PDF to images
        output_files = pdf_to_images(file, output_format, dpi)

        # If single page, return single file
        if len(output_files) == 1:
            return send_file(
                io.BytesIO(output_files[0]['data']),
                mimetype=f'image/{output_format.lower()}',
                as_attachment=True,
                download_name=output_files[0]['filename']
            )

        # Multiple pages - create ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_data in output_files:
                zip_file.writestr(file_data['filename'], file_data['data'])

        zip_buffer.seek(0)
        original_name = os.path.splitext(secure_filename(file.filename))[0]

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'{original_name}_images.zip'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/from-images', methods=['POST'])
def images_to_pdf_endpoint():
    """Convert multiple images to PDF"""
    try:
        files = request.files.getlist('files')
        page_size = request.form.get('pageSize', 'A4')

        if not files:
            return jsonify({'error': 'No files provided'}), 400

        # Convert images to PDF
        output = images_to_pdf(files, page_size)

        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='converted.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/merge', methods=['POST'])
def merge_pdfs_endpoint():
    """Merge multiple PDFs"""
    try:
        files = request.files.getlist('files')

        if not files or len(files) < 2:
            return jsonify({'error': 'At least 2 PDF files required'}), 400

        # Merge PDFs
        output = merge_pdfs(files)

        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='merged.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/split', methods=['POST'])
def split_pdf_endpoint():
    """Split PDF into multiple files"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        split_type = request.form.get('splitType', 'all')
        page_range = request.form.get('pageRange', '')

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Split PDF
        output_files = split_pdf(file, split_type, page_range)

        # If single file, return it directly
        if len(output_files) == 1:
            return send_file(
                io.BytesIO(output_files[0]['data']),
                mimetype='application/pdf',
                as_attachment=True,
                download_name=output_files[0]['filename']
            )

        # Multiple files - create ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_data in output_files:
                zip_file.writestr(file_data['filename'], file_data['data'])

        zip_buffer.seek(0)
        original_name = os.path.splitext(secure_filename(file.filename))[0]

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'{original_name}_split.zip'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/compress', methods=['POST'])
def compress_pdf_endpoint():
    """Compress PDF file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Compress PDF
        output = compress_pdf(file)

        original_name = os.path.splitext(secure_filename(file.filename))[0]

        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{original_name}_compressed.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/info', methods=['POST'])
def pdf_info_endpoint():
    """Get PDF information"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Get PDF info
        info = get_pdf_info(file)

        return jsonify(info), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/delete-pages', methods=['POST'])
def delete_pages_endpoint():
    """Delete specific pages from PDF"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        pages_to_delete = request.form.get('pages', '')

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not pages_to_delete:
            return jsonify({'error': 'No pages specified for deletion'}), 400

        # Delete pages
        output = delete_pdf_pages(file, pages_to_delete)

        original_name = os.path.splitext(secure_filename(file.filename))[0]

        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{original_name}_edited.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/to-ppt', methods=['POST'])
def pdf_to_ppt_endpoint():
    """Convert PDF to PowerPoint"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Convert to PPT
        output = pdf_to_ppt(file)

        original_name = os.path.splitext(secure_filename(file.filename))[0]

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation',
            as_attachment=True,
            download_name=f'{original_name}.pptx'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/rotate', methods=['POST'])
def rotate_pages_endpoint():
    """Rotate PDF pages"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        rotation = int(request.form.get('rotation', 90))
        pages = request.form.get('pages', 'all')

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Rotate pages
        output = rotate_pdf_pages(file, rotation, pages)

        original_name = os.path.splitext(secure_filename(file.filename))[0]

        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{original_name}_rotated.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= OCR ENDPOINTS =============

@app.route('/ocr/extract', methods=['POST'])
def ocr_extract_endpoint():
    """Extract text from image using OCR"""
    if not OCR_AVAILABLE:
        return jsonify({'error': 'OCR module not available. Please install pytesseract and python-docx.'}), 500
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        language = request.form.get('language', 'english')

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Extract text
        text = extract_text_from_image(file, language)

        return jsonify({
            'text': text,
            'language': language,
            'character_count': len(text)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ocr/download-txt', methods=['POST'])
def ocr_download_txt_endpoint():
    """Download extracted text as TXT file"""
    if not OCR_AVAILABLE:
        return jsonify({'error': 'OCR module not available.'}), 500
    
    try:
        text = request.form.get('text', '')
        filename = request.form.get('filename', 'extracted_text.txt')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Create text file
        text_file = create_text_file(text)

        return send_file(
            text_file,
            mimetype='text/plain',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ocr/download-docx', methods=['POST'])
def ocr_download_docx_endpoint():
    """Download extracted text as DOCX file"""
    if not OCR_AVAILABLE:
        return jsonify({'error': 'OCR module not available.'}), 500
    
    try:
        text = request.form.get('text', '')
        filename = request.form.get('filename', 'extracted_text.docx')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Create Word file
        docx_file = create_word_file(text)

        return send_file(
            docx_file,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ocr/languages', methods=['GET'])
def ocr_languages_endpoint():
    """Get list of supported languages"""
    if not OCR_AVAILABLE:
        return jsonify({'languages': ['english']}), 200
    
    try:
        languages = get_supported_languages()
        return jsonify({'languages': languages}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("Starting Convertify Backend Server...")
    print("=" * 50)
    print(f"Server will run on: http://localhost:5001")
    print(f"OCR Available: {OCR_AVAILABLE}")
    if not OCR_AVAILABLE:
        print("WARNING: OCR features will not work. Install pytesseract and python-docx.")
    print("=" * 50)
    print("\nPress Ctrl+C to stop the server\n")
    app.run(debug=True, host='0.0.0.0', port=5001)
