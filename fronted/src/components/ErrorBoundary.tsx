import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f5f5f5'
        }}>
          <h1 style={{ color: '#e74c3c', marginBottom: '1rem', fontSize: '2rem' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {this.state.error?.stack && (
            <details style={{ marginTop: '1rem', textAlign: 'left', maxWidth: '800px', width: '100%' }}>
              <summary style={{ cursor: 'pointer', color: '#667eea', marginBottom: '0.5rem' }}>
                Show error details
              </summary>
              <pre style={{ 
                background: '#fff', 
                padding: '1rem', 
                borderRadius: '8px', 
                overflow: 'auto',
                fontSize: '0.85rem',
                color: '#333'
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              marginTop: '1.5rem',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#5568d3'}
            onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

