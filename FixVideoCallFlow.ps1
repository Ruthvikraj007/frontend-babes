# First, let's create the contacts list component
 = @'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaArrowLeft, FaVideo, FaUser, FaCircle } from 'react-icons/fa';

export default function VideoCallContacts() {
  const navigate = useNavigate();

  const contacts = [
    { id: 1, name: 'Friend', status: 'online', lastSeen: 'Active now', avatar: 'F' },
    { id: 2, name: 'yoyo', status: 'online', lastSeen: 'Active now', avatar: 'Y' },
    { id: 3, name: 'V A S A N T H', status: 'online', lastSeen: 'Active 2h ago', avatar: 'V' },
    { id: 4, name: 'Sarmi😊', status: 'offline', lastSeen: 'Last seen 1d ago', avatar: 'S' },
    { id: 5, name: 'Vivek_kapri', status: 'offline', lastSeen: 'Last seen 3d ago', avatar: 'V' },
    { id: 6, name: 'Jeevan S Hegde', status: 'offline', lastSeen: 'Last seen 1w ago', avatar: 'J' },
    { id: 7, name: 'scamboy_op', status: 'offline', lastSeen: 'Last seen 2w ago', avatar: 'S' }
  ];

  const handleStartCall = (contactName) => {
    navigate('/call/test-room'); // This will go to your existing video call interface
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #262626 100%)',
    padding: '2rem 1rem',
    color: 'white'
  };

  const cardStyle = {
    background: 'rgba(18, 18, 18, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '2rem',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    maxWidth: '500px',
    margin: '0 auto'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const backButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '0.75rem',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const titleStyle = {
    fontSize: '1.8rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #405DE6, #833AB4, #E1306C, #FCAF45)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const searchBoxStyle = {
    width: '100%',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    color: 'white',
    fontSize: '1rem',
    marginBottom: '1.5rem'
  };

  const contactItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const contactInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1
  };

  const avatarStyle = {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #405DE6, #833AB4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.2rem'
  };

  const callButtonStyle = {
    background: 'linear-gradient(45deg, #405DE6, #833AB4)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const sectionTitleStyle = {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.9rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '1.5rem 0 1rem 0'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <button 
            style={backButtonStyle}
            onClick={() => navigate('/dashboard')}
          >
            <FaArrowLeft size={20} />
          </button>
          <h1 style={titleStyle}>Video Call</h1>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <FaSearch 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'rgba(255, 255, 255, 0.5)' 
            }} 
          />
          <input
            type="text"
            placeholder="Search contacts..."
            style={{
              ...searchBoxStyle,
              paddingLeft: '3rem'
            }}
          />
        </div>

        {/* Online Contacts */}
        <div style={sectionTitleStyle}>Online Now</div>
        {contacts.filter(c => c.status === 'online').map(contact => (
          <div
            key={contact.id}
            style={contactItemStyle}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            <div style={contactInfoStyle}>
              <div style={avatarStyle}>{contact.avatar}</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{contact.name}</div>
                <div style={{ color: '#00ff88', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaCircle size={8} />
                  {contact.lastSeen}
                </div>
              </div>
            </div>
            <button
              style={callButtonStyle}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              onClick={() => handleStartCall(contact.name)}
            >
              <FaVideo style={{ marginRight: '0.5rem' }} />
              Call
            </button>
          </div>
        ))}

        {/* Offline Contacts */}
        <div style={sectionTitleStyle}>Recent Contacts</div>
        {contacts.filter(c => c.status === 'offline').map(contact => (
          <div
            key={contact.id}
            style={contactItemStyle}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            <div style={contactInfoStyle}>
              <div style={{...avatarStyle, background: 'linear-gradient(45deg, #666, #999)'}}>{contact.avatar}</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{contact.name}</div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
                  {contact.lastSeen}
                </div>
              </div>
            </div>
            <button
              style={{...callButtonStyle, background: 'rgba(255, 255, 255, 0.1)'}}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onClick={() => handleStartCall(contact.name)}
            >
              <FaVideo style={{ marginRight: '0.5rem' }} />
              Call
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
'@

# Save the contacts component
 | Out-File -FilePath "VideoCallContacts.js" -Encoding UTF8

Write-Host "Created VideoCallContacts.js component"
Write-Host ""
Write-Host "NEXT STEPS:"
Write-Host "1. Move VideoCallContacts.js to your components folder"
Write-Host "2. Add this route to your App.js:"
Write-Host "   <Route path='/video-call-contacts' element={<VideoCallContacts />} />"
Write-Host ""
Write-Host "3. Change the handleStartCall function in your Dashboard.js from:"
Write-Host "   const handleStartCall = () => {"
Write-Host "     navigate('/call/test-room');"
Write-Host "   };"
Write-Host ""
Write-Host "   TO:"
Write-Host "   const handleStartCall = () => {"
Write-Host "     navigate('/video-call-contacts');"
Write-Host "   };"
Write-Host ""
Write-Host "This will make the video call button go to contacts list first!"
