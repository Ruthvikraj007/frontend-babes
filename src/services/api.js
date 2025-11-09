// Determine API base URL based on hostname (for network access)
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : `http://${window.location.hostname}:5000/api`;

console.log('🌐 API Base URL:', API_BASE_URL);

// Generic API call function
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('signlink_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Auth API calls
export const authAPI = {
  login: (username, password) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  register: (userData) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: userData,
    }),

  logout: () => {
    localStorage.removeItem('signlink_token');
    localStorage.removeItem('signlink_user');
  },
};

// Users API calls
export const usersAPI = {
  search: (query) =>
    apiCall(`/users/search?q=${encodeURIComponent(query)}`),

  getProfile: (userId) =>
    apiCall(`/users/${userId}`),
};

// Friends API calls
export const friendsAPI = {
  getFriends: () =>
    apiCall('/friends'),

  getFriendRequests: () =>
    apiCall('/friends/requests'),

  sendFriendRequest: (userId) =>
    apiCall('/friends/requests/send', {
      method: 'POST',
      body: { userId },
    }),

  acceptFriendRequest: (requestId) =>
    apiCall('/friends/requests/accept', {
      method: 'POST',
      body: { requestId },
    }),

  rejectFriendRequest: (requestId) =>
    apiCall('/friends/requests/reject', {
      method: 'POST',
      body: { requestId },
    }),
};