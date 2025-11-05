import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import ImageConverter from './components/ImageConverter';
import PDFConverter from './components/PDFConverter';

// Replace with your Google OAuth Client ID
// Get it from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  // Always wrap with GoogleOAuthProvider - if no client ID, Google login will simply be disabled
  // Users can still use email/password login (when backend is implemented)
  const AppContent = () => (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navigation />
            <div className="content-wrapper">
              <Routes>
                <Route path="/" element={<ImageConverter />} />
                <Route path="/pdf" element={<PDFConverter />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );

  // Determine if we have a valid Google Client ID
  const hasValidClientId = GOOGLE_CLIENT_ID && 
                           GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && 
                           GOOGLE_CLIENT_ID.length > 0;
  
  const clientId = hasValidClientId ? GOOGLE_CLIENT_ID : '';

  // Wrap GoogleOAuthProvider in ErrorBoundary to catch any initialization errors
  // If clientId is empty, the provider might still work but Google login will be disabled
  const WrappedApp = () => {
    if (!clientId) {
      // If no client ID, render without GoogleOAuthProvider
      // This prevents errors when the library doesn't accept empty strings
      return <AppContent />;
    }
    
    return (
      <GoogleOAuthProvider clientId={clientId}>
        <AppContent />
      </GoogleOAuthProvider>
    );
  };

  return (
    <ErrorBoundary>
      <WrappedApp />
    </ErrorBoundary>
  );
}

export default App;
