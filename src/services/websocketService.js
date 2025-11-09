// frontend/src/services/websocketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Prevent duplicate connections
        if (this.socket && this.socket.connected) {
          console.log('⚠️ Already connected to Socket.io server');
          resolve();
          return;
        }

        const token = localStorage.getItem('signlink_token');
        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        console.log('🔌 Connecting to Socket.io server...');
        
        // Determine server URL based on hostname (for network access)
        const serverUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5000' 
          : `http://${window.location.hostname}:5000`;
        
        console.log('🌐 Socket.io server URL:', serverUrl);
        
        // Connect to Socket.io server
        this.socket = io(serverUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('✅ Socket.io connected:', this.socket.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Socket.io disconnected:', reason);
          this.isConnected = false;
          this.handleReconnection();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.io connection error:', error.message);
          reject(error);
        });

        // Handle incoming messages
        this.socket.onAny((eventName, data) => {
          console.log(`📨 Received ${eventName}:`, data);
          this.handleMessage(eventName, data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(eventName, data) {
    if (this.messageHandlers.has(eventName)) {
      const handlers = this.messageHandlers.get(eventName);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for ${eventName}:`, error);
        }
      });
    }
  }

  // Send message to server
  emit(eventName, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventName, data);
      console.log(`📤 Emitted ${eventName}:`, data);
      return true;
    } else {
      console.error('❌ Socket not connected');
      return false;
    }
  }

  // Register event handlers
  on(eventName, handler) {
    if (!this.messageHandlers.has(eventName)) {
      this.messageHandlers.set(eventName, new Set());
    }
    this.messageHandlers.get(eventName).add(handler);
    console.log(`📝 Registered handler for ${eventName}`);
  }

  off(eventName, handler) {
    if (this.messageHandlers.has(eventName)) {
      const handlers = this.messageHandlers.get(eventName);
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(eventName);
      }
    }
  }

  // WebRTC specific methods
  sendWebRTCOffer(targetUserId, offer, callId) {
    return this.emit('webrtc_offer', {
      toUserId: targetUserId,
      offer,
      callId
    });
  }

  sendWebRTCAnswer(targetUserId, answer, callId) {
    return this.emit('webrtc_answer', {
      toUserId: targetUserId,
      answer,
      callId
    });
  }

  sendICECandidate(targetUserId, candidate, callId) {
    return this.emit('webrtc_ice_candidate', {
      toUserId: targetUserId,
      candidate,
      callId
    });
  }

  sendEndCall(targetUserId, callId) {
    return this.emit('webrtc_end_call', {
      toUserId: targetUserId,
      callId
    });
  }

  // Send caption to remote user
  sendCaption(targetUserId, captionData, callId) {
    return this.emit('send_caption', {
      toUserId: targetUserId,
      caption: captionData,
      callId
    });
  }

  // Call initiation
  initiateCall(targetUserId, targetUsername, callId, roomId) {
    return this.emit('initiate_call', {
      targetUserId,
      targetUsername,
      callId,
      roomId
    });
  }

  acceptCall(callerId, callId, roomId) {
    return this.emit('accept_call', {
      callerId,
      callId,
      roomId
    });
  }

  rejectCall(callerId, callId) {
    return this.emit('reject_call', {
      callerId,
      callId
    });
  }

  // Handler registration methods for useWebRTC
  onWebRTCOffer(handler) { this.on('webrtc_offer', handler); }
  onWebRTCAnswer(handler) { this.on('webrtc_answer', handler); }
  onICECandidate(handler) { this.on('webrtc_ice_candidate', handler); }
  onEndCall(handler) { this.on('webrtc_end_call', handler); }
  onIncomingCall(handler) { this.on('incoming_call', handler); }
  onCallAccepted(handler) { this.on('call_accepted', handler); }
  onCallRejected(handler) { this.on('call_rejected', handler); }

  removeMessageHandler(eventName, handler) {
    this.off(eventName, handler);
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, 3000);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.messageHandlers.clear();
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id
    };
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Auto-connect when imported (if user is logged in)
// Only connect if not already connected
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const token = localStorage.getItem('signlink_token');
    if (token && !socketService.isConnected && !socketService.socket) {
      socketService.connect().catch(error => {
        console.error('Failed to connect Socket.io:', error);
      });
    }
  }, 1000);
}