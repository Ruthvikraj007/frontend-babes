// frontend/src/components/VideoCall.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAIServices } from '../hooks/useAIServices';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/websocketService';
import './call/VideoCall.css';

export const VideoCall = ({ 
  remoteUserId, 
  remoteUserName = 'User',
  callId, 
  onCallEnd,
  isIncomingCall = false,
  isCaller = true, // ✅ NEW: Separate prop to determine who creates offer
  onCallAccept,
  onCallReject
}) => {
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callTimer, setCallTimer] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [remoteCaptions, setRemoteCaptions] = useState([]);
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimeout = useRef(null);
  
  const {
    localStream,
    remoteStream,
    isCallActive,
    callStatus,
    isVideoEnabled,
    isAudioEnabled,
    createOffer,
    endCall,
    toggleVideo,
    toggleAudio,
    cleanupWebRTC
  } = useWebRTC(remoteUserId, callId, isCaller);

  // AI Services integration
  const {
    isAIReady,
    currentGesture,
    currentTranscript,
    interimTranscript,
    captionHistory,
    currentWord,
    currentSentence,
    addSpace,
    backspace,
    clearText,
    clearWord,
    startSignDetection,
    stopSignDetection,
    startSpeechToText,
    stopSpeechToText,
    speakText,
    clearCaptions
  } = useAIServices(user?.userType || 'hearing', localVideoRef);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('📹 Attaching LOCAL stream to video element');
      console.log('   - Video tracks:', localStream.getVideoTracks().length);
      console.log('   - Audio tracks:', localStream.getAudioTracks().length);
      localVideoRef.current.srcObject = localStream;
      
      // Force play if paused
      localVideoRef.current.play().catch(err => {
        console.error('❌ Error playing local video:', err);
      });
    } else {
      console.log('⚠️ Local stream not ready:', { hasRef: !!localVideoRef.current, hasStream: !!localStream });
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('📹 Attaching REMOTE stream to video element');
      console.log('   - Video tracks:', remoteStream.getVideoTracks().length);
      console.log('   - Audio tracks:', remoteStream.getAudioTracks().length);
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Force play if paused
      remoteVideoRef.current.play().catch(err => {
        console.error('❌ Error playing remote video:', err);
      });
    } else {
      console.log('⚠️ Remote stream not ready:', { hasRef: !!remoteVideoRef.current, hasStream: !!remoteStream });
    }
  }, [remoteStream]);

  // Call timer
  useEffect(() => {
    let interval;
    if (isCallActive && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    
    return () => clearInterval(interval);
  }, [isCallActive, callStatus]);

  // Start AI services when call becomes active
  useEffect(() => {
    if (isCallActive && callStatus === 'connected' && isAIReady) {
      console.log('═══════════════════════════════════════');
      console.log('🤖 AI SERVICES ACTIVATED');
      console.log('User Type:', user?.userType);
      console.log('═══════════════════════════════════════');
      
      // Start appropriate AI service based on user type
      if (user?.userType === 'deaf') {
        console.log('👋 Starting SIGN LANGUAGE DETECTION...');
        console.log('   → Make hand gestures in front of your camera');
        startSignDetection();
      } else if (user?.userType === 'hearing' || user?.userType === 'normal') {
        console.log('🎤 Starting SPEECH-TO-TEXT...');
        console.log('   → Speak clearly into your microphone');
        startSpeechToText();
      } else if (user?.userType === 'both') {
        console.log('👋 Starting SIGN LANGUAGE DETECTION...');
        console.log('🎤 Starting SPEECH-TO-TEXT...');
        console.log('   → Make gestures or speak to see captions');
        startSignDetection();
        startSpeechToText();
      } else {
        // Default fallback: Enable speech-to-text only
        console.log('🎤 Starting SPEECH-TO-TEXT (default mode)...');
        console.log('   → Speak clearly into your microphone');
        startSpeechToText();
      }
      
      console.log('💬 Captions are', showCaptions ? 'VISIBLE' : 'HIDDEN');
      console.log('   → Click 💬 button to toggle captions');
      console.log('═══════════════════════════════════════');
    }

    return () => {
      stopSignDetection();
      stopSpeechToText();
    };
  }, [isCallActive, callStatus, isAIReady, user?.userType, showCaptions]); // Removed function deps to prevent constant restart

  // Send complete sentences to remote user when words are completed
  useEffect(() => {
    if (currentSentence && currentSentence.trim()) {
      const caption = {
        type: 'sign',
        text: currentSentence,
        timestamp: Date.now()
      };
      socketService.sendCaption(remoteUserId, caption, callId);
      console.log('📤 Sent complete sentence to remote user:', caption.text);
    }
  }, [currentSentence, remoteUserId, callId]);

  // Send interim speech captions for real-time display
  useEffect(() => {
    if (interimTranscript) {
      const caption = {
        type: 'speech',
        text: interimTranscript,
        interim: true,
        timestamp: Date.now()
      };
      socketService.sendCaption(remoteUserId, caption, callId);
    }
  }, [interimTranscript, remoteUserId, callId]);

  // Send final speech captions
  useEffect(() => {
    if (currentTranscript) {
      const caption = {
        type: 'speech',
        text: currentTranscript,
        timestamp: Date.now()
      };
      socketService.sendCaption(remoteUserId, caption, callId);
      console.log('📤 Sent speech caption to remote user:', caption.text);
    }
  }, [currentTranscript, remoteUserId, callId]);

  // Receive captions from remote user
  useEffect(() => {
    const handleReceiveCaption = (data) => {
      console.log('📥 Received caption from remote user:', data);
      setRemoteCaptions(prev => [...prev.slice(-9), { ...data.caption, id: Date.now(), remote: true }]);
      
      // If hearing user receives sign language caption, speak it aloud
      if ((user?.userType === 'hearing' || user?.userType === 'normal') && data.caption.type === 'sign' && data.caption.text) {
        console.log('🔊 Speaking received sign language text:', data.caption.text);
        speakText(data.caption.text);
      }
    };

    socketService.on('receive_caption', handleReceiveCaption);

    return () => {
      socketService.off('receive_caption', handleReceiveCaption);
    };
  }, [user?.userType, speakText]);

  // Handle call end
  const handleEndCall = () => {
    endCall();
    onCallEnd?.();
  };

  // Handle mouse movement - show controls on hover
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    
    // Hide controls after 3 seconds of inactivity
    hideControlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

  // Format call timer
  const formatCallTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle incoming call acceptance
  const handleAcceptCall = () => {
    onCallAccept?.();
  };

  // Handle incoming call rejection
  const handleRejectCall = () => {
    onCallReject?.();
    handleEndCall();
  };

  // Show incoming call screen
  if (isIncomingCall && !isCallActive) {
    return (
      <div className="video-call-container incoming-call">
        <div className="incoming-call-content">
          <div className="caller-info">
            <div className="caller-avatar">
              {remoteUserName.charAt(0).toUpperCase()}
            </div>
            <h2>{remoteUserName}</h2>
            <p>Incoming Video Call...</p>
          </div>
          
          <div className="incoming-call-controls">
            <button 
              onClick={handleAcceptCall}
              className="control-btn accept-call"
            >
              📞
            </button>
            <button 
              onClick={handleRejectCall}
              className="control-btn reject-call"
            >
              ❌
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="video-call-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="video-grid">
        {/* Remote Video */}
        <div className="remote-video-container">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="remote-video"
          />
          {!remoteStream && (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <div className="user-avatar">
                  {remoteUserName.charAt(0).toUpperCase()}
                </div>
                <h3>{remoteUserName}</h3>
                <p>{callStatus === 'connecting' ? 'Connecting...' : 'Waiting for video...'}</p>
              </div>
            </div>
          )}
          
          {/* Call Timer */}
          {isCallActive && callStatus === 'connected' && (
            <div className="call-timer">
              {formatCallTime(callTimer)}
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted={true}
            className="local-video"
          />
          {!localStream && (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <div className="user-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'Y'}
                </div>
                <h3>You</h3>
                <p>Initializing camera...</p>
              </div>
            </div>
          )}
          <div className="local-video-overlay">
            <span>You</span>
            {!isVideoEnabled && <span className="muted-indicator">📷❌</span>}
            {!isAudioEnabled && <span className="muted-indicator">🎤❌</span>}
          </div>
        </div>
      </div>

      {/* AI Status Indicator */}
      {isCallActive && callStatus === 'connected' && isAIReady && (
        <div className="ai-status-badge">
          <div className="ai-status-title">🤖 AI Services Active</div>
          <div className="ai-status-items">
            {user?.userType === 'deaf' && (
              <span className="ai-badge sign">👋 Sign Detection</span>
            )}
            {user?.userType === 'hearing' && (
              <span className="ai-badge speech">🎤 Speech-to-Text</span>
            )}
            {user?.userType === 'both' && (
              <>
                <span className="ai-badge sign">👋 Signs</span>
                <span className="ai-badge speech">🎤 Speech</span>
              </>
            )}
            <span className="ai-badge tts">🔊 Text-to-Speech</span>
          </div>
        </div>
      )}

      {/* AI Captions Display - Remote Only */}
      {showCaptions && isCallActive && callStatus === 'connected' ? (
        <div className="ai-captions-container">
          {/* Sentence Builder UI - For Deaf Users */}
          {(user?.userType === 'deaf' || user?.userType === 'both') ? (
            <div className="sentence-builder" style={{ display: 'block' }}>
              <div className="sentence-builder-header">
                <span>📝 Building Sentence:</span>
                <div className="sentence-controls">
                  <button 
                    onClick={() => {
                      console.log('🟢 SPACE BUTTON CLICKED IN UI');
                      addSpace();
                    }}
                    className="sentence-btn space-btn"
                    title="Add Space (Complete Word)"
                  >
                    ⎵ Space
                  </button>
                  <button 
                    onClick={() => {
                      console.log('🟢 BACKSPACE BUTTON CLICKED IN UI');
                      backspace();
                    }}
                    className="sentence-btn backspace-btn"
                    title="Backspace"
                  >
                    ⌫
                  </button>
                  <button 
                    onClick={() => {
                      console.log('🟢 CLEAR WORD BUTTON CLICKED IN UI');
                      clearWord();
                    }}
                    className="sentence-btn clear-word-btn"
                    title="Clear Current Word"
                  >
                    ⌫ Word
                  </button>
                  <button 
                    onClick={() => {
                      console.log('🟢 CLEAR ALL BUTTON CLICKED IN UI');
                      clearText();
                    }}
                    className="sentence-btn clear-btn"
                    title="Clear All"
                  >
                    🗑️ All
                  </button>
                </div>
              </div>
              <div className="sentence-display">
                <div className="current-sentence">
                  {currentSentence || <span className="placeholder">Start signing letters...</span>}
                </div>
                <div className="current-word">
                  {currentWord && (
                    <>
                      <span className="word-label">Current word:</span>
                      <span className="word-text">{currentWord}_</span>
                    </>
                  )}
                </div>
              </div>
              {currentGesture && currentGesture.gesture !== 'none' && (
                <div className="current-letter">
                  Detected: <strong>{currentGesture.gesture}</strong> ({currentGesture.confidence}%)
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'white', padding: '20px', background: 'rgba(255,0,0,0.5)' }}>
              ⚠️ Sentence Builder Hidden: userType = {user?.userType || 'undefined'}
            </div>
          )}

          {/* Caption History - Remote Only (only show what the other person is saying/signing) */}
          {remoteCaptions.length > 0 && (
            <div className="caption-history remote">
              <div className="remote-label">{remoteUserName}:</div>
              {remoteCaptions.slice(-3).map((caption) => (
                <div key={caption.id} className={`caption-item ${caption.type} remote ${caption.interim ? 'interim' : ''}`}>
                  {caption.type === 'sign' && '👋 '}
                  {caption.type === 'speech' && '🎤 '}
                  {caption.text}
                  {caption.interim && ' ...'}
                </div>
              ))}
            </div>
          )}

          {/* Instructions when no remote captions */}
          {remoteCaptions.length === 0 && (
            <div className="ai-instructions">
              <div className="instruction-item">
                {user?.userType === 'deaf' && `Waiting for ${remoteUserName} to speak...`}
                {(user?.userType === 'hearing' || user?.userType === 'normal') && `Waiting for ${remoteUserName} to sign...`}
                {user?.userType === 'both' && `Waiting for ${remoteUserName}...`}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: 'fixed', bottom: '100px', left: '20px', color: 'white', background: 'rgba(255,0,0,0.8)', padding: '20px', zIndex: 9999, borderRadius: '10px' }}>
          <div>⚠️ Caption Container NOT Showing</div>
          <div>showCaptions: {String(showCaptions)}</div>
          <div>isCallActive: {String(isCallActive)}</div>
          <div>callStatus: {callStatus}</div>
          <div>userType: {user?.userType || 'undefined'}</div>
        </div>
      )}

      {/* Call Controls - Show on hover */}
      <div className={`call-controls ${showControls ? 'visible' : 'hidden'}`}>
        <button
          onClick={toggleAudio}
          className={`control-btn ${!isAudioEnabled ? 'muted' : ''}`}
          title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
        >
          {isAudioEnabled ? '🎤' : '🔇'}
        </button>

        <button
          onClick={toggleVideo}
          className={`control-btn ${!isVideoEnabled ? 'muted' : ''}`}
          title={isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
        >
          {isVideoEnabled ? '📹' : '📷❌'}
        </button>

        <button
          onClick={() => setShowCaptions(!showCaptions)}
          className={`control-btn ${showCaptions ? 'active' : ''}`}
          title={showCaptions ? 'Hide Captions' : 'Show Captions'}
        >
          💬
        </button>

        <button
          onClick={handleEndCall}
          className="control-btn end-call"
          title="End Call"
        >
          📞❌
        </button>

        {/* Manual Connect Button for caller if auto-connection fails */}
        {isCaller && !isCallActive && !remoteStream && callStatus === 'connecting' && localStream && (
          <button
            onClick={createOffer}
            className="control-btn start-call"
            title="Manually start connection"
          >
            🔗 Connect
          </button>
        )}

        {!isCallActive && callStatus === 'idle' && (
          <button
            onClick={createOffer}
            className="control-btn start-call"
            disabled={callStatus === 'connecting'}
          >
            {callStatus === 'connecting' ? 'Connecting...' : 'Start Call'}
          </button>
        )}
      </div>

      {/* Call Status */}
      <div className="call-status">
        <span className={`status-indicator ${callStatus}`}>
          {callStatus === 'idle' && 'Ready to call'}
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'connected' && `Connected - ${formatCallTime(callTimer)}`}
          {callStatus === 'failed' && 'Connection failed'}
        </span>
        
        {callStatus === 'failed' && (
          <button onClick={createOffer} className="retry-btn">
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;