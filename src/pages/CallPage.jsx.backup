import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

export default function CallPage() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #262626 100%)',
    padding: '1rem',
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

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const videoPlaceholderStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    aspectRatio: '16/9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255, 255, 255, 0.1)'
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Call Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #405DE6, #833AB4, #E1306C, #FCAF45)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem'
            }}>
              Video Call
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Room: {roomId} • {user?.userType === 'deaf' ? 'Sign Language Mode' : 'Speech Mode'}
            </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={buttonStyle}
          >
            Back to Dashboard
          </button>
        </div>

        <div style={cardStyle}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Local Video */}
            <div>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>You</h2>
              <div style={videoPlaceholderStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                    {user?.userType === 'deaf' ? '🤟' : '👂'}
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Video feed will appear here</p>
                  <div style={{ 
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(45deg, #405DE6, #833AB4)',
                    color: 'white',
                    borderRadius: '20px',
                    display: 'inline-block',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                  }}>
                    {user?.userType === 'deaf' ? 'Deaf User' : 'Normal User'}
                  </div>
                </div>
              </div>
            </div>

            {/* Remote Video */}
            <div>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Remote User</h2>
              <div style={videoPlaceholderStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👤</div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Waiting for connection...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Translation Area */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
              {user?.userType === 'deaf' ? 'Sign Language Translation' : 'Speech to Text'}
            </h2>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1rem',
              minHeight: '100px'
            }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', margin: '2rem 0' }}>
                {user?.userType === 'deaf' 
                  ? 'Your sign language will be translated to text here' 
                  : 'Your speech will be converted to text here'
                }
              </p>
            </div>
          </div>

          {/* Call Controls */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem'
          }}>
            <button style={buttonStyle}>
              🎤 Mute
            </button>
            <button style={buttonStyle}>
              📹 Video Off
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{
                ...buttonStyle,
                background: 'linear-gradient(45deg, #E1306C, #FD1D1D)'
              }}
            >
              📞 End Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
