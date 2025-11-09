import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // initialLoading: whether we're checking stored credentials on mount
  const [initialLoading, setInitialLoading] = useState(true);
  // actionLoading: used for login/signup actions so we don't disturb initial mount loading
  const [actionLoading, setActionLoading] = useState(false);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('signlink_user');
    const storedToken = localStorage.getItem('signlink_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('signlink_user');
        localStorage.removeItem('signlink_token');
      }
    }
    setInitialLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setActionLoading(true);
      const result = await authAPI.login(username, password);

      if (result.success) {
        setUser(result.user);
        localStorage.setItem('signlink_token', result.token);
        localStorage.setItem('signlink_user', JSON.stringify(result.user));
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setActionLoading(true);
      const result = await authAPI.register(userData);

      if (result.success) {
        // Do NOT auto-login on signup. Email verification required.
        // Return success so caller can show verification instructions.
        return { success: true, message: result.message, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    } finally {
      setActionLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    authAPI.logout();
  };

  const updateProfile = async (profileData) => {
    try {
      // Merge incoming profileData into user and persist locally.
      const updatedUser = {
        ...user,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      setUser(updatedUser);
      localStorage.setItem('signlink_user', JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Profile update failed' };
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const getUserType = () => {
    return user?.userType || 'normal';
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated,
    getUserType,
    // `loading` retained for backward compatibility and used by PublicRoute —
    // this refers only to the initial mount/load check, not action-level loading
    loading: initialLoading,
    // expose action loading if components need to display action-specific spinners
    authLoading: actionLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}