import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserCheck, FaUserTimes, FaBell, FaUserFriends, FaClock, FaPaperPlane } from 'react-icons/fa';
import { friendsService } from '../../services/friendsService';
import { useWebSocket } from '../../context/WebSocketContext';

export default function FriendRequests({ onClose, onUpdateFriends }) {
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [activeTab, setActiveTab] = useState('received');
    
    const { 
        friendRequests: realTimeRequests, 
        clearNewRequestCount,
        removeFriendRequest 
    } = useWebSocket();

    useEffect(() => {
        loadFriendRequests();
        clearNewRequestCount();
    }, []);

    useEffect(() => {
        if (realTimeRequests.length > 0) {
            setFriendRequests(prev => {
                const newRequests = [...prev];
                realTimeRequests.forEach(realTimeReq => {
                    if (!newRequests.some(req => req.id === realTimeReq.id)) {
                        newRequests.push(realTimeReq);
                    }
                });
                return newRequests;
            });
        }
    }, [realTimeRequests]);

    const loadFriendRequests = async () => {
        try {
            setLoading(true);
            
            const currentUser = JSON.parse(localStorage.getItem('signlink_user'));
            if (!currentUser || !currentUser.id) {
                console.error('No current user found');
                return;
            }

            console.log('📥 [FriendRequests] Loading requests for user:', currentUser.id);
            
            // Load received requests from API
            const response = await fetch(`http://localhost:5000/api/friends/requests?currentUserId=${currentUser.id}`);
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ [FriendRequests] Loaded requests:', data.requests);
                setFriendRequests(data.requests);
            } else {
                console.error('❌ [FriendRequests] Failed to load requests:', data.error);
            }
            
            // Load sent requests
            const sentRequestsList = await loadSentRequests();
            setSentRequests(sentRequestsList);
            
        } catch (error) {
            console.error('❌ [FriendRequests] Failed to load friend requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSentRequests = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('signlink_user'));
            // For now, return empty array since we don't have a sent requests endpoint
            return [];
        } catch (error) {
            console.error('Failed to load sent requests:', error);
            return [];
        }
    };

    const handleAcceptRequest = async (request) => {
        setProcessing(prev => ({ ...prev, [request.id]: 'accepting' }));
        try {
            const currentUser = JSON.parse(localStorage.getItem('signlink_user'));
            const result = await friendsService.acceptFriendRequest(request.id, currentUser.id);
            
            if (result.success) {
                console.log('✅ [FriendRequests] Request accepted successfully');
                
                // Remove from requests list
                setFriendRequests(prev => prev.filter(req => req.id !== request.id));
                removeFriendRequest(request.id);
                
                // Notify parent to refresh friends list
                if (onUpdateFriends && typeof onUpdateFriends === 'function') {
                    onUpdateFriends(result.newFriend);
                }
                
                // Show success message
                alert(`You are now friends with ${request.username}!`);
                
                // Reload requests to get updated count
                await loadFriendRequests();
            }
        } catch (error) {
            console.error('❌ [FriendRequests] Failed to accept friend request:', error);
            alert('Failed to accept friend request. Please try again.');
        } finally {
            setProcessing(prev => ({ ...prev, [request.id]: null }));
        }
    };

    const handleRejectRequest = async (request) => {
        setProcessing(prev => ({ ...prev, [request.id]: 'rejecting' }));
        try {
            const currentUser = JSON.parse(localStorage.getItem('signlink_user'));
            await friendsService.rejectFriendRequest(request.id, currentUser.id);
            
            console.log('✅ [FriendRequests] Request rejected successfully');
            
            // Remove from requests list
            setFriendRequests(prev => prev.filter(req => req.id !== request.id));
            removeFriendRequest(request.id);
            
            // Show success message
            alert(`Friend request from ${request.username} rejected`);
            
        } catch (error) {
            console.error('❌ [FriendRequests] Failed to reject friend request:', error);
            alert('Failed to reject friend request. Please try again.');
        } finally {
            setProcessing(prev => ({ ...prev, [request.id]: null }));
        }
    };

    const handleCancelSentRequest = async (request) => {
        setProcessing(prev => ({ ...prev, [request.id]: 'canceling' }));
        try {
            // For now, we'll just remove from the local state
            setSentRequests(prev => prev.filter(req => req.id !== request.id));
            
            // Show success message
            alert(`Friend request to ${request.username} cancelled`);
        } catch (error) {
            console.error('Failed to cancel friend request:', error);
            alert('Failed to cancel friend request. Please try again.');
        } finally {
            setProcessing(prev => ({ ...prev, [request.id]: null }));
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const sentTime = new Date(timestamp);
        const diffInHours = Math.floor((now - sentTime) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours === 1) {
            return '1 hour ago';
        } else if (diffInHours < 24) {
            return `${diffInHours} hours ago`;
        } else {
            const days = Math.floor(diffInHours / 24);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    };

    // Styles
    const modalStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(18, 18, 18, 0.95)',
        padding: '0',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        color: 'white',
        zIndex: 1000,
        overflow: 'hidden'
    };

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 999
    };

    const headerStyle = {
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    };

    const tabContainerStyle = {
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.02)'
    };

    const tabStyle = {
        flex: 1,
        padding: '1rem',
        background: 'transparent',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.6)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '0.9rem',
        fontWeight: '500',
        borderBottom: '2px solid transparent'
    };

    const activeTabStyle = {
        ...tabStyle,
        color: 'white',
        borderBottom: '2px solid #405DE6'
    };

    const requestCardStyle = {
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease'
    };

    const acceptButtonStyle = {
        padding: '0.75rem 1rem',
        background: 'linear-gradient(45deg, #10B981, #059669)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.8rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: '100px',
        justifyContent: 'center'
    };

    const rejectButtonStyle = {
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        fontSize: '0.8rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const cancelButtonStyle = {
        padding: '0.75rem 1rem',
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        fontSize: '0.8rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: '100px',
        justifyContent: 'center'
    };

    const emptyStateStyle = {
        textAlign: 'center', 
        padding: '3rem', 
        color: 'rgba(255, 255, 255, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
    };

    return (
        <>
            <div style={overlayStyle} onClick={onClose} />
            <div style={modalStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            padding: '0.5rem',
                            background: 'linear-gradient(45deg, #405DE6, #833AB4)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FaBell size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                                Friend Requests
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                {friendRequests.length} pending • {sentRequests.length} sent
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'white', 
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={(e) => e.target.style.background = 'none'}
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={tabContainerStyle}>
                    <button 
                        style={activeTab === 'received' ? activeTabStyle : tabStyle}
                        onClick={() => setActiveTab('received')}
                    >
                        Received ({friendRequests.length})
                    </button>
                    <button 
                        style={activeTab === 'sent' ? activeTabStyle : tabStyle}
                        onClick={() => setActiveTab('sent')}
                    >
                        Sent ({sentRequests.length})
                    </button>
                </div>

                {/* Requests List */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={emptyStateStyle}>
                            <div className="instagram-loading">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            Loading requests...
                        </div>
                    ) : activeTab === 'received' ? (
                        friendRequests.length === 0 ? (
                            <div style={emptyStateStyle}>
                                <FaUserFriends size={48} style={{ opacity: 0.5 }} />
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>No pending requests</p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                    When someone sends you a friend request, it will appear here.
                                </p>
                            </div>
                        ) : (
                            friendRequests.map(request => (
                                <div 
                                    key={request.id} 
                                    style={requestCardStyle}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(45deg, #405DE6, #833AB4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem'
                                        }}>
                                            {request.avatar || '👤'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{request.username}</span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    background: request.userType === 'deaf' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '8px'
                                                }}>
                                                    {request.userType === 'deaf' ? 'Deaf' : 'Normal'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                                <FaClock size={10} />
                                                {formatTimeAgo(request.sentAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleAcceptRequest(request)}
                                            disabled={processing[request.id]}
                                            style={{
                                                ...acceptButtonStyle,
                                                opacity: processing[request.id] ? 0.7 : 1,
                                                cursor: processing[request.id] ? 'not-allowed' : 'pointer'
                                            }}
                                            onMouseOver={(e) => !processing[request.id] && (e.target.style.transform = 'translateY(-1px)')}
                                            onMouseOut={(e) => !processing[request.id] && (e.target.style.transform = 'translateY(0)')}
                                        >
                                            {processing[request.id] === 'accepting' ? (
                                                'Accepting...'
                                            ) : (
                                                <>
                                                    <FaUserCheck size={12} />
                                                    Accept
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request)}
                                            disabled={processing[request.id]}
                                            style={{
                                                ...rejectButtonStyle,
                                                opacity: processing[request.id] ? 0.7 : 1,
                                                cursor: processing[request.id] ? 'not-allowed' : 'pointer'
                                            }}
                                            onMouseOver={(e) => !processing[request.id] && (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
                                            onMouseOut={(e) => !processing[request.id] && (e.target.style.background = 'rgba(255, 255, 255, 0.1)')}
                                        >
                                            {processing[request.id] === 'rejecting' ? (
                                                'Rejecting...'
                                            ) : (
                                                <>
                                                    <FaUserTimes size={12} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        // Sent Requests Tab
                        sentRequests.length === 0 ? (
                            <div style={emptyStateStyle}>
                                <FaPaperPlane size={48} style={{ opacity: 0.5 }} />
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>No sent requests</p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                    Friend requests you send will appear here.
                                </p>
                            </div>
                        ) : (
                            sentRequests.map(request => (
                                <div 
                                    key={request.id} 
                                    style={requestCardStyle}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(45deg, #666, #999)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem'
                                        }}>
                                            {request.avatar || '👤'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{request.username}</span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    background: request.userType === 'deaf' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '8px'
                                                }}>
                                                    {request.userType === 'deaf' ? 'Deaf' : 'Normal'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                                <FaClock size={10} />
                                                {formatTimeAgo(request.sentAt)}
                                                <span style={{ 
                                                    background: 'rgba(59, 130, 246, 0.2)',
                                                    color: '#3b82f6',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '8px',
                                                    fontSize: '0.7rem'
                                                }}>
                                                    Pending
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleCancelSentRequest(request)}
                                            disabled={processing[request.id]}
                                            style={{
                                                ...cancelButtonStyle,
                                                opacity: processing[request.id] ? 0.7 : 1,
                                                cursor: processing[request.id] ? 'not-allowed' : 'pointer'
                                            }}
                                            onMouseOver={(e) => !processing[request.id] && (e.target.style.background = 'rgba(239, 68, 68, 0.2)')}
                                            onMouseOut={(e) => !processing[request.id] && (e.target.style.background = 'rgba(239, 68, 68, 0.1)')}
                                        >
                                            {processing[request.id] === 'canceling' ? (
                                                'Canceling...'
                                            ) : (
                                                <>
                                                    <FaTimes size={12} />
                                                    Cancel
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </>
    );
}