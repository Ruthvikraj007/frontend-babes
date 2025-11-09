import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginError, setLoginError] = useState('');

  // ✅ FIXED: Inline styles instead of missing CSS classes
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  };

  const floatingStyle = {
    position: 'absolute',
    fontSize: '2rem',
    opacity: 0.7,
    animation: 'float 6s ease-in-out infinite'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '2.5rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '450px',
    zIndex: 10
  };

  const FloatingIcons = () => (
    <>
      <div style={{ ...floatingStyle, top: '15%', left: '10%', animationDelay: '0s' }}>🤟</div>
      <div style={{ ...floatingStyle, top: '85%', left: '15%', animationDelay: '2s' }}>👂</div>
      <div style={{ ...floatingStyle, top: '25%', right: '10%', animationDelay: '4s' }}>🎥</div>
      <div style={{ ...floatingStyle, top: '75%', right: '15%', animationDelay: '1s' }}>💬</div>
      <div style={{ ...floatingStyle, top: '50%', left: '5%', animationDelay: '3s' }}>🔊</div>
      <div style={{ ...floatingStyle, top: '45%', right: '5%', animationDelay: '5s' }}>👁️</div>
    </>
  );

  // Add CSS animation
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
    `;
    document.head.appendChild(style);
  }

  return (
    <div style={containerStyle}>
      <FloatingIcons />
      
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.75rem', 
            fontWeight: '700', 
            background: 'linear-gradient(45deg, #405DE6, #833AB4, #E1306C, #FCAF45)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 0 0.5rem 0',
            lineHeight: '1.2'
          }}>
            SignLink
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#666',
            margin: '0',
            lineHeight: '1.5'
          }}>
            {isLogin ? 'Connect through sign language and speech' : 'Join our inclusive community'}
          </p>
        </div>
        
        {isLogin ? (
          <LoginForm 
            onToggleMode={() => setIsLogin(false)} 
            error={loginError}
            setError={setLoginError}
          />
        ) : (
          <SignupForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}