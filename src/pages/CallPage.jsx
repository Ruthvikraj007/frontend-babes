import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { VideoCall } from '../components/VideoCall';  // ✅ FIXED: Using AI-integrated component
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhone, FaComments, FaClosedCaptioning, FaPaperPlane, FaCircle, FaUser } from 'react-icons/fa';

export default function CallPage() {
  // ✅ FIXED: Hooks at the top level - no conditional calls
  const { user } = useAuth();
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const targetUserId = searchParams.get('target');
  const targetUserName = searchParams.get('targetName') || 'Friend';
  const callId = searchParams.get('callId');
  const caller = searchParams.get('caller');
  
  // Debug logging
  useEffect(() => {
    console.log('📞 CallPage mounted with params:');
    console.log('  - roomId:', roomId);
    console.log('  - targetUserId:', targetUserId);
    console.log('  - targetUserName:', targetUserName);
    console.log('  - callId:', callId);
    console.log('  - caller:', caller);
    console.log('  - currentUser:', user?.username);
    
    if (!targetUserId) {
      console.error('❌ targetUserId is missing!');
    }
    if (!callId) {
      console.error('❌ callId is missing!');
    }
  }, [roomId, targetUserId, targetUserName, callId, caller, user]);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCaptionEnabled, setIsCaptionEnabled] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [translationText, setTranslationText] = useState('');

  // Mock translation based on user type
  useEffect(() => {
    if (user?.userType === 'deaf') {
      setTranslationText('Your sign language will be translated to text here in real-time');
    } else {
      setTranslationText('Your speech will be converted to text for deaf users');
    }
  }, [user]);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format call time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(), // ✅ FIXED: Better ID generation
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate reply
    setTimeout(() => {
      const replyMessage = {
        id: Date.now() + 1,
        text: 'I can see your message!',
        sender: 'friend',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, replyMessage]);
    }, 1000);
  };

  const handleEndCall = () => {
    navigate('/dashboard');
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const toggleCaptions = () => {
    setIsCaptionEnabled(!isCaptionEnabled);
  };

  // ✅ FIXED: Simplified styles to prevent rendering issues
  const styles = {
    container: {
      minHeight: '100vh',
      height: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      padding: '0',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      padding: '1rem',
      background: 'rgba(18, 18, 18, 0.8)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '700',
      background: 'linear-gradient(45deg, #405DE6, #833AB4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    videoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '0',
      flex: 1,
      height: '100%',
      minHeight: 0
    },
    videoContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      height: '100%'
    },
    videoPlaceholder: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '2px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      position: 'relative'
    },
    userBadge: {
      position: 'absolute',
      top: '1rem',
      left: '1rem',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    controls: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      background: 'rgba(18, 18, 18, 0.95)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10
    },
    controlButton: {
      padding: '1rem',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '50%',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '60px',
      height: '60px'
    },
    endCallButton: {
      padding: '1rem',
      background: '#E1306C',
      border: 'none',
      borderRadius: '50%',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '60px',
      height: '60px'
    },
    chatSidebar: {
      background: 'rgba(18, 18, 18, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  };

  // ✅ FIXED: Added conditional grid for chat
  const gridStyle = {
    ...styles.videoGrid,
    gridTemplateColumns: isChatOpen ? '1fr 350px' : '1fr'
  };

  return (
    <div style={styles.container}>
      {/* Main Content Grid */}
      <div style={gridStyle}>
          
          {/* Video Call Component */}
          {targetUserId && callId ? (
            <VideoCall
              remoteUserId={targetUserId}
              remoteUserName={targetUserName}
              callId={callId}
              onCallEnd={handleEndCall}
              isIncomingCall={false}
              isCaller={!caller}
            />
          ) : (
            <div style={styles.videoContainer}>
              <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
                <p>❌ Missing call parameters. Please initiate call from contacts page.</p>
                <button onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
          
          {/* Keep the old placeholder for reference (we'll remove later) */}
          <div style={{ display: 'none' }}>
            {/* Video Area */}
            <div style={styles.videoContainer}>
              
              {/* Local Video */}
              <div style={styles.videoPlaceholder}>
                <div style={styles.userBadge}>
                  You | {isVideoEnabled ? 'Video Live' : 'Video Off'}
                </div>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: isVideoEnabled ? 1 : 0.3 }}>
                    <FaUser size={64} />
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                    {isVideoEnabled ? 'Video feed active' : 'Video is disabled'}
                  </p>
                </div>
              </div>

              {/* Remote Video */}
              <div style={styles.videoPlaceholder}>
                <div style={styles.userBadge}>
                  {targetUserName} | Connecting...
              </div>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                  <FaUser size={64} />
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                  Waiting for {targetUserName} to join...
                </p>
              </div>
            </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          {isChatOpen && (
            <div style={styles.chatSidebar}>
              <div style={{ 
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Chat</h3>
                <button 
                  onClick={toggleChat}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <FaComments size={16} />
                </button>
              </div>
              
              <div style={{ 
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {messages.map(message => (
                  <div
                    key={message.id}
                    style={{
                      maxWidth: '80%',
                      padding: '0.75rem 1rem',
                      borderRadius: '18px',
                      fontSize: '0.9rem',
                      ...(message.sender === 'user' ? {
                        background: 'linear-gradient(45deg, #405DE6, #833AB4)',
                        alignSelf: 'flex-end'
                      } : {
                        background: 'rgba(255, 255, 255, 0.1)',
                        alignSelf: 'flex-start'
                      })
                    }}
                  >
                    {message.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} style={{
                padding: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '24px',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem',
                      background: 'linear-gradient(45deg, #405DE6, #833AB4)',
                      border: 'none',
                      borderRadius: '50%',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FaPaperPlane size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
    </div>
  );
}