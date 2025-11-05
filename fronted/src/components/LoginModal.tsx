import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onSwitchMode: () => void;
}

const LoginModal = ({ isOpen, onClose, mode, onSwitchMode }: LoginModalProps) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check if Google OAuth is configured
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isGoogleOAuthEnabled = GOOGLE_CLIENT_ID && 
                               GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE' && 
                               GOOGLE_CLIENT_ID.length > 0;

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    setGoogleError(null);
    try {
      // Fetch user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      );

      if (userInfoResponse.ok) {
        const userData = await userInfoResponse.json();
        login({
          id: userData.sub,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        });
        onClose();
      } else {
        setGoogleError('Failed to fetch user information');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setGoogleError('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    setGoogleError('Google sign-in failed. Please try again.');
    setIsLoading(false);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);

    try {
      // Validation
      if (!email || !password) {
        setFormError('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      if (mode === 'signup') {
        if (!name) {
          setFormError('Please enter your name');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setFormError('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setFormError('Passwords do not match');
          setIsLoading(false);
          return;
        }
      }

      // For demo: Use localStorage-based auth
      // In production, this would call your backend API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      if (mode === 'signup') {
        // Check if user already exists (in localStorage for demo)
        const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
        if (existingUsers[email]) {
          setFormError('An account with this email already exists');
          setIsLoading(false);
          return;
        }

        // Save user (in production, this would be a POST to /api/auth/signup)
        existingUsers[email] = {
          email,
          password, // In production, this should be hashed on the backend
          name,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('users', JSON.stringify(existingUsers));

        // Auto-login after signup
        login({
          id: email, // Use email as ID for demo
          name,
          email,
        });

        setFormSuccess('Account created successfully!');
        setTimeout(() => {
          onClose();
          // Reset form
          setEmail('');
          setPassword('');
          setName('');
          setConfirmPassword('');
        }, 1000);
      } else {
        // Login
        const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const user = existingUsers[email];

        if (!user || user.password !== password) {
          setFormError('Invalid email or password');
          setIsLoading(false);
          return;
        }

        // Login successful
        login({
          id: email,
          name: user.name,
          email: user.email,
        });

        setFormSuccess('Login successful!');
        setTimeout(() => {
          onClose();
          // Reset form
          setEmail('');
          setPassword('');
        }, 1000);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setFormError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when mode changes
  useEffect(() => {
    setFormError(null);
    setFormSuccess(null);
    setGoogleError(null);
    if (mode === 'login') {
      setName('');
      setConfirmPassword('');
    }
  }, [mode]);

  // Reset form when modal closes
  const handleClose = () => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setFormError(null);
    setFormSuccess(null);
    setGoogleError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>&times;</button>
        
        <div className="modal-header">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{mode === 'login' ? 'Sign in to continue' : 'Sign up to get started'}</p>
        </div>

        <div className="modal-body">
          {isGoogleOAuthEnabled && (
            <>
              <GoogleLoginButton
                onSuccess={(tokenResponse) => {
                  setIsLoading(true);
                  setGoogleError(null);
                  handleGoogleSuccess(tokenResponse);
                }}
                onError={handleGoogleError}
                isLoading={isLoading}
                text={mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
              />

              {googleError && (
                <div className="error-message" style={{ color: '#e74c3c', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {googleError}
                </div>
              )}

              <div className="divider">
                <span>or</span>
              </div>
            </>
          )}

          <form className="form-section" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={mode === 'signup' ? 6 : undefined}
              />
            </div>

            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            {formError && (
              <div className="error-message" style={{ color: '#e74c3c', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="success-message" style={{ color: '#27ae60', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {formSuccess}
              </div>
            )}

            {mode === 'login' && (
              <div className="form-footer">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); }}>
                  Forgot password?
                </a>
              </div>
            )}

            <button type="submit" className="primary-btn" disabled={isLoading}>
              {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="switch-mode">
            <span>
              {mode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </span>
            <button onClick={onSwitchMode} className="link-btn">
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

