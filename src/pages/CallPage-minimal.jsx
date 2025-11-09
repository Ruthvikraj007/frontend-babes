import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhone, FaComments, FaUser } from 'react-icons/fa';

export default function CallPage() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const targetUser = searchParams.get('target') || 'Friend';
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callTime, setCallTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return \\:\\;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #262626 100%)',
      padding: '1rem',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(18, 18, 18, 0.8)',
          borderRadius: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #405DE6, #833AB4, #E1306C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0
            }}>
              Video Call
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0.25rem 0' }}>
              Room: {roomId} | Calling: {targetUser} | Time: {formatTime(callTime)}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem',
          height: '400px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <FaUser size={64} style={{ marginBottom: '1rem' }} />
            <p>You ({isVideoEnabled ? 'Video On' : 'Video Off'})</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <FaUser size={64} style={{ marginBottom: '1rem' }} />
            <p>{targetUser}</p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.5rem'
        }}>
          <button 
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {isVideoEnabled ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
          </button>

          <button 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {isAudioEnabled ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
          </button>

          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '1rem',
              background: 'linear-gradient(45deg, #E1306C, #FD1D1D)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <FaPhone size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}
