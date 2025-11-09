import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaSave, FaArrowLeft, FaCamera } from 'react-icons/fa';

export default function EditProfile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // Preview URL can be an absolute URL, a backend-relative path like '/uploads/avatars/..', or a blob URL
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    // password fields removed; password changes handled elsewhere
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If a new avatar was selected, upload it first
      if (selectedFile) {
        setUploading(true);

        // Build API base same as api.js
        const API_BASE = window.location.hostname === 'localhost'
          ? 'http://localhost:5000'
          : `http://${window.location.hostname}:5000`;

        const token = localStorage.getItem('signlink_token');
        const formData = new FormData();
        formData.append('avatar', selectedFile);

        const resp = await fetch(`${API_BASE}/api/users/me/avatar`, {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          },
          body: formData
        });

        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || 'Avatar upload failed');
        }

        // Update auth context with the returned user
        if (data.user) {
          // updateProfile merges and persists
          await updateProfile({ avatar: data.user.avatar });
        }
        setUploading(false);
      }

      // Simulate other profile updates (none editable currently)
      await new Promise(resolve => setTimeout(resolve, 600));
      alert('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile save error:', error);
      alert(error.message || 'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Resolve avatar paths that are backend-relative (starting with '/') to the backend origin
  const resolveAvatarUrl = (url) => {
    if (!url) return null;
    // blob: and data: and http(s) are already usable by the browser
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If URL starts with '/', it's relative to the server root (backend). Prefix backend origin.
    if (url.startsWith('/')) {
      const backendOrigin = window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : `http://${window.location.hostname}:5000`;
      return `${backendOrigin}${url}`;
    }

    // Otherwise return as-is
    return url;
  };

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #262626 100%)',
    padding: '2rem 1rem',
    color: 'white'
  };

  const cardStyle = {
    background: 'rgba(18, 18, 18, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    maxWidth: '600px',
    margin: '0 auto'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const titleStyle = {
    fontSize: '1.75rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #405DE6, #833AB4, #E1306C)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const backButtonStyle = {
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const formGroupStyle = {
    marginBottom: '1.5rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: 'rgba(255, 255, 255, 0.9)'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease'
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const buttonStyle = {
    padding: '0.75rem 2rem',
    background: 'linear-gradient(45deg, #405DE6, #833AB4)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const profileHeaderStyle = {
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const avatarStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #405DE6, #833AB4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    margin: '0 auto 1rem',
    position: 'relative',
    cursor: 'pointer'
  };

  // Add border to avatar circle for better visibility
  const avatarInnerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid rgba(255,255,255,0.06)'
  };

  const cameraIconStyle = {
    position: 'absolute',
    bottom: '5px',
    right: '5px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '50%',
    padding: '0.25rem',
    fontSize: '0.8rem'
  };

  const userBadgeStyle = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    background: user?.userType === 'deaf' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(59, 130, 246, 0.2)',
    color: user?.userType === 'deaf' ? '#2dd4bf' : '#3b82f6',
    border: `1px solid ${user?.userType === 'deaf' ? 'rgba(45, 212, 191, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginTop: '0.5rem'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={backButtonStyle}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <FaArrowLeft size={16} />
          </button>
          <h1 style={titleStyle}>View Profile</h1>
        </div>

        {/* Profile Header */}
          <div style={profileHeaderStyle}>
          <div style={avatarStyle} onClick={handleAvatarClick} title="Change profile picture">
            <div style={avatarInnerStyle}>
              {previewUrl ? (
                <img src={resolveAvatarUrl(previewUrl)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src="/default-avatar.svg" alt="default avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={cameraIconStyle}>
              <FaCamera />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {user?.username}
            </h2>
            <div style={userBadgeStyle}>
              {user?.userType === 'deaf' ? 'Deaf User' : 'Normal User'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              Basic Information
            </h3>
            
            <div style={formGroupStyle}>
              <label style={labelStyle}>
                <FaUser style={{ display: 'inline', marginRight: '0.5rem' }} />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={{ ...inputStyle, background: 'rgba(255,255,255,0.03)', cursor: 'not-allowed' }}
                readOnly
                disabled
                placeholder="Enter your username"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>
                <FaEnvelope style={{ display: 'inline', marginRight: '0.5rem' }} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{ ...inputStyle, background: 'rgba(255,255,255,0.03)', cursor: 'not-allowed' }}
                readOnly
                disabled
                placeholder="Enter your email address"
              />
            </div>

            {/* Bio and Preferred Language removed */}
          </div>

          {/* Password change removed - handled in separate flow */}

          {/* Account Type (Read-only) */}
          <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              Account Type
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {user?.userType === 'deaf' ? 'Deaf User' : 'Normal User'}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>
              Account type cannot be changed. Contact support if you need to update this.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                ...buttonStyle,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              <FaSave />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
