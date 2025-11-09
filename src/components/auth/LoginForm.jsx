import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginForm({ onToggleMode, error, setError }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setShowErrorDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // <-- Ensure this is the very first line
    console.log('🔵 handleSubmit called');
    setLoading(true);
    setError('');
    setShowErrorDialog(false);

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid username or password');
        setShowErrorDialog(true);
        console.log('🟠 Showing error dialog:', result.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      setShowErrorDialog(true);
      console.log('🔴 Showing error dialog: Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    console.log('🟢 LoginForm mounted');
    // Prevent accidental form reloads globally
    const preventReload = (e) => {
      if (e.target.tagName === 'FORM') {
        e.preventDefault();
      }
    };
    window.addEventListener('submit', preventReload, true);
    return () => {
      window.removeEventListener('submit', preventReload, true);
      console.log('🔴 LoginForm unmounted');
    };
  }, []);

  // ✅ FIXED: All inline styles - no missing CSS classes
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '1rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    background: '#405DE6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1.5rem'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    background: '#ccc',
    cursor: 'not-allowed'
  };

  const errorStyle = {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '14px',
    border: '1px solid #fcc'
  };

  const dividerStyle = {
    display: 'flex', 
    alignItems: 'center', 
    margin: '1.5rem 0',
    color: '#666'
  };

  const switchButtonStyle = {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#405DE6',
    border: '1px solid #405DE6',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '0.5rem'
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Animated Warning Box */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '-70px',
          left: 0,
          right: 0,
          margin: '0 auto',
          maxWidth: '400px',
          background: 'linear-gradient(90deg, #ff5858 0%, #f09819 100%)',
          color: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 24px rgba(255,88,88,0.15)',
          padding: '18px 24px',
          fontSize: '16px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          zIndex: 1000,
          animation: 'fadeInDown 0.5s',
        }}>
          <span style={{ fontSize: '24px', lineHeight: 1 }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {/* Add fadeInDown animation */}
      <style>{`
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            style={inputStyle}
          />
        </div>

        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={loading ? disabledButtonStyle : buttonStyle}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div style={dividerStyle}>
        <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
        <span style={{ padding: '0 1rem', fontSize: '14px' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ 
          color: '#666', 
          marginBottom: '0.75rem', 
          fontSize: '14px'
        }}>
          Don't have an account?
        </p>
        <button
          type="button"
          onClick={onToggleMode}
          disabled={loading}
          style={switchButtonStyle}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}