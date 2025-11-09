﻿// src/components/RealTimeChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../context/WebSocketContext.jsx';
import { FaPaperPlane, FaCircle, FaCheck, FaCheckDouble } from 'react-icons/fa';

export default function RealTimeChat({ friend, onClose }) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { 
    messages, 
    sendMessage, 
    sendTypingStart, 
    sendTypingEnd,
    isUserOnline,
    isUserTyping,
    webSocketService
  } = useWebSocket();

  // UPDATED: Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!friend?.id) return;
      
      try {
        const currentUser = JSON.parse(localStorage.getItem('signlink_user'));
        if (!currentUser?.id) return;

        const response = await fetch(
          `http://localhost:5000/api/messages/history?userId=${currentUser.id}&friendId=${friend.id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Convert database messages to frontend format
            const formattedMessages = data.messages.map(msg => ({
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              timestamp: msg.timestamp,
              senderId: msg.senderId,
              recipientId: msg.sender === 'me' ? friend.id : currentUser.id,
              delivered: true,
              read: true
            }));
            
            // Set messages state with history
            setMessages(formattedMessages);
            console.log('✅ Loaded chat history:', formattedMessages.length, 'messages');
          }
        }
      } catch (error) {
        console.error('❌ Failed to load chat history:', error);
      }
    };

    loadChatHistory();
  }, [friend?.id]);

  // Filter messages for this specific friend
  const chatMessages = messages.filter(msg => 
    (msg.sender === 'me' && msg.recipientId === friend.id) ||
    (msg.sender === 'them' && msg.senderId === friend.id)
  );

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Listen for typing indicators for this specific friend
    const handleTypingStart = (data) => {
      if (data.senderId === friend.id) {
        setIsTyping(true);
      }
    };

    const handleTypingEnd = (data) => {
      if (data.senderId === friend.id) {
        setIsTyping(false);
      }
    };

    webSocketService.onTypingStart(handleTypingStart);
    webSocketService.onTypingEnd(handleTypingEnd);

    return () => {
      webSocketService.removeMessageHandler('typing_start', handleTypingStart);
      webSocketService.removeMessageHandler('typing_end', handleTypingEnd);
    };
  }, [friend.id, webSocketService]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageId = sendMessage(friend.id, newMessage);
    setNewMessage('');
    
    // Clear typing indicator
    sendTypingEnd(friend.id);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (value && !typingTimeout) {
      sendTypingStart(friend.id);
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to end typing
    const timeout = setTimeout(() => {
      sendTypingEnd(friend.id);
      setTypingTimeout(null);
    }, 1000);

    setTypingTimeout(timeout);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const messageBubbleStyle = {
    maxWidth: '70%',
    padding: '0.75rem 1rem',
    borderRadius: '18px',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    lineHeight: '1.4',
    wordWrap: 'break-word'
  };

  const userMessageStyle = {
    ...messageBubbleStyle,
    background: 'linear-gradient(45deg, #405DE6, #833AB4)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
    marginLeft: 'auto'
  };

  const friendMessageStyle = {
    ...messageBubbleStyle,
    background: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
    marginRight: 'auto'
  };

  const errorMessageStyle = {
    ...userMessageStyle,
    background: 'rgba(220, 38, 38, 0.3)',
    border: '1px solid rgba(220, 38, 38, 0.5)'
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #405DE6, #833AB4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            {friend?.avatar || '👤'}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{friend?.username}</div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: isUserOnline(friend.id) ? '#00ff88' : 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaCircle size={8} />
              {isUserOnline(friend.id) ? 'Online' : 'Offline'}
              {isTyping && (
                <span style={{ 
                  color: '#405DE6', 
                  fontStyle: 'italic',
                  marginLeft: '1rem',
                  animation: 'pulse 1.5s infinite'
                }}>
                  typing...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        {chatMessages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <p style={{ margin: 0, fontSize: '1rem' }}>No messages yet</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              Start a conversation with {friend?.username}
            </p>
          </div>
        ) : (
          chatMessages.map(message => (
            <div
              key={message.id}
              style={
                message.sender === 'me' 
                  ? (message.error ? errorMessageStyle : userMessageStyle)
                  : friendMessageStyle
              }
            >
              <div>{message.text}</div>
              <div style={{
                fontSize: '0.7rem',
                opacity: 0.6,
                marginTop: '0.25rem',
                textAlign: message.sender === 'me' ? 'right' : 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                justifyContent: message.sender === 'me' ? 'flex-end' : 'flex-start'
              }}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.sender === 'me' && (
                  message.error ? (
                    <span style={{ color: '#ff4444' }}>❌</span>
                  ) : message.read ? (
                    <FaCheckDouble size={10} color="#405DE6" />
                  ) : message.delivered ? (
                    <FaCheckDouble size={10} color="rgba(255,255,255,0.5)" />
                  ) : (
                    <FaCheck size={10} color="rgba(255,255,255,0.3)" />
                  )
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            style={{
              padding: '0.75rem',
              background: newMessage.trim() 
                ? 'linear-gradient(45deg, #405DE6, #833AB4)' 
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => newMessage.trim() && (e.target.style.transform = 'scale(1.1)')}
            onMouseOut={(e) => newMessage.trim() && (e.target.style.transform = 'scale(1)')}
          >
            <FaPaperPlane size={16} />
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}