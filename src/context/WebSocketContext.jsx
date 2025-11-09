// src/context/WebSocketContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { socketService } from '../services/websocketService';
import { useNavigate } from 'react-router-dom';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const processedCallIdsRef = React.useRef(new Set());
  const navigate = useNavigate();

  // Track auth state and connection attempts
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('signlink_token'));
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxAttempts = 5;

  // Check for token changes periodically
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem('signlink_token');
      if (currentToken !== authToken) {
        console.log('🔑 Auth token changed:', currentToken ? 'present' : 'removed');
        setAuthToken(currentToken);
        setConnectionAttempts(0);
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 1000);

    const handleStorageChange = (e) => {
      if (e.key === 'signlink_token') {
        console.log('🔑 Storage event - Auth token changed:', e.newValue ? 'present' : 'removed');
        setAuthToken(e.newValue);
        setConnectionAttempts(0);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [authToken]);

  // Handle socket connection with retries
  useEffect(() => {
    let mounted = true;
    let reconnectTimer = null;

    const connectSocket = async () => {
      if (!authToken) {
        console.log('⚠️ No auth token available, waiting...');
        setIsConnected(false);
        return;
      }

      if (connectionAttempts >= maxAttempts) {
        console.error('❌ Max connection attempts reached');
        return;
      }

      try {
        console.log('🔄 Attempting WebSocket connection...', { 
          attempt: connectionAttempts + 1,
          maxAttempts,
          hasToken: !!authToken
        });

        await socketService.connect();
        
        if (mounted) {
          setIsConnected(true);
          setConnectionAttempts(0);
          console.log('✅ WebSocket connected successfully');
        }
      } catch (error) {
        console.error('❌ WebSocket connection error:', error);
        
        if (mounted) {
          setIsConnected(false);
          setConnectionAttempts(prev => prev + 1);
          
          if (connectionAttempts < maxAttempts) {
            console.log(`� Will retry connection in 3 seconds... (Attempt ${connectionAttempts + 1}/${maxAttempts})`);
            reconnectTimer = setTimeout(connectSocket, 3000);
          }
        }
      }
    };

    connectSocket();

    return () => {
      mounted = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socketService.disconnect();
    };
  }, [authToken, connectionAttempts]);

  // Handle online users updates
  useEffect(() => {
    if (!isConnected) return;

    socketService.on('online_users', (users) => {
      console.log('� Received online users update:', users);
      setOnlineUsers(users);
    });

    return () => {
      socketService.off('online_users');
    };
  }, [isConnected]);

  // Handle incoming calls and accepted calls
  useEffect(() => {
    const handleIncomingCall = (callData) => {
      console.log('📞 Incoming call received in WebSocketContext:', callData);
      console.log('📋 Processed call IDs:', Array.from(processedCallIdsRef.current));
      console.log('🔍 Is this call already processed?', processedCallIdsRef.current.has(callData.callId));
      
      // Check if we've already processed this call
      if (processedCallIdsRef.current.has(callData.callId)) {
        console.log('⚠️ Call already processed, ignoring:', callData.callId);
        return;
      }
      
      console.log('📞 Setting incomingCall state with:', {
        callerId: callData.callerId,
        callerName: callData.callerName,
        callId: callData.callId,
        roomId: callData.roomId
      });
      
      // Mark this call as processed
      processedCallIdsRef.current.add(callData.callId);
      console.log('✅ Added to processed IDs. New set:', Array.from(processedCallIdsRef.current));
      
      setIncomingCall(callData);
    };

    const handleCallAccepted = (data) => {
      console.log('✅ Call accepted:', data);
      if (data.roomId) {
        // Navigate with proper parameters - targetUserId is the ID of the person who accepted
        navigate(`/call/${data.roomId}?target=${data.targetUserId}&targetName=${data.targetUsername}&callId=${data.callId}`);
      }
    };

    socketService.on('incoming_call', handleIncomingCall);
    socketService.on('call_accepted', handleCallAccepted);

    return () => {
      socketService.off('incoming_call', handleIncomingCall);
      socketService.off('call_accepted', handleCallAccepted);
    };
  }, [navigate]);

  // Debug: Watch incomingCall state changes
  useEffect(() => {
    console.log('🔔 incomingCall state changed:', incomingCall);
    if (incomingCall) {
      console.log('🔔 Incoming call notification should be visible now!');
    }
  }, [incomingCall]);

  // Initiate a call
  const initiateCall = useCallback((targetUserId, targetUsername) => {
    console.log('🎯 Initiating call to:', targetUsername);
    
    const callId = `call_${Date.now()}`;
    const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;

    const success = socketService.initiateCall(targetUserId, targetUsername, callId, roomId);
    
    if (success) {
      return { callId, roomId, targetUserId, targetUsername };
    } else {
      throw new Error('Failed to initiate call');
    }
  }, []);

  // Accept incoming call
  const acceptCall = useCallback((callData) => {
    console.log('🎯 acceptCall function called with:', callData);
    
    if (!callData) {
      console.error('❌ acceptCall called with no callData');
      alert('Error: No call data available');
      return;
    }
    
    console.log('✅ Accepting call:', callData);
    console.log('📤 Sending accept_call to server:', {
      callerId: callData.callerId,
      callId: callData.callId,
      roomId: callData.roomId
    });
    
    try {
      console.log('1️⃣ Marking call as processed');
      // Mark this call as processed to prevent showing notification again
      processedCallIdsRef.current.add(callData.callId);
      console.log('📋 Processed IDs after adding:', Array.from(processedCallIdsRef.current));
      
      console.log('2️⃣ Clearing incoming call state');
      // Clear the incoming call immediately to prevent re-showing
      setIncomingCall(null);
      
      console.log('3️⃣ Sending accept_call to server');
      // Send acceptance to server
      const result = socketService.acceptCall(callData.callerId, callData.callId, callData.roomId);
      console.log('3️⃣ acceptCall result:', result);
      
      console.log('4️⃣ Setting up navigation timeout');
      // Small delay to ensure state is cleared before navigation
      setTimeout(() => {
        // Navigate to call page with proper parameters
        const callPageUrl = `/call/${callData.roomId}?target=${callData.callerId}&targetName=${callData.callerName}&callId=${callData.callId}&caller=${callData.callerId}`;
        console.log('🚀 About to navigate to:', callPageUrl);
        console.log('🚀 navigate function:', typeof navigate);
        try {
          navigate(callPageUrl);
          console.log('✅ Navigation completed');
        } catch (navError) {
          console.error('❌ Navigation error:', navError);
          alert('Navigation failed: ' + navError.message);
        }
      }, 100);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      console.error('❌ Error stack:', error.stack);
      alert('Error accepting call: ' + error.message);
    }
  }, [navigate]);

  // Reject incoming call
  const rejectCall = useCallback((callData) => {
    if (!callData) return;
    
    console.log('❌ Rejecting call:', callData);
    
    // Mark this call as processed
    processedCallIdsRef.current.add(callData.callId);
    console.log('📋 Processed IDs after rejecting:', Array.from(processedCallIdsRef.current));
    
    socketService.rejectCall(callData.callerId, callData.callId);
    setIncomingCall(null);
  }, []);

  // End ongoing call
  const endCall = useCallback((callId, targetUserId) => {
    console.log('📞 Ending call:', callId);
    socketService.sendEndCall(targetUserId, callId);
  }, []);

  const value = {
    isConnected,
    onlineUsers,
    incomingCall,
    setIncomingCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    getConnectionStatus: () => ({ 
      isConnected, 
      socketId: socketService.socket?.id,
      connectionAttempts,
      maxAttempts,
      canRetry: connectionAttempts < maxAttempts
    })
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
      
      {/* Incoming Call Notification */}
      {incomingCall && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📞</div>
            <h2 style={{ color: 'white', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
              Incoming Call
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 2rem 0', fontSize: '1.1rem' }}>
              {incomingCall.callerName || 'Unknown'} is calling...
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={(e) => {
                  try {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Accept button clicked!');
                    console.log('📞 Current incomingCall state:', incomingCall);
                    console.log('📞 acceptCall function exists?', typeof acceptCall);
                    acceptCall(incomingCall);
                    console.log('✅ acceptCall executed successfully');
                  } catch (err) {
                    console.error('❌ Error in Accept button handler:', err);
                    alert('Error: ' + err.message);
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('👆 Accept button touched!');
                  console.log('📞 Calling acceptCall with:', incomingCall);
                  acceptCall(incomingCall);
                }}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                ✅ Accept
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ Reject button clicked!');
                  rejectCall(incomingCall);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('👆 Reject button touched!');
                  rejectCall(incomingCall);
                }}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </WebSocketContext.Provider>
  );
};