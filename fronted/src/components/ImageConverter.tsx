import { useState, type ChangeEvent, type FormEvent, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import ProgressBar from './ProgressBar';
import { conversionHistory } from '../utils/conversionHistory';
import './ImageConverter.css';

interface ConversionStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

const ImageConverter = () => {
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('PNG');
  const [preview, setPreview] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [status, setStatus] = useState<ConversionStatus | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const SUPPORTED_FORMATS = ['PNG', 'JPEG', 'JPG', 'WEBP', 'BMP', 'GIF', 'TIFF', 'ICO'];
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

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setStatus(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFormatChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTargetFormat(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      setStatus({
        type: 'error',
        message: 'Please sign in to use the converter'
      });
      return;
    }

    if (!selectedFile) {
      setStatus({
        type: 'error',
        message: 'Please select a file first'
      });
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setStatus({ type: 'info', message: 'Converting image...' });

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 90));
    }, 150);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('format', targetFormat);

      const response = await fetch(`${API_URL}/convert`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      // Download the converted file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header or create one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
      const filename = filenameMatch?.[1] || `converted.${targetFormat.toLowerCase()}`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setProgress(100);
      setStatus({ type: 'success', message: `Successfully converted to ${targetFormat}!` });

      // Save to history
      const reader = new FileReader();
      reader.onloadend = () => {
        conversionHistory.add({
          filename: selectedFile.name,
          originalFormat: selectedFile.type.split('/')[1],
          targetFormat: targetFormat.toLowerCase(),
          fileData: reader.result as string,
          size: blob.size
        });
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred during conversion'
      });
    } finally {
      clearInterval(progressInterval);
      setIsConverting(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview('');
    setStatus(null);
    setTargetFormat('PNG');
  };

  return (
    <>
      <div className="image-converter" ref={containerRef}>
        <div className="converter-container">
        <h1>Image Format Converter</h1>
        <p className="subtitle">Convert your images to any format</p>

        <form onSubmit={handleSubmit} className="converter-form">
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
                    <p className="upload-hint">PNG, JPG, WEBP, BMP, GIF, TIFF, ICO</p>
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

          <div className="format-section">
            <label htmlFor="format-select" className="format-label">
              Convert to:
            </label>
            <select
              id="format-select"
              value={targetFormat}
              onChange={handleFormatChange}
              className="format-select"
              style={{ color: 'black' }}
            >
              {SUPPORTED_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </div>

          {status && (
            <div className={`status-message status-${status.type}`}>
              {status.message}
            </div>
          )}

          {isConverting && progress > 0 && (
            <ProgressBar progress={progress} status="Converting..." variant="purple" />
          )}

          <div className="button-group">
            <button
              type="submit"
              disabled={!selectedFile || isConverting}
              className="btn btn-primary"
            >
              {isConverting ? 'Converting...' : 'Convert Image'}
            </button>
            {selectedFile && (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
                disabled={isConverting}
              >
                Reset
              </button>
            )}
          </div>
        </form>

        <div className="features">
          <div className="feature">
            <h3>Fast Conversion</h3>
            <p>Convert images instantly with our optimized backend</p>
          </div>
          <div className="feature">
            <h3>Multiple Formats</h3>
            <p>Support for PNG, JPEG, WEBP, BMP, GIF, TIFF, and ICO</p>
          </div>
          <div className="feature">
            <h3>Privacy First</h3>
            <p>All conversions happen locally on your server</p>
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

export default ImageConverter;
