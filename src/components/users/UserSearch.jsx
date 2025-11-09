import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserPlus, FaArrowLeft, FaCheck } from 'react-icons/fa';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/search?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      // Map id to _id for consistency
      const users = (data.users || []).map(user => ({
        ...user,
        _id: user.id || user._id
      }));
      setSearchResults(users);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      const response = await fetch('http://localhost:5000/api/friends/requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          userId: userId,
          currentUserId: user._id || user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send friend request');
      }

      const data = await response.json();
      console.log('✅ Friend request sent:', data);
      setSentRequests(prev => new Set([...prev, userId]));
      alert('Friend request sent successfully!');
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert(err.message || 'Failed to send friend request');
    }
  };

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
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      maxWidth: '800px',
      margin: '0 auto 30px'
    },
    title: {
      margin: 0,
      fontSize: '2rem',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    backButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '10px 20px',
      borderRadius: '25px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      fontSize: '0.9rem'
    },
    searchContainer: {
      maxWidth: '800px',
      margin: '0 auto 30px',
      display: 'flex',
      gap: '10px'
    },
    searchInput: {
      flex: 1,
      padding: '15px 20px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '25px',
      color: 'white',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.3s ease'
    },
    searchButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '25px',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      fontSize: '1rem'
    },
    resultsContainer: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    userCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '16px',
      transition: 'all 0.3s ease'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: 1
    },
    userAvatar: {
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
    userName: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      marginBottom: '4px'
    },
    userEmail: {
      fontSize: '0.9rem',
      color: 'rgba(255, 255, 255, 0.6)'
    },
    addButton: {
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
      transition: 'all 0.3s ease',
      fontSize: '0.9rem'
    },
    sentButton: {
      background: 'rgba(76, 175, 80, 0.3)',
      border: '1px solid #4CAF50',
      padding: '10px 20px',
      borderRadius: '25px',
      color: '#4CAF50',
      fontWeight: 'bold',
      cursor: 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.9rem'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'rgba(255, 255, 255, 0.5)'
    },
    errorMessage: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '15px',
      background: 'rgba(244, 67, 54, 0.1)',
      border: '1px solid rgba(244, 67, 54, 0.3)',
      borderRadius: '8px',
      color: '#ff6b6b',
      marginBottom: '20px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Find Users</h1>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          style={styles.searchInput}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={styles.searchButton}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <FaSearch /> {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      <div style={styles.resultsContainer}>
        {searchResults.length === 0 && searchTerm && !loading && (
          <div style={styles.emptyState}>
            <FaSearch size={50} style={{ marginBottom: '20px', opacity: 0.3 }} />
            <h3>No users found</h3>
            <p>Try searching with a different username or email</p>
          </div>
        )}

        {searchResults.length === 0 && !searchTerm && (
          <div style={styles.emptyState}>
            <FaSearch size={50} style={{ marginBottom: '20px', opacity: 0.3 }} />
            <h3>Search for users</h3>
            <p>Enter a username or email to find new friends</p>
          </div>
        )}

        {searchResults.map((searchUser) => (
          <div
            key={searchUser._id}
            style={styles.userCard}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>
                {searchUser.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div style={styles.userName}>{searchUser.username}</div>
                <div style={styles.userEmail}>{searchUser.email}</div>
              </div>
            </div>

            {sentRequests.has(searchUser._id) ? (
              <button style={styles.sentButton}>
                <FaCheck /> Request Sent
              </button>
            ) : (
              <button
                onClick={() => handleSendFriendRequest(searchUser._id)}
                style={styles.addButton}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <FaUserPlus /> Add Friend
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSearch;