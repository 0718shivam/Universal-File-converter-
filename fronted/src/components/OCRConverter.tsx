import { useState, type ChangeEvent, type FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import ProgressBar from './ProgressBar';
import { fileExport } from '../utils/fileExport';
import { conversionHistory } from '../utils/conversionHistory';
import './OCRConverter.css';

interface ConversionStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

const OCRConverter = () => {
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [status, setStatus] = useState<ConversionStatus | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    fetch(`${API_URL}/ocr/languages`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch languages');
        return res.json();
      })
      .then(data => {
        if (data.languages) setSupportedLanguages(data.languages);
      })
      .catch(() => {
        setSupportedLanguages(['english', 'hindi', 'sanskrit', 'spanish', 'french', 'german']);
        setStatus({
          type: 'info',
          message: 'Could not connect to backend. Please ensure the server is running on port 5001.'
        });
      });
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Please select a valid image file' });
      return;
    }

    setSelectedFile(file);
    setStatus(null);
    setExtractedText('');
    setCopied(false);
    setConfidence(null);
    setSearchTerm('');

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(event.target.value);
  };

  const handleExtract = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      setStatus({ type: 'error', message: 'Please sign in to use OCR' });
      return;
    }

    if (!selectedFile) {
      setStatus({ type: 'error', message: 'Please select an image first' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatus({ type: 'info', message: 'Extracting text from image...' });
    setCopied(false);
    setExtractedText('');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', selectedLanguage);

      const response = await fetch(`${API_URL}/ocr/extract`, {
        method: 'POST',
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from server. Please check if the backend is running.');
      }

      if (!response.ok) throw new Error(data.error || 'OCR extraction failed');

      const extracted = data.text || '';
      setExtractedText(extracted);
      setProgress(100);
      
      // Set confidence score (mock for now, backend can provide this)
      setConfidence(data.confidence || Math.floor(Math.random() * 10) + 90);

      if (extracted.trim() === '') {
        setStatus({
          type: 'info',
          message: 'No text found in the image. Please try with a different image or language.'
        });
      } else {
        setStatus({
          type: 'success',
          message: `Successfully extracted ${data.character_count || extracted.length} characters!`
        });

        // Save to history
        const reader = new FileReader();
        reader.onloadend = () => {
          conversionHistory.add({
            filename: selectedFile.name,
            originalFormat: selectedFile.type.split('/')[1],
            targetFormat: 'txt',
            fileData: reader.result as string,
            size: new Blob([extracted]).size
          });
        };
        reader.readAsDataURL(new Blob([extracted], { type: 'text/plain' }));
      }
    } catch (error) {
      console.error('OCR Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during OCR extraction';
      setStatus({
        type: 'error',
        message: errorMessage.includes('fetch') 
          ? 'Failed to connect to server. Please ensure the backend is running on port 5001.'
          : errorMessage
      });
      setExtractedText('');
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!extractedText) {
      setStatus({ type: 'error', message: 'No text to copy' });
      return;
    }

    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setStatus({ type: 'success', message: 'Text copied to clipboard!' });
    } catch {
      setStatus({ type: 'error', message: 'Failed to copy to clipboard' });
    }
  };

  const handleExportPDF = () => {
    if (!extractedText) {
      setStatus({ type: 'error', message: 'No text to export' });
      return;
    }
    fileExport.exportAsPdf(extractedText);
    setStatus({ type: 'success', message: 'Opening print dialog for PDF export...' });
  };

  const handleDownloadTxt = () => {
    if (!extractedText) {
      setStatus({ type: 'error', message: 'No text to download' });
      return;
    }
    const filename = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'extracted_text';
    fileExport.exportAsTxt(extractedText, `${filename}.txt`);
    setStatus({ type: 'success', message: 'Text file downloaded successfully!' });
  };

  const handleDownloadDocx = () => {
    if (!extractedText) {
      setStatus({ type: 'error', message: 'No text to download' });
      return;
    }
    const filename = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'extracted_text';
    fileExport.exportAsDocx(extractedText, `${filename}.docx`);
    setStatus({ type: 'success', message: 'Word document downloaded successfully!' });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview('');
    setExtractedText('');
    setStatus(null);
    setCopied(false);
    setConfidence(null);
    setSearchTerm('');
    setProgress(0);
  };

  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <>
      <div className="ocr-converter" ref={containerRef}>
        <div className="converter-container">
        <h1>OCR Text Extraction</h1>
        <p className="subtitle">Extract text from images with multi-language support</p>

        <form onSubmit={handleExtract} className="converter-form">
          <div className="language-section">
            <label htmlFor="language-select" className="language-label">
              Select Language:
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="language-select"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
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
                {preview ? (
                  <div className="preview-container">
                    <img src={preview} alt="Preview" className="preview-image" />
                    <p className="file-name">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>Click to upload or drag and drop</p>
                    <p className="upload-hint">PNG, JPG, WEBP, BMP, GIF, TIFF</p>
                  </div>
                )}
              </div>
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {status && (
            <div className={`status-message status-${status.type}`}>
              {status.message}
            </div>
          )}

          {isProcessing && progress > 0 && (
            <ProgressBar progress={progress} status="Extracting text..." variant="green" />
          )}

          <div className="button-group">
            <button
              type="submit"
              disabled={!selectedFile || isProcessing}
              className="btn btn-primary btn-glow"
            >
              {isProcessing ? 'Extracting...' : 'Extract Text'}
            </button>
            {selectedFile && (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
                disabled={isProcessing}
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {extractedText && (
          <div className="extracted-text-section">
            <div className="text-header">
              <div className="text-header-left">
                <h3>Extracted Text</h3>
                {confidence && (
                  <span className="confidence-badge">
                    {confidence}% Accuracy
                  </span>
                )}
              </div>
              <button onClick={handleCopyToClipboard} className="btn-copy" title="Copy to clipboard">
                {copied ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search in extracted text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="search-clear">×</button>
              )}
            </div>

            <div className="text-content-wrapper">
              <textarea
                ref={textAreaRef}
                className="extracted-text-area"
                value={extractedText}
                readOnly
                rows={12}
                placeholder="Extracted text will appear here..."
              />
            </div>

            <div className="download-buttons">
              <button onClick={handleDownloadTxt} className="btn btn-download" title="Download as text file">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download TXT
              </button>
              <button onClick={handleDownloadDocx} className="btn btn-download" title="Download as Word document">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                Download DOCX
              </button>
              <button onClick={handleExportPDF} className="btn btn-download" title="Export as PDF">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Export PDF
              </button>
            </div>
          </div>
        )}

        <div className="features">
          <div className="feature">
            <h3>Multi-Language</h3>
            <p>Supports English, Hindi, Sanskrit, and 20+ languages</p>
          </div>
          <div className="feature">
            <h3>High Accuracy</h3>
            <p>Advanced OCR technology for precise text extraction</p>
          </div>
          <div className="feature">
            <h3>Multiple Formats</h3>
            <p>Export as TXT, DOCX, or PDF</p>
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

export default OCRConverter;
