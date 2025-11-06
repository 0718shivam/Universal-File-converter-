import { useState, type ChangeEvent, type FormEvent, useEffect, useRef } from 'react';
import './OCRConverter.css';

interface ConversionStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

const OCRConverter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [status, setStatus] = useState<ConversionStatus | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
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
    // Fetch supported languages
    fetch(`${API_URL}/ocr/languages`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch languages');
        }
        return res.json();
      })
      .then(data => {
        if (data.languages) {
          setSupportedLanguages(data.languages);
        }
      })
      .catch(err => {
        console.error('Error fetching languages:', err);
        // Fallback languages
        setSupportedLanguages(['english', 'hindi', 'sanskrit', 'spanish', 'french', 'german']);
        setStatus({
          type: 'info',
          message: 'Could not connect to backend. Please ensure the server is running on port 5001.'
        });
      });
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setStatus({
          type: 'error',
          message: 'Please select a valid image file'
        });
        return;
      }

      setSelectedFile(file);
      setStatus(null);
      setExtractedText('');
      setCopied(false);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(event.target.value);
  };

  const handleExtract = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setStatus({
        type: 'error',
        message: 'Please select an image first'
      });
      return;
    }

    setIsProcessing(true);
    setStatus({
      type: 'info',
      message: 'Extracting text from image...'
    });
    setCopied(false);
    setExtractedText(''); // Clear previous text

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
      } catch (jsonError) {
        throw new Error('Invalid response from server. Please check if the backend is running.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'OCR extraction failed');
      }

      const extracted = data.text || '';
      setExtractedText(extracted);
      
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!extractedText) {
      setStatus({
        type: 'error',
        message: 'No text to copy'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setStatus({
        type: 'success',
        message: 'Text copied to clipboard!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to copy to clipboard'
      });
    }
  };

  const handleDownloadTxt = async () => {
    if (!extractedText) {
      setStatus({
        type: 'error',
        message: 'No text to download'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('text', extractedText);
      const originalName = selectedFile?.name ? 
        selectedFile.name.replace(/\.[^/.]+$/, '') : 'extracted_text';
      formData.append('filename', `${originalName}.txt`);

      const response = await fetch(`${API_URL}/ocr/download-txt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${originalName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStatus({
        type: 'success',
        message: 'Text file downloaded successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to download text file'
      });
    }
  };

  const handleDownloadDocx = async () => {
    if (!extractedText) {
      setStatus({
        type: 'error',
        message: 'No text to download'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('text', extractedText);
      const originalName = selectedFile?.name ? 
        selectedFile.name.replace(/\.[^/.]+$/, '') : 'extracted_text';
      formData.append('filename', `${originalName}.docx`);

      const response = await fetch(`${API_URL}/ocr/download-docx`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${originalName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStatus({
        type: 'success',
        message: 'Word document downloaded successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to download Word document'
      });
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview('');
    setExtractedText('');
    setStatus(null);
    setCopied(false);
  };

  return (
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
              <div className="upload-area">
                {preview ? (
                  <div className="preview-container">
                    <img src={preview} alt="Preview" className="preview-image" />
                    <p className="file-name">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <svg
                      className="upload-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
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
              <h3>Extracted Text</h3>
              <button
                onClick={handleCopyToClipboard}
                className="btn-copy"
                title="Copy to clipboard"
              >
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
              <button
                onClick={handleDownloadTxt}
                className="btn btn-download"
                title="Download as text file"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download as TXT
              </button>
              <button
                onClick={handleDownloadDocx}
                className="btn btn-download"
                title="Download as Word document"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                Download as DOCX
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
            <p>Export as TXT or DOCX, or copy to clipboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRConverter;

