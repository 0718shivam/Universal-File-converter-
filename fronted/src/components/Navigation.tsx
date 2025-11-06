import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import ProfileDropdown from './ProfileDropdown';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-brand">
            <h2>Convertify</h2>
          </div>
          
          <div className="nav-content">
            <div className="nav-links">
              <Link
                to="/converter"
                className={`nav-link ${location.pathname === '/converter' ? 'active' : ''}`}
              >
                Image Converter
              </Link>
              <Link
                to="/pdf"
                className={`nav-link ${location.pathname === '/pdf' ? 'active' : ''}`}
              >
                PDF Tools
              </Link>
              <Link
                to="/ocr"
                className={`nav-link nav-link-ocr ${location.pathname === '/ocr' ? 'active' : ''}`}
              >
                OCR
              </Link>
            </div>

            <div className="nav-auth">
              {isAuthenticated && user ? (
                <ProfileDropdown user={user} />
              ) : (
                <div className="auth-buttons">
                  <button
                    className="signup-button"
                    onClick={() => {
                      setLoginMode('signup');
                      setShowLoginModal(true);
                    }}
                  >
                    Sign Up
                  </button>
                  <button
                    className="login-button"
                    onClick={() => {
                      setLoginMode('login');
                      setShowLoginModal(true);
                    }}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mode={loginMode}
        onSwitchMode={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')}
      />
    </>
  );
};

export default Navigation;
