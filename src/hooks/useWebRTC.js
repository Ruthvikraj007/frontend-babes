import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/websocketService';

export const useWebRTC = (remoteUserId, callId, isCaller = false) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const isInitializedRef = useRef(false);
  const offerCreatedRef = useRef(false);
  const offerTimeoutRef = useRef(null);

  // ✅ FIXED: Moved iceServers outside of component to prevent recreation
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // ✅ FIXED: Stable cleanup function without dependencies
  const cleanupWebRTC = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC...');
    
    // Stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    // Stop remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset states
    setIsCallActive(false);
    setCallStatus('idle');
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setError(null);
    isInitializedRef.current = false;
    
    console.log('✅ WebRTC cleanup completed');
  }, []); // ✅ No dependencies

  // ✅ FIXED: Initialize WebRTC with stable dependencies
  const initializeWebRTC = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log('🔄 WebRTC already initialized');
      return;
    }

    try {
      console.log('🎥 Initializing WebRTC...');
      setCallStatus('connecting');
      setError(null);

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera/microphone access not supported. Please use HTTPS or check browser permissions.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      console.log('✅ User media obtained');

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        console.log('📹 ontrack event received!');
        console.log('   - Track kind:', event.track.kind);
        console.log('   - Streams count:', event.streams?.length);
        
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          console.log('✅ Remote stream received successfully');
          console.log('   - Video tracks:', remoteStream.getVideoTracks().length);
          console.log('   - Audio tracks:', remoteStream.getAudioTracks().length);
          
          remoteStreamRef.current = remoteStream;
          setRemoteStream(remoteStream);
          setIsCallActive(true);
          setCallStatus('connected');
        } else {
          console.warn('⚠️ No streams in ontrack event');
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && remoteUserId) {
          socketService.sendICECandidate(remoteUserId, event.candidate, callId);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`🔗 Peer connection state: ${state}`);
        
        switch (state) {
          case 'connected':
            setIsCallActive(true);
            setCallStatus('connected');
            setError(null);
            break;
          case 'disconnected':
          case 'failed':
            setIsCallActive(false);
            setCallStatus('failed');
            setError('Connection failed. Please try again.');
            break;
          case 'connecting':
            setCallStatus('connecting');
            break;
          case 'closed':
            setIsCallActive(false);
            setCallStatus('ended');
            break;
        }
      };

      isInitializedRef.current = true;
      console.log('✅ WebRTC initialized successfully');
      console.log('📊 isCaller status will be checked for auto-offer');

    } catch (error) {
      console.error('❌ Error initializing WebRTC:', error);
      setCallStatus('failed');
      setError(error.message || 'Failed to initialize video call');
      cleanupWebRTC();
    }
  }, [remoteUserId, callId, cleanupWebRTC]); // ✅ Stable dependencies

  // ✅ FIXED: Event handlers with stable dependencies
  const handleWebRTCOffer = useCallback(async (data) => {
    console.log('📨 handleWebRTCOffer called from:', data.fromUserId);
    
    if (!peerConnectionRef.current) {
      console.error('❌ No peer connection available');
      return;
    }
    
    if (data.fromUserId !== remoteUserId) {
      console.log('⚠️ Offer from wrong user. Expected:', remoteUserId, 'Got:', data.fromUserId);
      return;
    }

    try {
      console.log('📥 Processing WebRTC offer');
      
      // Check signaling state to prevent race conditions
      const signalingState = peerConnectionRef.current.signalingState;
      console.log('🔍 Current signaling state:', signalingState);
      
      if (signalingState === 'have-local-offer') {
        console.log('⚠️ Already have local offer, ignoring remote offer to prevent glare');
        return;
      }
      
      setCallStatus('connecting');
      console.log('📝 Setting remote description (offer)...');
      await peerConnectionRef.current.setRemoteDescription(data.offer);
      console.log('✅ Remote description set');
      
      console.log('📝 Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      console.log('✅ Answer created');
      
      console.log('📝 Setting local description (answer)...');
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('✅ Local description set');
      
      console.log('📤 Sending answer to:', remoteUserId);
      socketService.sendWebRTCAnswer(remoteUserId, answer, callId);
      console.log('✅ WebRTC answer sent successfully');
      
    } catch (error) {
      console.error('❌ Error handling WebRTC offer:', error);
      setCallStatus('failed');
      setError(error.message || 'Failed to respond to call');
    }
  }, [remoteUserId, callId]);

  const handleWebRTCAnswer = useCallback(async (data) => {
    console.log('📨 handleWebRTCAnswer called from:', data.fromUserId);
    
    if (!peerConnectionRef.current) {
      console.error('❌ No peer connection available');
      return;
    }
    
    if (data.fromUserId !== remoteUserId) {
      console.log('⚠️ Answer from wrong user. Expected:', remoteUserId, 'Got:', data.fromUserId);
      return;
    }

    try {
      console.log('📥 Processing WebRTC answer');
      
      // Check signaling state
      const signalingState = peerConnectionRef.current.signalingState;
      console.log('🔍 Current signaling state:', signalingState);
      
      if (signalingState !== 'have-local-offer') {
        console.log('⚠️ Not in correct state to receive answer (expected: have-local-offer, got:', signalingState + ')');
        return;
      }
      
      console.log('📝 Setting remote description (answer)...');
      await peerConnectionRef.current.setRemoteDescription(data.answer);
      console.log('✅ Remote answer set successfully');
      console.log('🎉 WebRTC connection should now be established!');
    } catch (error) {
      console.error('❌ Error handling WebRTC answer:', error);
      setCallStatus('failed');
      setError(error.message || 'Failed to establish call connection');
    }
  }, [remoteUserId]);

  const handleICECandidate = useCallback(async (data) => {
    if (!peerConnectionRef.current || data.fromUserId !== remoteUserId) return;

    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }, [remoteUserId]);

  const handleEndCall = useCallback((data) => {
    if (data.fromUserId === remoteUserId) {
      console.log('📞 Call ended by remote user');
      cleanupWebRTC();
    }
  }, [remoteUserId, cleanupWebRTC]);

  // ✅ FIXED: Create offer with stable dependencies
  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current) {
      setError('No peer connection available');
      return;
    }

    try {
      const signalingState = peerConnectionRef.current.signalingState;
      console.log('📤 Creating WebRTC offer... (current state:', signalingState + ')');
      
      // Prevent creating offer if not in stable state
      if (signalingState !== 'stable') {
        console.log('⚠️ Cannot create offer, not in stable state:', signalingState);
        return;
      }
      
      setCallStatus('connecting');

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socketService.sendWebRTCOffer(remoteUserId, offer, callId);
      console.log('✅ WebRTC offer created and sent');
      
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      setCallStatus('failed');
      setError(error.message || 'Failed to create call offer');
      
      // Reset offer flag to allow retry
      offerCreatedRef.current = false;
    }
  }, [remoteUserId, callId]);

  // ✅ FIXED: Simple toggle functions without dependencies
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks[0].enabled = newState;
        setIsVideoEnabled(newState);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioTracks[0].enabled;
        audioTracks[0].enabled = newState;
        setIsAudioEnabled(newState);
      }
    }
  }, []);

  // ✅ FIXED: End call with stable dependencies
  const endCall = useCallback(() => {
    console.log('📞 Ending call...');
    
    if (remoteUserId && callId) {
      socketService.sendEndCall(remoteUserId, callId);
    }
    
    cleanupWebRTC();
  }, [remoteUserId, callId, cleanupWebRTC]);

  // ✅ FIXED: Simplified useEffect without infinite re-renders
  useEffect(() => {
    console.log('🔧 useWebRTC effect triggered with remoteUserId:', remoteUserId, 'callId:', callId);
    
    if (!remoteUserId) {
      console.warn('⚠️ No remoteUserId provided, skipping WebRTC initialization');
      return;
    }

    console.log('✅ Starting WebRTC setup for remote user:', remoteUserId);

    // Setup event listeners
    socketService.onWebRTCOffer(handleWebRTCOffer);
    socketService.onWebRTCAnswer(handleWebRTCAnswer);
    socketService.onICECandidate(handleICECandidate);
    socketService.onEndCall(handleEndCall);

    // Initialize WebRTC
    initializeWebRTC();

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up WebRTC listeners');
      socketService.off('webrtc_offer', handleWebRTCOffer);
      socketService.off('webrtc_answer', handleWebRTCAnswer);
      socketService.off('webrtc_ice_candidate', handleICECandidate);
      socketService.off('webrtc_end_call', handleEndCall);
    };
  }, [remoteUserId, initializeWebRTC, handleWebRTCOffer, handleWebRTCAnswer, handleICECandidate, handleEndCall]);

  // ✅ NEW: Automatically create offer when caller's WebRTC is initialized
  useEffect(() => {
    console.log('🔍 Auto-offer check:', {
      isCaller,
      isInitialized: isInitializedRef.current,
      offerCreated: offerCreatedRef.current,
      hasPeerConnection: !!peerConnectionRef.current,
      hasLocalStream: !!localStream
    });

    if (isCaller && isInitializedRef.current && !offerCreatedRef.current && peerConnectionRef.current && localStream) {
      console.log('📤 Caller detected - automatically creating offer in 1000ms');
      offerCreatedRef.current = true;
      
      // Clear any existing timeout
      if (offerTimeoutRef.current) {
        clearTimeout(offerTimeoutRef.current);
      }
      
      // Delay to ensure both sides are ready and prevent glare
      offerTimeoutRef.current = setTimeout(() => {
        if (!peerConnectionRef.current) {
          console.log('⚠️ Peer connection lost before creating offer');
          return;
        }
        
        const signalingState = peerConnectionRef.current.signalingState;
        console.log('📤 About to create offer, signaling state:', signalingState);
        
        // Only create offer if in stable state
        if (signalingState === 'stable') {
          console.log('📤 Creating offer...');
          // Call createOffer directly without callback dependency
          if (!peerConnectionRef.current) {
            setError('No peer connection available');
            return;
          }

          (async () => {
            try {
              const pc = peerConnectionRef.current;
              const state = pc.signalingState;
              console.log('📤 Creating WebRTC offer... (current state:', state + ')');
              
              if (state !== 'stable') {
                console.log('⚠️ Cannot create offer, not in stable state:', state);
                return;
              }
              
              setCallStatus('connecting');
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              socketService.sendWebRTCOffer(remoteUserId, offer, callId);
              console.log('✅ WebRTC offer created and sent');
              
            } catch (error) {
              console.error('❌ Error creating offer:', error);
              setCallStatus('failed');
              setError(error.message || 'Failed to create call offer');
              offerCreatedRef.current = false;
            }
          })();
        } else {
          console.log('⚠️ Not in stable state, resetting flag to retry');
          offerCreatedRef.current = false;
        }
      }, 1000);
    } else if (!isCaller) {
      console.log('📥 Receiver mode - waiting for offer');
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (offerTimeoutRef.current) {
        clearTimeout(offerTimeoutRef.current);
      }
    };
  }, [isCaller, remoteUserId, callId, localStream]); // localStream needed to trigger when stream becomes available

  return {
    localStream,
    remoteStream,
    isCallActive,
    callStatus,
    isVideoEnabled,
    isAudioEnabled,
    error,
    createOffer,
    endCall,
    toggleVideo,
    toggleAudio,
    cleanupWebRTC,
    peerConnection: peerConnectionRef.current
  };
};