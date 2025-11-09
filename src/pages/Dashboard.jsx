import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCog, FaSignOutAlt, FaChevronDown, FaVideo, FaUsers, FaComments, FaSearch } from 'react-icons/fa';

// Helper to resolve backend-relative avatar paths to the backend origin
const resolveAvatarUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/')) {
    const backendOrigin = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
    return `${backendOrigin}${url}`;
  }
  return url;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartCall = () => {
    // Navigate to friends page to select who to call
    navigate('/friends');
  };

  const handleFindUsers = () => {
    navigate('/search-users');
  };

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
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #405DE6, #833AB4, #E1306C, #FCAF45)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem'
  };

  const subtitleStyle = {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '1rem'
  };

  const profileButtonStyle = {
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '0.5rem',
    background: 'rgba(18, 18, 18, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '1rem',
    minWidth: '280px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    zIndex: 1000
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left'
  };

  const quickActionStyle = {
    padding: '2rem 1.5rem',
    background: 'linear-gradient(45deg, #405DE6, #833AB4)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'center'
  };

  const featureCardStyle = {
    padding: '2rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>SignLink Dashboard</h1>
            <p style={subtitleStyle}>Welcome back, {user?.username}! Ready to connect?</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }} ref={dropdownRef}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={profileButtonStyle}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              {/* Show small avatar image if available, otherwise show user icon */}
              {user?.avatar ? (
                <img
                  src={resolveAvatarUrl(user.avatar)}
                  alt="avatar"
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.12)' }}
                />
              ) : (
                <img src="/default-avatar.svg" alt="default avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.12)' }} />
              )}
              <span>{user?.username}</span>
              <FaChevronDown size={12} />
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div style={dropdownStyle}>
                {/* Profile Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '0.75rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #405DE6, #833AB4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    {/* Show uploaded avatar image when available */}
                    {user?.avatar ? (
                      <img src={resolveAvatarUrl(user.avatar)} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (user?.userType === 'deaf' ? '🤟' : '👂')}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>{user?.username}</div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgba(255, 255, 255, 0.6)',
                      background: user?.userType === 'deaf' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      marginTop: '0.25rem'
                    }}>
                      {user?.userType === 'deaf' ? 'Deaf User' : 'Normal User'}
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.25rem' }}>
                      Email
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>{user?.email}</div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.25rem' }}>
                      Member Since
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Recently'}
                    </div>
                  </div>
                </div>

                {/* Dropdown Menu Items */}
                <div style={{ padding: '0.5rem 0' }}>
                  <button
                    style={dropdownItemStyle}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/profile/edit');
                    }}
                  >
                    <FaUser size={16} />
                    <span>View Profile</span>
                  </button>
                  
                  {/* Settings removed per user request */}
                  
                  <button
                    style={{
                      ...dropdownItemStyle,
                      color: '#f87171'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Full width without sidebar */}
        <div>
          {/* Welcome Section */}
          <div style={{ ...cardStyle, marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              Welcome to SignLink, {user?.username}! 🎉
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
              {user?.userType === 'deaf' 
                ? 'Start connecting with others through sign language translation' 
                : 'Start connecting with deaf users through speech-to-text translation'
              }
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ ...cardStyle, marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Quick Actions</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem'
            }}>
              <button 
                onClick={handleStartCall}
                style={quickActionStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-8px) scale(1.02)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0) scale(1)'}
              >
                <FaUsers size={48} />
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>My Friends</div>
                  <div style={{ fontSize: '0.9rem', opacity: '0.9', marginTop: '0.5rem' }}>
                    View and call your friends
                  </div>
                </div>
              </button>

              <button 
                onClick={handleFindUsers}
                style={quickActionStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-8px) scale(1.02)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0) scale(1)'}
              >
                <FaSearch size={48} />
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>Find Users</div>
                  <div style={{ fontSize: '0.9rem', opacity: '0.9', marginTop: '0.5rem' }}>
                    Discover and connect with other users
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Features</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '1.5rem'
            }}>
              <div 
                style={featureCardStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-8px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <FaVideo size={40} style={{ marginBottom: '1rem', color: '#405DE6' }} />
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: '600' }}>Video Calls</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  High-quality video calls with real-time communication and crystal clear audio
                </p>
              </div>

              <div 
                style={featureCardStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-8px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                  {user?.userType === 'deaf' ? '🤟' : '🎤'}
                </div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: '600' }}>
                  {user?.userType === 'deaf' ? 'Sign Language Translation' : 'Speech to Text'}
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {user?.userType === 'deaf' 
                    ? 'AI-powered translation converts your signs to text and speech instantly' 
                    : 'Real-time speech recognition converts your voice to text for deaf users'
                  }
                </p>
              </div>

              <div 
                style={featureCardStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-8px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <FaComments size={40} style={{ marginBottom: '1rem', color: '#E1306C' }} />
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: '600' }}>Real-time Chat</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Text-based messaging during calls for additional communication and clarity
                </p>
              </div>

              <div 
                style={featureCardStyle}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-8px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <FaSearch size={40} style={{ marginBottom: '1rem', color: '#FCAF45' }} />
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: '600' }}>User Discovery</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Find and connect with other SignLink users based on interests and availability
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
