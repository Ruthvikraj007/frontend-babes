// frontend/src/components/call/VideoCall.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import './VideoCall.css';

export const VideoCall = ({ 
  remoteUserId, 
  remoteUserName = 'User',
  callId, 
  onCallEnd,
  isIncomingCall = false,
  onCallAccept,
  onCallReject
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callTimer, setCallTimer] = useState(0);
  
  // ✅ Pass isCaller parameter (true if NOT incoming call)
  const isCaller = !isIncomingCall;
  
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

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
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

  // Handle call end
  const handleEndCall = () => {
    endCall();
    onCallEnd?.();
  };

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
    <div className="video-call-container">
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
          <div className="local-video-overlay">
            <span>You</span>
            {!isVideoEnabled && <span className="muted-indicator">📷❌</span>}
            {!isAudioEnabled && <span className="muted-indicator">🎤❌</span>}
          </div>
        </div>
      </div>

      {/* Call Controls */}
      <div className="call-controls">
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
          onClick={handleEndCall}
          className="control-btn end-call"
          title="End Call"
        >
          📞❌
        </button>

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
