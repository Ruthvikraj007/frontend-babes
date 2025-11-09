import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaVideo, FaEllipsisV, FaSmile } from 'react-icons/fa';

export default function ChatInterface({ friend, onClose, onStartCall }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Mock initial messages
    useEffect(() => {
        setMessages([
            {
                id: 1,
                text: 'Hey there! How are you doing?',
                sender: 'friend',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 2,
                text: 'I\\'m good! Just finished work. Ready for our call?',
                sender: 'user',
                timestamp: new Date(Date.now() - 3500000).toISOString()
            },
            {
                id: 3,
                text: 'Yes, let\\'s do a video call! 🤟',
                sender: 'friend',
                timestamp: new Date(Date.now() - 3400000).toISOString()
            }
        ]);
    }, [friend]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message = {
            id: messages.length + 1,
            text: newMessage,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');

        // Simulate reply after 1-3 seconds
        setTimeout(() => {
            const replies = [
                'That sounds great!',
                'I understand what you mean',
                'Let me think about that...',
                'Awesome! 😊',
                'I agree with you'
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            
            const replyMessage = {
                id: messages.length + 2,
                text: randomReply,
                sender: 'friend',
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, replyMessage]);
        }, 1000 + Math.random() * 2000);
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
        maxWidth: '400px',
        height: '600px',
        maxHeight: '80vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        color: 'white',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
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
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    };

    const messageBubbleStyle = {
        maxWidth: '70%',
        padding: '0.75rem 1rem',
        borderRadius: '18px',
        marginBottom: '0.5rem',
        fontSize: '0.9rem',
        lineHeight: '1.4'
    };

    const userMessageStyle = {
        ...messageBubbleStyle,
        background: 'linear-gradient(45deg, #405DE6, #833AB4)',
        alignSelf: 'flex-end',
        borderBottomRightRadius: '4px'
    };

    const friendMessageStyle = {
        ...messageBubbleStyle,
        background: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: '4px'
    };

    return (
        <>
            <div style={overlayStyle} onClick={onClose} />
            <div style={modalStyle}>
                {/* Chat Header */}
                <div style={headerStyle}>
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
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                {friend?.isOnline ? 'Online' : 'Offline'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={() => onStartCall(friend)}
                            style={{
                                padding: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <FaVideo size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem',
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    padding: '1rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {messages.map(message => (
                        <div
                            key={message.id}
                            style={message.sender === 'user' ? userMessageStyle : friendMessageStyle}
                        >
                            {message.text}
                            <div style={{
                                fontSize: '0.7rem',
                                opacity: 0.6,
                                marginTop: '0.25rem',
                                textAlign: message.sender === 'user' ? 'right' : 'left'
                            }}>
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} style={{
                    padding: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button type="button" style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}>
                            <FaSmile size={20} />
                        </button>
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
        </>
    );
}
