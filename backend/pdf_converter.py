from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image
import io
import os
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader, PdfWriter, PdfMerger
import fitz  # PyMuPDF
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4, legal
from reportlab.lib.utils import ImageReader
import tempfile
import zipfile

def pdf_to_images(pdf_file, output_format='PNG', dpi=200):
    """Convert PDF to images using PyMuPDF"""
    try:
        pdf_bytes = pdf_file.read()
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        output_files = []

        # Calculate zoom factor based on DPI
        zoom = dpi / 72  # 72 is the default DPI
        mat = fitz.Matrix(zoom, zoom)

        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            pix = page.get_pixmap(matrix=mat)

            # Convert pixmap to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            output = io.BytesIO()

            # Convert RGBA to RGB if saving as JPEG
            if output_format.upper() in ['JPEG', 'JPG'] and img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                if img.mode in ('RGBA', 'LA'):
                    rgb_img.paste(img, mask=img.split()[-1])
                else:
                    rgb_img.paste(img)
                img = rgb_img

            img.save(output, format=output_format, quality=95)
            output.seek(0)
            output_files.append({
                'data': output.getvalue(),
                'filename': f'page_{page_num + 1}.{output_format.lower()}'
            })

        pdf_document.close()
        return output_files
    except Exception as e:
        raise Exception(f"Error converting PDF to images: {str(e)}")

def images_to_pdf(image_files, page_size='A4'):
    """Convert multiple images to a single PDF"""
    try:
        output = io.BytesIO()

        # Set page size
        if page_size.upper() == 'A4':
            size = A4
        elif page_size.upper() == 'LETTER':
            size = letter
        elif page_size.upper() == 'LEGAL':
            size = legal
        else:
            size = A4

        c = canvas.Canvas(output, pagesize=size)
        page_width, page_height = size

        for image_file in image_files:
            try:
                img = Image.open(io.BytesIO(image_file.read()))

                # Calculate scaling to fit page while maintaining aspect ratio
                img_width, img_height = img.size
                width_ratio = page_width / img_width
                height_ratio = page_height / img_height
                scale_ratio = min(width_ratio, height_ratio)

                new_width = img_width * scale_ratio
                new_height = img_height * scale_ratio

                # Center image on page
                x = (page_width - new_width) / 2
                y = (page_height - new_height) / 2

                # Save image to temporary BytesIO
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                img_buffer.seek(0)

                # Draw image on canvas
                c.drawImage(ImageReader(img_buffer), x, y, new_width, new_height)
                c.showPage()

            except Exception as e:
                print(f"Error processing image: {str(e)}")
                continue

        c.save()
        output.seek(0)
        return output
    except Exception as e:
        raise Exception(f"Error converting images to PDF: {str(e)}")

def merge_pdfs(pdf_files):
    """Merge multiple PDFs into one"""
    try:
        merger = PdfMerger()

        for pdf_file in pdf_files:
            pdf_bytes = io.BytesIO(pdf_file.read())
            merger.append(pdf_bytes)

        output = io.BytesIO()
        merger.write(output)
        merger.close()
        output.seek(0)

        return output
    except Exception as e:
        raise Exception(f"Error merging PDFs: {str(e)}")

def split_pdf(pdf_file, split_type='all', page_range=None):
    """Split PDF into individual pages or by range"""
    try:
        pdf_bytes = io.BytesIO(pdf_file.read())
        reader = PdfReader(pdf_bytes)
        total_pages = len(reader.pages)

        output_files = []

        if split_type == 'all':
            # Split into individual pages
            for i in range(total_pages):
                writer = PdfWriter()
                writer.add_page(reader.pages[i])

                output = io.BytesIO()
                writer.write(output)
                output.seek(0)

                output_files.append({
                    'data': output.getvalue(),
                    'filename': f'page_{i+1}.pdf'
                })

        elif split_type == 'range' and page_range:
            # Split by page range (e.g., "1-3,5,7-9")
            ranges = page_range.split(',')
            for idx, r in enumerate(ranges):
                writer = PdfWriter()

                if '-' in r:
                    start, end = map(int, r.split('-'))
                    for i in range(start-1, min(end, total_pages)):
                        writer.add_page(reader.pages[i])
                else:
                    page_num = int(r) - 1
                    if 0 <= page_num < total_pages:
                        writer.add_page(reader.pages[page_num])

                output = io.BytesIO()
                writer.write(output)
                output.seek(0)

                output_files.append({
                    'data': output.getvalue(),
                    'filename': f'split_{idx+1}.pdf'
                })

        return output_files
    except Exception as e:
        raise Exception(f"Error splitting PDF: {str(e)}")

def compress_pdf(pdf_file):
    """Compress PDF by reducing image quality using PyMuPDF"""
    try:
        pdf_bytes = pdf_file.read()
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Create a new PDF with compression
        output = io.BytesIO()
        writer = fitz.open()

        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]

            # Get pixmap with lower DPI for compression
            zoom = 150 / 72  # Lower DPI for compression
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)

            # Convert to PIL Image and compress
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            # Save with compression
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='JPEG', quality=60, optimize=True)
            img_buffer.seek(0)

            # Create new page and add compressed image
            img_doc = fitz.open(stream=img_buffer, filetype="jpeg")
            new_page = writer.new_page(width=page.rect.width, height=page.rect.height)
            new_page.insert_image(new_page.rect, stream=img_buffer.getvalue())

        writer.save(output, garbage=4, deflate=True)
        writer.close()
        pdf_document.close()

        output.seek(0)
        return output
    except Exception as e:
        raise Exception(f"Error compressing PDF: {str(e)}")

