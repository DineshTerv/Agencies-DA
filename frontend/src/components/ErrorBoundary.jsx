import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid #ffccd2'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#d63031', marginBottom: '0.8rem' }}>Something went wrong</h2>
            <p style={{ color: '#636e72', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  background: 'var(--primary-color, #ff9f43)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/login';
                }}
                style={{
                  background: '#f1f2f6',
                  color: '#2f3542',
                  border: '1px solid #ced6e0',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
