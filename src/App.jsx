// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CallPage from './pages/CallPage';
import EditProfile from './pages/EditProfile';
import VideoCallContacts from './components/VideoCallContacts'; // ✅ ADDED THIS IMPORT
import UserSearch from './components/users/UserSearch'; // ✅ ADDED USER SEARCH IMPORT
import EmailVerification from './components/auth/EmailVerification'; // ✅ EMAIL VERIFICATION
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    console.error('🔥 Error caught by boundary:', error);
    console.error('🔧 Component stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={errorBoundaryStyles.container}>
          <div style={errorBoundaryStyles.content}>
            <div style={errorBoundaryStyles.icon}>⚠️</div>
            <h1 style={errorBoundaryStyles.title}>Something went wrong</h1>
            <p style={errorBoundaryStyles.message}>
              The application encountered an unexpected error.
            </p>
            
            <div style={errorBoundaryStyles.actions}>
              <button 
                onClick={this.handleReload}
                style={errorBoundaryStyles.primaryButton}
              >
                Reload Application
              </button>
              <button 
                onClick={this.handleGoHome}
                style={errorBoundaryStyles.secondaryButton}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary Styles
const errorBoundaryStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  content: {
    background: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%'
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  title: {
    color: '#333',
    margin: '0 0 15px 0',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  message: {
    color: '#666',
    margin: '0 0 30px 0',
    fontSize: '16px',
    lineHeight: '1.5'
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '30px'
  },
  primaryButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    minWidth: '160px'
  },
  secondaryButton: {
    background: 'transparent',
    color: '#4CAF50',
    border: '2px solid #4CAF50',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    minWidth: '160px'
  }
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        background: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          Loading SignLink...
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        background: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          Loading SignLink...
        </div>
      </div>
    );
  }
  
  return !user ? children : <Navigate to="/dashboard" />;
};

// Safe VideoCallContacts with fallback (in case the file has issues)
const SafeVideoCallContacts = () => {
  try {
    return <VideoCallContacts />;
  } catch (error) {
    console.error('VideoCallContacts component error:', error);
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: 'white',
        fontSize: '1.5rem',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📞</div>
          Video Call Contacts<br />
          <span style={{ fontSize: '1rem', opacity: 0.7 }}>Component error - check console</span>
        </div>
      </div>
    );
  }
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <WebSocketProvider>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } 
                />

                {/* Email Verification Route - Public */}
                <Route 
                  path="/verify-email" 
                  element={<EmailVerification />} 
                />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/video-call-contacts" 
                  element={
                    <ProtectedRoute>
                      <SafeVideoCallContacts />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/friends" 
                  element={
                    <ProtectedRoute>
                      <SafeVideoCallContacts />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/search-users" 
                  element={
                    <ProtectedRoute>
                      <UserSearch />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/call/:roomId" 
                  element={
                    <ProtectedRoute>
                      <CallPage />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/profile/edit" 
                  element={
                    <ProtectedRoute>
                      <EditProfile />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
                
                {/* 404 fallback */}
                <Route path="*" element={
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    gap: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '40px', borderRadius: '15px', backdropFilter: 'blur(10px)' }}>
                      <h1 style={{ fontSize: '48px', margin: '0 0 10px 0' }}>404</h1>
                      <h2 style={{ margin: '0 0 20px 0' }}>Page Not Found</h2>
                      <p style={{ margin: '0 0 30px 0', fontSize: '16px' }}>
                        The page you're looking for doesn't exist.
                      </p>
                      
                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => window.location.href = '/dashboard'}
                          style={{
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                } />
              </Routes>
            </div>
          </WebSocketProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;