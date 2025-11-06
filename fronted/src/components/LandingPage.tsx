import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/converter');
  };

  const handleOCR = () => {
    navigate('/ocr');
  };

  const handlePDF = () => {
    navigate('/pdf');
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-content">
          <h2 className="landing-brand">Convertify</h2>
          <nav className="landing-nav">
            <button onClick={handleGetStarted} className="nav-link">Image Converter</button>
            <button onClick={handlePDF} className="nav-link">PDF Tools</button>
            <button onClick={handleOCR} className="nav-link">OCR</button>
          </nav>
        </div>
      </header>
      <div className="landing-hero">
        <h1 className="landing-title">Convertify</h1>
        <h2 className="landing-subtitle">Universal File Converter</h2>
        <p className="landing-description">
          Professional file converter with advanced OCR technology. Transform any document instantly with enterprise-grade security.
        </p>
        <button className="landing-cta" onClick={handleGetStarted}>
          Explore Features →
        </button>
      </div>

      <div className="landing-features">
        <div className="feature-card" onClick={handleGetStarted}>
          <div className="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </div>
          <h3 className="feature-title">Lightning Fast</h3>
          <p className="feature-description">Convert files in seconds with optimized performance.</p>
        </div>

        <div className="feature-card" onClick={handlePDF}>
          <div className="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 className="feature-title">Bank-Level Security</h3>
          <p className="feature-description">Your data is encrypted and handled with utmost privacy.</p>
        </div>

        <div className="feature-card feature-card-ocr" onClick={handleOCR}>
          <div className="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3 className="feature-title">OCR Technology</h3>
          <p className="feature-description">Extract and recognize text from scanned files and images. Supports 20+ languages including English, Hindi, and Sanskrit.</p>
          <button className="feature-cta" onClick={(e) => { e.stopPropagation(); handleOCR(); }}>
            Try OCR →
          </button>
        </div>
      </div>

      <div className="landing-stats">
        <div className="stat-card">
          <div className="stat-number">8,436+</div>
          <div className="stat-label">Files Converted</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">98.35%</div>
          <div className="stat-label">Success Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">30s</div>
          <div className="stat-label">Avg. Processing</div>
        </div>
      </div>

      <div className="conversion-types">
        <div className="conversion-type-card">
          <h3 className="conversion-type-title">PDF Conversions</h3>
          <ul className="conversion-list">
            <li className="conversion-item">PDF → Word (DOCX)</li>
            <li className="conversion-item">PDF → Excel (XLSX)</li>
            <li className="conversion-item">PDF → PowerPoint</li>
            <li className="conversion-item">PDF → Images</li>
          </ul>
        </div>

        <div className="conversion-type-card conversion-type-highlight">
          <h3 className="conversion-type-title">Office Formats</h3>
          <ul className="conversion-list">
            <li className="conversion-item">Excel ↔ CSV</li>
            <li className="conversion-item">Word → HTML</li>
            <li className="conversion-item">PowerPoint → PDF</li>
            <li className="conversion-item">Cross-format support</li>
          </ul>
        </div>

        <div className="conversion-type-card">
          <h3 className="conversion-type-title">OCR Technology</h3>
          <ul className="conversion-list">
            <li className="conversion-item">Extract text from PDFs</li>
            <li className="conversion-item">Read text from images</li>
            <li className="conversion-item">Multi-language support</li>
            <li className="conversion-item">95%+ accuracy rate</li>
          </ul>
        </div>
      </div>

      <div className="landing-cta-section">
        <h2 className="cta-title">Ready to convert your files?</h2>
        <p className="cta-description">
          Click the button below to explore our conversion tools and get started in seconds.
        </p>
        <button className="cta-button" onClick={handleGetStarted}>
          Start Converting Now →
        </button>
      </div>

      <footer className="landing-footer">
        <p>© 2025 Convertify - "Universal File Converter". All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

