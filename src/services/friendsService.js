// services/friendsService.js - CLEAN VERSION (NO JSX)
// Use dynamic API URL based on hostname (supports both localhost and network IP)
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : `http://${window.location.hostname}:5000/api`;

// Helper function for API calls with better error handling
const apiCall = async (endpoint, options = {}) => {
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`❌ API call error for ${endpoint}:`, error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network connection failed. Please check your internet connection.');
    }
    
    throw error;
  }
};

export const friendsService = {
    getFriends: async () => {
        try {
            console.log('🔍 [friendsService] Getting friends list from API');
            
            const currentUser = JSON.parse(localStorage.getItem('signlink_user'));
            
            if (!currentUser || !currentUser.id) {
                console.error('❌ No current user found');
                throw new Error('User not authenticated');
            }

            const data = await apiCall(`/friends?currentUserId=${currentUser.id}`);
            console.log('✅ [friendsService] Friends from API:', data.friends);
            return data.friends || [];

        } catch (error) {
            console.error('❌ [friendsService] Failed to get friends:', error);
            throw new Error(`Failed to load friends: ${error.message}`);
        }
    },

    getFriendRequests: async () => {
        try {
            console.log('🔍 [friendsService] Getting friend requests from API');
            
            const currentUser = JSON.parse(localStorage.getItem('signlink_user'));
            
            if (!currentUser || !currentUser.id) {
                console.error('❌ No current user found');
                throw new Error('User not authenticated');
            }

            const data = await apiCall(`/friends/requests?currentUserId=${currentUser.id}`);
            console.log('✅ [friendsService] Requests from API:', data.requests);
            return data.requests || [];

        } catch (error) {
            console.error('❌ [friendsService] Failed to get friend requests:', error);
            throw new Error(`Failed to load friend requests: ${error.message}`);
        }
    },

    sendFriendRequestByUsername: async (username, currentUser) => {
        console.log('🔄 [friendsService] Sending friend request to username:', username);
        
        try {
            if (!currentUser || !currentUser.id) {
                throw new Error('User not authenticated');
            }

            // First, search for the user to get their ID
            const searchResponse = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(username)}`);
            
            if (!searchResponse.ok) {
                throw new Error('Failed to search for user');
            }

            const searchData = await searchResponse.json();
            
            if (!searchData.success || searchData.users.length === 0) {
                throw new Error(`User "${username}" not found. Please check the username and try again.`);
            }

            const targetUser = searchData.users[0];
            console.log('✅ [friendsService] Found target user:', targetUser);

            // Check if trying to add self
            if (targetUser.id === currentUser.id) {
                throw new Error('You cannot send a friend request to yourself');
            }

            // Check if already friends
            try {
                const friends = await friendsService.getFriends();
                const isAlreadyFriend = friends.some(friend => friend.id === targetUser.id);
                if (isAlreadyFriend) {
                    throw new Error(`You are already friends with ${targetUser.username}`);
                }
            } catch (error) {
                console.warn('⚠️ Could not check existing friends, proceeding with request...');
            }

            const data = await apiCall('/friends/requests/send', {
                method: 'POST',
                body: {
                    userId: targetUser.id,
                    currentUserId: currentUser.id
                }
            });
            
            console.log('✅ [friendsService] Friend request sent successfully to:', username);
            return { 
                success: true, 
                message: data.message || `Friend request sent to ${username}`,
                request: data.request
            };

        } catch (error) {
            console.error('❌ [friendsService] Failed to send friend request:', error);
            throw new Error(error.message || 'Failed to send friend request');
        }
    },

    acceptFriendRequest: async (requestId, currentUserId) => {
        console.log('🔄 [friendsService] Accepting friend request:', requestId);
        
        try {
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const data = await apiCall('/friends/requests/accept', {
                method: 'POST',
                body: {
                    requestId: requestId,
                    currentUserId: currentUserId
                }
            });

            console.log('✅ [friendsService] Friend request accepted successfully!');
            return { 
                success: true, 
                message: data.message,
                newFriend: data.newFriend
            };

        } catch (error) {
            console.error('❌ [friendsService] Failed to accept friend request:', error);
            throw new Error(error.message || 'Failed to accept friend request');
        }
    },

    rejectFriendRequest: async (requestId, currentUserId) => {
        console.log('🔄 [friendsService] Rejecting friend request:', requestId);
        
        try {
            if (!currentUserId) {
                throw new Error('User not authenticated');
            }

            const data = await apiCall('/friends/requests/reject', {
                method: 'POST',
                body: {
                    requestId: requestId,
                    currentUserId: currentUserId
                }
            });

            console.log('✅ [friendsService] Friend request rejected successfully!');
            return { 
                success: true, 
                message: data.message
            };

        } catch (error) {
            console.error('❌ [friendsService] Failed to reject friend request:', error);
            throw new Error(error.message || 'Failed to reject friend request');
        }
    },

    searchUsers: async (query) => {
        try {
            console.log('🔍 [friendsService] Searching users:', query);
            
            if (!query || query.trim() === '') {
                return [];
            }

            const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`Search failed with status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ [friendsService] Search results:', data.users);
                return data.users;
            } else {
                console.error('❌ [friendsService] Search failed:', data.error);
                return [];
            }
        } catch (error) {
            console.error('❌ [friendsService] Search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    },

    getFriendSuggestions: async () => {
        try {
            console.log('🔍 [friendsService] Getting friend suggestions');
            
            const currentUser = JSON.parse(localStorage.getItem('signlink_user'));
            
            if (!currentUser || !currentUser.id) {
                console.error('❌ No current user found');
                return [];
            }

            // Get all users and filter
            const response = await fetch(`${API_BASE_URL}/users`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            
            if (data.success) {
                const allUsers = data.users || [];
                
                // Get current friends to filter out
                const friends = await friendsService.getFriends().catch(() => []);
                const friendIds = friends.map(friend => friend.id);
                
                // Filter out current friends and self
                const suggestions = allUsers.filter(user => 
                    user.id !== currentUser.id && 
                    !friendIds.includes(user.id)
                );

                console.log('✅ [friendsService] Friend suggestions:', suggestions);
                return suggestions.slice(0, 5);
            }
            
            return [];

        } catch (error) {
            console.error('❌ [friendsService] Failed to get friend suggestions:', error);
            return [];
        }
    },

    refreshAllData: async () => {
        try {
            console.log('🔄 [friendsService] Refreshing all friend data');
            
            const [friends, requests, onlineFriends] = await Promise.all([
                friendsService.getFriends().catch(error => {
                    console.error('Failed to get friends:', error);
                    return [];
                }),
                friendsService.getFriendRequests().catch(error => {
                    console.error('Failed to get requests:', error);
                    return [];
                }),
                friendsService.getOnlineFriends().catch(error => {
                    console.error('Failed to get online friends:', error);
                    return [];
                })
            ]);

            console.log('✅ [friendsService] Data refreshed successfully');
            return {
                friends,
                requests,
                onlineFriends
            };

        } catch (error) {
            console.error('❌ [friendsService] Failed to refresh data:', error);
            throw new Error('Failed to refresh friend data');
        }
    },

    canSendFriendRequest: async (username, currentUser) => {
        console.log('🔍 [friendsService] Checking if can send friend request to:', username);
        
        try {
            if (!currentUser || !currentUser.id) {
                return { canSend: false, error: 'User not authenticated' };
            }

            // Search for the user
            const users = await friendsService.searchUsers(username);
            
            if (users.length === 0) {
                return { canSend: false, error: `User "${username}" not found` };
            }

            const targetUser = users[0];

            // Check if trying to add self
            if (targetUser.id === currentUser.id) {
                return { canSend: false, error: 'Cannot send friend request to yourself' };
            }

            // Check if already friends
            try {
                const friends = await friendsService.getFriends();
                const isAlreadyFriend = friends.some(friend => friend.id === targetUser.id);
                if (isAlreadyFriend) {
                    return { canSend: false, error: `You are already friends with ${targetUser.username}` };
                }
            } catch (error) {
                console.warn('⚠️ Could not check existing friends, proceeding with request check...');
            }

            return { canSend: true, targetUser };

        } catch (error) {
            console.error('❌ [friendsService] Error checking friend request:', error);
            return { canSend: false, error: 'Error checking user availability' };
        }
    },

    sendFriendRequest: async (userId) => {
        console.warn('⚠️ [friendsService] Using legacy sendFriendRequest. Use sendFriendRequestByUsername instead.');
        throw new Error('Please use sendFriendRequestByUsername with username instead');
    },

    getOnlineFriends: async () => {
        try {
            console.log('🔍 [friendsService] Getting online friends...');
            const friends = await friendsService.getFriends();
            const onlineFriends = friends.filter(friend => friend.isOnline);
            console.log('✅ [friendsService] Online friends:', onlineFriends);
            return onlineFriends;
        } catch (error) {
            console.error('❌ [friendsService] Failed to get online friends:', error);
            return [];
        }
    },

    getReceivedRequests: async () => {
        try {
            return await friendsService.getFriendRequests();
        } catch (error) {
            console.error('❌ [friendsService] Failed to get received requests:', error);
            return [];
        }
    },

    getSentRequests: async () => {
        try {
            console.log('🔍 [friendsService] Getting sent friend requests');
            console.log('⚠️ [friendsService] Sent requests endpoint not implemented yet');
            return [];
        } catch (error) {
            console.error('❌ [friendsService] Failed to get sent requests:', error);
            return [];
        }
    },

    debugGetAllData: async () => {
        console.log('=== 🔍 FRIENDS SERVICE DEBUG INFO ===');
        try {
            const [friends, requests, online] = await Promise.all([
                friendsService.getFriends().catch(() => []),
                friendsService.getFriendRequests().catch(() => []),
                friendsService.getOnlineFriends().catch(() => [])
            ]);
            
            console.log('📊 Friends:', friends);
            console.log('📊 All Requests:', requests);
            console.log('📊 Online Friends:', online);
            console.log('=== 🎯 END DEBUG INFO ===');
            
            return {
                friends: friends,
                allRequests: requests,
                onlineFriends: online
            };
        } catch (error) {
            console.error('❌ Debug data collection failed:', error);
            return { friends: [], allRequests: [], onlineFriends: [] };
        }
    }
};