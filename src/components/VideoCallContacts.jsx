import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { friendsService } from '../services/friendsService';
import { useNavigate } from 'react-router-dom';
import { socketService } from "../services/websocketService";

const VideoCallContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCallInitiated, setIsCallInitiated] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);

  const { user } = useAuth();
  const { initiateCall } = useWebSocket();
  const navigate = useNavigate();

  // Inline styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b69 100%)',
      color: 'white',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    },
    title: {
      margin: 0,
      fontSize: '2rem',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    status: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.9rem',
      color: '#4CAF50',
      fontWeight: 'bold'
    },
    contactCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '16px',
      maxWidth: '800px',
      margin: '0 auto 16px'
    },
    contactInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: 1
    },
    contactAvatar: {
      position: 'relative',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '1.2rem'
    },
    callButton: {
      background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '25px',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease'
    },
    callOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    callDialog: {
      background: 'rgba(42, 42, 42, 0.95)',
      padding: '30px',
      borderRadius: '15px',
      textAlign: 'center',
      maxWidth: '400px',
      width: '90%',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    bellButton: {
      position: 'relative',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '10px 16px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '1.2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    badge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      background: '#f44336',
      color: 'white',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      border: '2px solid #1a1a1a'
    },
    requestsModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      padding: '20px'
    },
    modalContent: {
      background: 'rgba(26, 26, 26, 0.98)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },
    modalHeader: {
      padding: '20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalBody: {
      padding: '20px',
      overflowY: 'auto',
      flex: 1
    },
    requestCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '16px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    requestInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1
    },
    requestActions: {
      display: 'flex',
      gap: '8px'
    },
    acceptButton: {
      background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    rejectButton: {
      background: 'rgba(244, 67, 54, 0.2)',
      border: '1px solid rgba(244, 67, 54, 0.5)',
      padding: '8px 16px',
      borderRadius: '8px',
      color: '#ff6b6b',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }
  };

  // Load REAL contacts from backend
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading real contacts from backend...');
        
        const friendsList = await friendsService.getFriends();
        console.log('✅ Real contacts loaded:', friendsList);
        
        if (!friendsList || friendsList.length === 0) {
          console.log('ℹ️ No friends found in database');
          setContacts([]);
          return;
        }

        // Transform the data - NO ONLINE STATUS
        const transformedContacts = friendsList.map(friend => ({
          _id: friend._id || friend.id,
          username: friend.username,
          name: friend.name || friend.username,
          userType: friend.userType || 'normal',
          email: friend.email
        }));

        console.log('🔄 Transformed contacts:', transformedContacts);
        setContacts(transformedContacts);
        setFilteredContacts(transformedContacts);

      } catch (error) {
        console.error('❌ Failed to load contacts:', error);
        setError(`Failed to load contacts: ${error.message}`);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    const loadFriendRequests = async () => {
      try {
        console.log('🔄 Loading friend requests...');
        const requests = await friendsService.getFriendRequests();
        console.log('✅ Friend requests loaded:', requests);
        setFriendRequests(requests || []);
      } catch (error) {
        console.error('❌ Failed to load friend requests:', error);
      }
    };

    loadContacts();
    loadFriendRequests();
  }, []); // Only run once on mount

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  // Handle accepting friend request
  const handleAcceptRequest = async (request) => {
    setProcessingRequest(request._id);
    try {
      console.log('✅ Accepting friend request from:', request.fromUser?.username || 'Unknown');
      await friendsService.acceptFriendRequest(request._id, user._id || user.id);
      
      // Remove from requests list
      setFriendRequests(prev => prev.filter(req => req._id !== request._id));
      
      // Reload contacts to show new friend
      const friendsList = await friendsService.getFriends();
      const transformedContacts = friendsList.map(friend => ({
        _id: friend._id || friend.id,
        username: friend.username,
        name: friend.name || friend.username,
        userType: friend.userType || 'normal',
        email: friend.email
      }));
      setContacts(transformedContacts);
      setFilteredContacts(transformedContacts);
      
      alert(`You are now friends with ${request.fromUser?.username || 'this user'}!`);
    } catch (error) {
      console.error('❌ Failed to accept request:', error);
      alert('Failed to accept friend request');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle rejecting friend request
  const handleRejectRequest = async (request) => {
    setProcessingRequest(request._id);
    try {
      console.log('❌ Rejecting friend request from:', request.fromUser?.username || 'Unknown');
      await friendsService.rejectFriendRequest(request._id, user._id || user.id);
      
      // Remove from requests list
      setFriendRequests(prev => prev.filter(req => req._id !== request._id));
      
      alert(`Friend request from ${request.fromUser?.username || 'this user'} rejected`);
    } catch (error) {
      console.error('❌ Failed to reject request:', error);
      alert('Failed to reject friend request');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle video call with Socket.io integration
  const handleVideoCall = useCallback((contact) => {
    console.log('🎯 Starting video call to:', contact.name);

    // Show calling overlay
    setIsCallInitiated(true);

    try {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Send call initiation via Socket.io
      const result = socketService.initiateCall(
        contact._id, 
        contact.username, 
        callId, 
        roomId
      );
      
      console.log('✅ Call invitation sent:', result);

      // Wait for call_accepted event or timeout
      const acceptedHandler = (data) => {
        if (data.callId === callId) {
          console.log('✅ Call accepted, navigating to call page');
          setIsCallInitiated(false);
          socketService.off('call_accepted', acceptedHandler);
          socketService.off('call_rejected', rejectedHandler);
          // Navigate with callId parameter
          navigate(`/call/${roomId}?target=${contact._id}&targetName=${contact.username}&callId=${callId}`);
        }
      };

      const rejectedHandler = (data) => {
        if (data.callId === callId) {
          console.log('❌ Call rejected');
          setIsCallInitiated(false);
          socketService.off('call_accepted', acceptedHandler);
          socketService.off('call_rejected', rejectedHandler);
          setError('Call was rejected');
        }
      };

      socketService.on('call_accepted', acceptedHandler);
      socketService.on('call_rejected', rejectedHandler);

      // Timeout after 30 seconds
      setTimeout(() => {
        socketService.off('call_accepted', acceptedHandler);
        socketService.off('call_rejected', rejectedHandler);
        if (isCallInitiated) {
          setIsCallInitiated(false);
          setError('Call timed out. No response.');
        }
      }, 30000);

    } catch (err) {
      console.error('Call error:', err);
      setIsCallInitiated(false);
      setError('Call failed. Please try again.');
    }
  }, [navigate, isCallInitiated]);

  // Clear error
  const clearError = () => setError(null);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Video Call Contacts</h1>
          <div style={styles.status}>✅ Connected</div>
        </div>
        <div style={{textAlign: 'center', padding: '60px 20px'}}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading contacts from server...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Video Call Contacts</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setShowRequestsModal(true)}
            style={styles.bellButton}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            🔔
            {friendRequests.length > 0 && (
              <span style={styles.badge}>{friendRequests.length}</span>
            )}
          </button>
          <div style={styles.status}>✅ Connected</div>
        </div>
      </div>

      {/* Search */}
      <div style={{position: 'relative', marginBottom: '20px', maxWidth: '400px'}}>
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 40px 12px 16px',
            border: 'none',
            borderRadius: '25px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '1rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button 
            onClick={clearError}
            style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem'}}
          >
            ×
          </button>
        </div>
      )}

      {/* Call Overlay */}
      {isCallInitiated && (
        <div style={styles.callOverlay}>
          <div style={styles.callDialog}>
            <h3 style={{margin: '0 0 20px 0'}}>📞 Initiating Call...</h3>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid #4CAF50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Connecting to contact...</p>
            <button 
              onClick={() => setIsCallInitiated(false)}
              style={{
                background: '#f44336',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '25px',
                color: 'white',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Cancel Call
            </button>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div>
        {filteredContacts.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.6)'}}>
            {searchTerm ? 'No contacts found' : 'No contacts available. Add some friends to start calling!'}
          </div>
        ) : (
          filteredContacts.map(contact => (
            <div key={contact._id} style={styles.contactCard}>
              <div style={styles.contactInfo}>
                <div style={styles.contactAvatar}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{margin: '0 0 4px 0'}}>{contact.name}</h3>
                  <p style={{margin: '0 0 8px 0', opacity: 0.7}}>@{contact.username}</p>
                  <div style={{display: 'flex', gap: '12px', fontSize: '0.8rem'}}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: contact.userType === 'deaf' 
                        ? 'rgba(118, 75, 162, 0.2)' 
                        : 'rgba(102, 126, 234, 0.2)'
                    }}>
                      {contact.userType === 'deaf' ? '👋 Deaf' : '👂 Hearing'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleVideoCall(contact)}
                style={styles.callButton}
              >
                <span>📞</span>
                Video Call
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        opacity: 0.7
      }}>
        <div style={{display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.9rem'}}>
          <span>Total: {contacts.length} contacts</span>
        </div>
      </div>

      {/* Friend Requests Modal */}
      {showRequestsModal && (
        <div style={styles.requestsModal} onClick={() => setShowRequestsModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Friend Requests</h2>
              <button
                onClick={() => setShowRequestsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px'
                }}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              {friendRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                  <h3>No pending requests</h3>
                  <p>You're all caught up!</p>
                </div>
              ) : (
                friendRequests
                  .filter(request => request.fromUser) // Filter out requests without fromUser data
                  .map((request) => (
                  <div key={request._id} style={styles.requestCard}>
                    <div style={styles.requestInfo}>
                      <div style={styles.contactAvatar}>
                        {request.fromUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {request.fromUser?.username || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                          {request.fromUser?.email || ''}
                        </div>
                      </div>
                    </div>
                    <div style={styles.requestActions}>
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        disabled={processingRequest === request._id}
                        style={styles.acceptButton}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        {processingRequest === request._id ? '...' : '✓ Accept'}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        disabled={processingRequest === request._id}
                        style={styles.rejectButton}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        {processingRequest === request._id ? '...' : '× Reject'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VideoCallContacts;