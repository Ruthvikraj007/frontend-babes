import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SignupForm({ onToggleMode }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const result = await signup(formData);
      if (result.success) {
        // Don't auto-login. Show instruction to verify email.
        setSuccessMessage(result.message || 'Registration successful! Please check your email to verify your account.');
        setFormData({ username: '', email: '', password: '', confirmPassword: '', userType: 'normal' });
        // Optionally switch to login view but keep message visible
        // onToggleMode();
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    background: '#833AB4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem'
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

  const radioContainerStyle = {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
    width: '100%',
    marginBottom: '1.5rem'
  };

  const radioLabelStyle = (isSelected) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 0.75rem',
    background: isSelected ? 'rgba(131, 58, 180, 0.1)' : '#f8f9fa',
    border: isSelected ? '2px solid #833AB4' : '1px solid #ddd',
    borderRadius: '10px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    fontSize: '14px',
    fontFamily: 'inherit'
  });

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}
      {successMessage && (
        <div style={{
          background: 'linear-gradient(90deg,#43e97b 0%,#38f9d7 100%)',
          color: '#063',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '14px',
          border: '1px solid rgba(56,249,215,0.2)'
        }}>
          {successMessage}
        </div>
      )}

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
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
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

        <div>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            style={inputStyle}
          />
        </div>

        <div>
          <p style={{ 
            color: '#666', 
            fontSize: '14px', 
            marginBottom: '0.75rem',
            fontWeight: '500'
          }}>
            I am a:
          </p>
          
          <div style={radioContainerStyle}>
            {/* Normal User Option */}
            <label style={radioLabelStyle(formData.userType === 'normal')}>
              <input
                type="radio"
                name="userType"
                value="normal"
                checked={formData.userType === 'normal'}
                onChange={handleChange}
                disabled={loading}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '1.25rem' }}>👂</span>
              <span>Normal User</span>
            </label>

            {/* Deaf User Option */}
            <label style={radioLabelStyle(formData.userType === 'deaf')}>
              <input
                type="radio"
                name="userType"
                value="deaf"
                checked={formData.userType === 'deaf'}
                onChange={handleChange}
                disabled={loading}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '1.25rem' }}>🤟</span>
              <span>Deaf User</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={loading ? disabledButtonStyle : buttonStyle}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        margin: '1.5rem 0',
        color: '#666'
      }}>
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
          Already have an account?
        </p>
        <button
          type="button"
          onClick={onToggleMode}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: '#833AB4',
            border: '1px solid #833AB4',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Log in
        </button>
      </div>
    </div>
  );
}