def get_pdf_info(pdf_file):
    """Get PDF metadata and information"""
    try:
        pdf_bytes = io.BytesIO(pdf_file.read())
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        info = {
            'pages': pdf_document.page_count,
            'metadata': {}
        }

        metadata = pdf_document.metadata
        if metadata:
            info['metadata'] = {
                'title': metadata.get('title', 'N/A'),
                'author': metadata.get('author', 'N/A'),
                'subject': metadata.get('subject', 'N/A'),
                'creator': metadata.get('creator', 'N/A'),
                'producer': metadata.get('producer', 'N/A'),
            }

        # Get page sizes
        page_sizes = []
        for page_num in range(min(5, pdf_document.page_count)):
            page = pdf_document[page_num]
            rect = page.rect
            page_sizes.append({
                'width': float(rect.width),
                'height': float(rect.height)
            })
        info['page_sizes'] = page_sizes

        pdf_document.close()
        return info
    except Exception as e:
        raise Exception(f"Error getting PDF info: {str(e)}")

def delete_pdf_pages(pdf_file, pages_to_delete):
    """Delete specific pages from PDF
    pages_to_delete: list of page numbers (1-indexed) or string like "1,3,5" or "1-3,5"
    """
    try:
        pdf_bytes = io.BytesIO(pdf_file.read())
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = pdf_document.page_count

        # Parse pages to delete
        pages_set = set()
        if isinstance(pages_to_delete, str):
            ranges = pages_to_delete.split(',')
            for r in ranges:
                r = r.strip()
                if '-' in r:
                    start, end = map(int, r.split('-'))
                    pages_set.update(range(start, end + 1))
                else:
                    pages_set.add(int(r))
        elif isinstance(pages_to_delete, list):
            pages_set = set(pages_to_delete)

        # Delete pages in reverse order to avoid index shifting
        pages_to_delete_list = sorted(pages_set, reverse=True)
        for page_num in pages_to_delete_list:
            if 1 <= page_num <= total_pages:
                pdf_document.delete_page(page_num - 1)  # Convert to 0-indexed

        output = io.BytesIO()
        pdf_document.save(output)
        pdf_document.close()
        output.seek(0)

        return output
    except Exception as e:
        raise Exception(f"Error deleting PDF pages: {str(e)}")

def pdf_to_ppt(pdf_file, layout='blank'):
    """Convert PDF to PowerPoint presentation using PyMuPDF"""
    try:
        from pptx import Presentation
        from pptx.util import Inches

        pdf_bytes = pdf_file.read()
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Create PowerPoint presentation
        prs = Presentation()

        # Set slide dimensions (16:9 aspect ratio)
        prs.slide_width = Inches(10)
        prs.slide_height = Inches(7.5)

        # Convert PDF pages to images
        zoom = 200 / 72  # High DPI for quality
        mat = fitz.Matrix(zoom, zoom)

        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            pix = page.get_pixmap(matrix=mat)

            # Convert to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            # Add blank slide
            blank_slide_layout = prs.slide_layouts[6]  # Blank layout
            slide = prs.slides.add_slide(blank_slide_layout)

            # Convert PIL image to bytes
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)

            # Calculate image size to fit slide while maintaining aspect ratio
            img_width, img_height = img.size
            slide_width = prs.slide_width
            slide_height = prs.slide_height

            # Calculate scaling
            width_ratio = slide_width / img_width
            height_ratio = slide_height / img_height
            scale_ratio = min(width_ratio, height_ratio) * 0.95  # 95% to add some padding

            new_width = int(img_width * scale_ratio)
            new_height = int(img_height * scale_ratio)

            # Center image
            left = (slide_width - new_width) / 2
            top = (slide_height - new_height) / 2

            # Add image to slide
            slide.shapes.add_picture(img_buffer, left, top, new_width, new_height)

        pdf_document.close()

        # Save presentation
        output = io.BytesIO()
        prs.save(output)
        output.seek(0)

        return output
    except Exception as e:
        raise Exception(f"Error converting PDF to PPT: {str(e)}")

def rotate_pdf_pages(pdf_file, rotation=90, pages='all'):
    """Rotate PDF pages using PyMuPDF
    rotation: 90, 180, or 270 degrees clockwise
    pages: 'all' or list of page numbers (1-indexed) or string like "1,3,5"
    """
    try:
        pdf_bytes = io.BytesIO(pdf_file.read())
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = pdf_document.page_count

        # Parse pages to rotate
        pages_set = set()
        if pages == 'all':
            pages_set = set(range(1, total_pages + 1))
        elif isinstance(pages, str):
            ranges = pages.split(',')
            for r in ranges:
                r = r.strip()
                if '-' in r:
                    start, end = map(int, r.split('-'))
                    pages_set.update(range(start, end + 1))
                else:
                    pages_set.add(int(r))
        elif isinstance(pages, list):
            pages_set = set(pages)

        # Rotate specified pages
        for page_num in range(total_pages):
            if (page_num + 1) in pages_set:
                page = pdf_document[page_num]
                page.set_rotation(rotation)

        output = io.BytesIO()
        pdf_document.save(output)
        pdf_document.close()
        output.seek(0)

        return output
    except Exception as e:
        raise Exception(f"Error rotating PDF pages: {str(e)}")
