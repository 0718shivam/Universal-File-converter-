import { useState, type ChangeEvent, type FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import ProgressBar from './ProgressBar';
import { conversionHistory } from '../utils/conversionHistory';
import './PDFConverter.css';

interface ConversionStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface PDFInfo {
  pages: number;
  metadata: {
    title: string;
    author: string;
  };
}

const PDFConverter = () => {
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [operation, setOperation] = useState<string>('to-images');
  const [imageFormat, setImageFormat] = useState<string>('PNG');
  const [dpi, setDpi] = useState<number>(200);
  const [pageSize, setPageSize] = useState<string>('A4');
  const [pagesToDelete, setPagesto_Delete] = useState<string>('');
  const [rotation, setRotation] = useState<number>(90);
  const [rotatePages, setRotatePages] = useState<string>('all');
  const [splitType, setSplitType] = useState<string>('all');
  const [pageRange, setPageRange] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.2);
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(36);
  const [watermarkPages, setWatermarkPages] = useState<string>('all');
  const [compressQuality, setCompressQuality] = useState<number>(60);
  const [compressDpi, setCompressDpi] = useState<number>(150);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [status, setStatus] = useState<ConversionStatus | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const API_URL = 'http://localhost:5001';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);
    };

    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (operation === 'from-images' || operation === 'merge') {
      setSelectedFiles(files);
    } else {
      setSelectedFile(files[0]);

      // Auto-get PDF info if PDF is selected
      if (files[0].type === 'application/pdf') {
        getPDFInfo(files[0]);
      }
    }
    setStatus(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (operation === 'from-images' || operation === 'merge') {
      setSelectedFiles(files);
    } else {
      setSelectedFile(files[0]);
      if (files[0].type === 'application/pdf') {
        getPDFInfo(files[0]);
      }
    }
    setStatus(null);
  };

  const getPDFInfo = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/pdf/info`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const info = await response.json();
        setPdfInfo(info);
      }
    } catch (error) {
      console.error('Error getting PDF info:', error);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      setStatus({
        type: 'error',
        message: 'Please sign in to use PDF tools'
      });
      return;
    }

    if (!selectedFile && !selectedFiles) {
      setStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setStatus({ type: 'info', message: 'Processing...' });

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 12, 90));
    }, 200);

    try {
      const formData = new FormData();
      let endpoint = '';

      switch (operation) {
        case 'to-images':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          formData.append('format', imageFormat);
          formData.append('dpi', dpi.toString());
          endpoint = '/pdf/to-images';
          break;

        case 'from-images':
          if (!selectedFiles) throw new Error('No files selected');
          Array.from(selectedFiles).forEach(file => {
            formData.append('files', file);
          });
          formData.append('pageSize', pageSize);
          endpoint = '/pdf/from-images';
          break;

        case 'merge':
          if (!selectedFiles) throw new Error('No files selected');
          Array.from(selectedFiles).forEach(file => {
            formData.append('files', file);
          });
          endpoint = '/pdf/merge';
          break;

        case 'split':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          formData.append('splitType', splitType);
          if (splitType === 'range') {
            formData.append('pageRange', pageRange);
          }
          endpoint = '/pdf/split';
          break;

        case 'compress':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          endpoint = '/pdf/compress';
          break;

        case 'delete-pages':
          if (!selectedFile) throw new Error('No file selected');
          if (!pagesToDelete) throw new Error('Please specify pages to delete');
          formData.append('file', selectedFile);
          formData.append('pages', pagesToDelete);
          endpoint = '/pdf/delete-pages';
          break;

        case 'to-ppt':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          endpoint = '/pdf/to-ppt';
          break;

        case 'rotate':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          formData.append('rotation', rotation.toString());
          formData.append('pages', rotatePages || 'all');
          endpoint = '/pdf/rotate';
          break;

        case 'to-word':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          endpoint = '/pdf/to-word';
          break;

        case 'to-text':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          endpoint = '/pdf/to-text';
          break;

        case 'to-excel':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          endpoint = '/pdf/to-excel';
          break;

        case 'from-excel':
          if (!selectedFile) throw new Error('No file selected');
          formData.append('file', selectedFile);
          formData.append('pageSize', pageSize);
          endpoint = '/pdf/from-excel';
          break;

        case 'encrypt':
          if (!selectedFile) throw new Error('No file selected');
          if (!password) throw new Error('Please enter a password');
          formData.append('file', selectedFile);
          formData.append('password', password);
          endpoint = '/pdf/encrypt';
          break;

        case 'decrypt':
          if (!selectedFile) throw new Error('No file selected');
          if (!password) throw new Error('Please enter a password');
          formData.append('file', selectedFile);
          formData.append('password', password);
          endpoint = '/pdf/decrypt';
          break;

        

        case 'watermark':
          if (!selectedFile) throw new Error('No file selected');
          if (!watermarkText) throw new Error('Please enter watermark text');
          formData.append('file', selectedFile);
          formData.append('text', watermarkText);
          formData.append('opacity', watermarkOpacity.toString());
          formData.append('fontSize', watermarkFontSize.toString());
          formData.append('pages', watermarkPages || 'all');
          endpoint = '/pdf/watermark';
          break;

        default:
          throw new Error('Invalid operation');
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }

      // Download the result
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
      const filename = filenameMatch?.[1] || `result.${getExtension()}`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setProgress(100);
      setStatus({ type: 'success', message: 'Operation completed successfully!' });

      // Save to history
      const reader = new FileReader();
      reader.onloadend = () => {
        conversionHistory.add({
          filename: selectedFile?.name || 'converted',
          originalFormat: 'pdf',
          targetFormat: getExtension(),
          fileData: reader.result as string,
          size: blob.size
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      clearInterval(progressInterval);
      setIsConverting(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const getExtension = () => {
    switch (operation) {
      case 'to-images': return imageFormat.toLowerCase();
      case 'to-ppt': return 'pptx';
      case 'to-word': return 'docx';
      case 'to-excel': return 'xlsx';
      case 'to-text': return 'txt';
      default: return 'pdf';
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedFiles(null);
    setStatus(null);
    setPdfInfo(null);
    setPagesto_Delete('');
    setPageRange('');
    setRotatePages('all');
    setPassword('');
    setDpi(200);
    setWatermarkText('');
    setWatermarkOpacity(0.2);
    setWatermarkFontSize(36);
    setWatermarkPages('all');
  };

  const renderOperationOptions = () => {
    switch (operation) {
      case 'to-images':
        return (
          <div className="option-group">
            <label>Output Format:</label>
            <select value={imageFormat} onChange={(e) => setImageFormat(e.target.value)}>
              <option value="PNG">PNG</option>
              <option value="JPEG">JPEG</option>
              <option value="WEBP">WEBP</option>
            </select>
            <label>Resolution (DPI):</label>
            <input
              type="number"
              min={72}
              max={600}
              value={dpi}
              onChange={(e) => setDpi(parseInt(e.target.value) || 200)}
            />
          </div>
        );

      case 'from-images':
        return (
          <div className="option-group">
            <label>Page Size:</label>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
              <option value="A4">A4</option>
              <option value="LETTER">Letter</option>
              <option value="LEGAL">Legal</option>
            </select>
          </div>
        );

      case 'split':
        return (
          <>
            <div className="option-group">
              <label>Split Type:</label>
              <select value={splitType} onChange={(e) => setSplitType(e.target.value)}>
                <option value="all">All Pages</option>
                <option value="range">Page Range</option>
              </select>
            </div>
            {splitType === 'range' && (
              <div className="option-group">
                <label>Page Range (e.g., 1-3,5,7-9):</label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="1-3,5,7-9"
                />
              </div>
            )}
          </>
        );

      case 'delete-pages':
        return (
          <div className="option-group">
            <label>Pages to Delete (e.g., 1,3,5 or 1-3):</label>
            <input
              type="text"
              value={pagesToDelete}
              onChange={(e) => setPagesto_Delete(e.target.value)}
              placeholder="1,3,5 or 1-3"
            />
          </div>
        );

      case 'rotate':
        return (
          <div className="option-group">
            <label>Rotation:</label>
            <select value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))}>
              <option value="90">90° Clockwise</option>
              <option value="180">180°</option>
              <option value="270">270° Clockwise (90° Counter-clockwise)</option>
            </select>
            <label>Pages (e.g., all or 1,3,5 or 2-4):</label>
            <input
              type="text"
              value={rotatePages}
              onChange={(e) => setRotatePages(e.target.value)}
              placeholder="all"
            />
          </div>
        );

      case 'encrypt':
        return (
          <div className="option-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
        );

      case 'decrypt':
        return (
          <div className="option-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
        );

      case 'from-excel':
        return (
          <div className="option-group">
            <label>Page Size:</label>
            <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
              <option value="A4">A4</option>
              <option value="LETTER">Letter</option>
              <option value="LEGAL">Legal</option>
            </select>
          </div>
        );

      case 'compress':
        return (
          <div className="option-group">
            <label>Quality:</label>
            <input
              type="range"
              min={10}
              max={95}
              value={compressQuality}
              onChange={(e) => setCompressQuality(parseInt(e.target.value))}
            />
            <span>{compressQuality}</span>
            <label>DPI:</label>
            <input
              type="number"
              min={72}
              max={300}
              value={compressDpi}
              onChange={(e) => setCompressDpi(parseInt(e.target.value))}
            />
          </div>
        );

      

      case 'watermark':
        return (
          <>
            <div className="option-group">
              <label>Watermark Text:</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Enter watermark"
              />
            </div>
            <div className="option-group">
              <label>Opacity:</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value) || 0.2)}
              />
            </div>
            <div className="option-group">
              <label>Font Size:</label>
              <input
                type="number"
                min={8}
                max={96}
                value={watermarkFontSize}
                onChange={(e) => setWatermarkFontSize(parseInt(e.target.value) || 36)}
              />
            </div>
            <div className="option-group">
              <label>Pages (e.g., all or 1,3,5 or 2-4):</label>
              <input
                type="text"
                value={watermarkPages}
                onChange={(e) => setWatermarkPages(e.target.value)}
                placeholder="all"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getAcceptType = () => {
    if (operation === 'from-images') return 'image/*';
    if (operation === 'from-excel') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return 'application/pdf';
  };

  const getMultipleFiles = () => {
    return operation === 'from-images' || operation === 'merge';
  };

  return (
    <>
      <div className="pdf-converter" ref={containerRef}>
        <div className="converter-container">
        <h1>PDF Converter & Tools</h1>
        <p className="subtitle">All-in-one PDF conversion and manipulation tool</p>

        <form onSubmit={handleSubmit} className="converter-form">
          <div className="operation-selector">
            <label>Select Operation:</label>
            <select
              value={operation}
              onChange={(e) => {
                setOperation(e.target.value);
                resetForm();
              }}
              className="operation-select"
              style={{ color: '#333333', backgroundColor: '#ffffff' }}
            >
              <option value="to-images">PDF to Images</option>
              <option value="from-images">Images to PDF</option>
              <option value="to-ppt">PDF to PowerPoint</option>
              <option value="to-word">PDF to Word</option>
              <option value="to-excel">PDF to Excel</option>
              <option value="to-text">PDF to Text</option>
              <option value="from-excel">Excel to PDF</option>
              <option value="merge">Merge PDFs</option>
              <option value="split">Split PDF</option>
              <option value="compress">Compress PDF</option>
              <option value="delete-pages">Delete PDF Pages</option>
              <option value="rotate">Rotate PDF Pages</option>
              <option value="encrypt">Encrypt PDF</option>
              <option value="decrypt">Decrypt PDF</option>
              <option value="watermark">Add Watermark</option>
            </select>
          </div>

          <div className="upload-section">
            <label htmlFor="file-input" className="file-label">
              <div 
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="upload-placeholder">
                  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p>Click to upload {getMultipleFiles() ? 'files' : 'a file'}</p>
                  <p className="upload-hint">
                    {getMultipleFiles() ? 'Select multiple files' : 'Select a single file'}
                  </p>
                  {(selectedFile || selectedFiles) && (
                    <p className="file-count">
                      {selectedFiles ? `${selectedFiles.length} files selected` : selectedFile?.name}
                    </p>
                  )}
                </div>
              </div>
            </label>
            <input
              id="file-input"
              type="file"
              accept={getAcceptType()}
              onChange={handleFileChange}
              multiple={getMultipleFiles()}
              className="file-input"
            />
          </div>

          {pdfInfo && (
            <div className="pdf-info">
              <h3>PDF Information</h3>
              <p>Total Pages: {pdfInfo.pages}</p>
              {pdfInfo.metadata.title !== 'N/A' && <p>Title: {pdfInfo.metadata.title}</p>}
              {pdfInfo.metadata.author !== 'N/A' && <p>Author: {pdfInfo.metadata.author}</p>}
            </div>
          )}

          {renderOperationOptions()}

          {status && (
            <div className={`status-message status-${status.type}`}>
              {status.message}
            </div>
          )}

          {isConverting && progress > 0 && (
            <ProgressBar progress={progress} status="Processing..." variant="purple" />
          )}

          <div className="button-group">
            <button type="submit" disabled={(!selectedFile && !selectedFiles) || isConverting}
              className="btn btn-primary">
              {isConverting ? 'Processing...' : 'Convert'}
            </button>
            {(selectedFile || selectedFiles) && (
              <button type="button" onClick={resetForm} className="btn btn-secondary" disabled={isConverting}>
                Reset
              </button>
            )}
          </div>
        </form>

          <div className="features-grid">
          <div className="feature-card">
            <h3>PDF to Images</h3>
            <p>Convert PDF pages to PNG, JPEG, or WEBP</p>
          </div>
          <div className="feature-card">
            <h3>Images to PDF</h3>
            <p>Combine multiple images into one PDF</p>
          </div>
          <div className="feature-card">
            <h3>PDF to PPT</h3>
            <p>Convert PDF to PowerPoint presentation</p>
          </div>
          <div className="feature-card">
            <h3>PDF to Word</h3>
            <p>Convert PDF to editable DOCX</p>
          </div>
          <div className="feature-card">
            <h3>PDF to Excel</h3>
            <p>Export tabular data to XLSX</p>
          </div>
          <div className="feature-card">
            <h3>PDF to Text</h3>
            <p>Extract plain text from PDF</p>
          </div>
          <div className="feature-card">
            <h3>Excel to PDF</h3>
            <p>Convert XLSX spreadsheets to PDF</p>
          </div>
          <div className="feature-card">
            <h3>Merge PDFs</h3>
            <p>Combine multiple PDF files</p>
          </div>
          <div className="feature-card">
            <h3>Split PDF</h3>
            <p>Extract pages or split by range</p>
          </div>
          <div className="feature-card">
            <h3>Compress PDF</h3>
            <p>Reduce PDF file size</p>
          </div>
          <div className="feature-card">
            <h3>Delete Pages</h3>
            <p>Remove specific pages from PDF</p>
          </div>
          <div className="feature-card">
            <h3>Rotate Pages</h3>
            <p>Rotate PDF pages</p>
          </div>
          <div className="feature-card">
            <h3>Encrypt/Decrypt</h3>
            <p>Protect or unlock PDFs with a password</p>
          </div>
          <div className="feature-card">
            <h3>Add Watermark</h3>
            <p>Apply custom text watermark to pages</p>
          </div>
          
        </div>
      </div>
    </div>

    <LoginModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      mode={loginMode}
      onSwitchMode={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')}
    />
  </>
  );
};

export default PDFConverter;
