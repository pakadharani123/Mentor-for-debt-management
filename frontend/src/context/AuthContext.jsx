import React, { createContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Event listener for response interceptor auto-logout
    const handleAutoLogout = () => {
      logout();
    };

    window.addEventListener('auth-logout', handleAutoLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAutoLogout);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiService.auth.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Server error occurred during login';
      const cooldownRemaining = err.response?.data?.cooldownRemaining || 0;
      return { success: false, error: errorMsg, cooldownRemaining };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, preferredLanguage = 'en') => {
    setLoading(true);
    try {
      const res = await apiService.auth.register({
        name,
        email,
        password,
        preferredLanguage
      });
      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Server error occurred during registration';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updatePreferredLanguage = async (newLang) => {
    if (!user) return;
    try {
      // 1. If profile exists on backend, we update it via user settings / put request.
      // Wait, let's see: we can update the user details if needed, but since language is on the User model,
      // let's update preferredLanguage. Wait, does our auth routes support putting user metadata?
      // Wait, in our backend auth controller, we only have GET /api/auth/profile and registration/login.
      // But we can update preferredLanguage via the financial profile update PUT /api/profile if it carries it, 
      // or we can update the client Context state. 
      // Let's check: in backend User model, we have preferredLanguage. If we update it, let's make sure it changes the user state!
      // Since it is saved in Context and localStorage, we can update it in Context and localStorage directly,
      // and we can also support updating it on the backend when they save/modify their profile,
      // or just update it on the client. 
      // Let's update the context user config:
      const updatedUser = { ...user, preferredLanguage: newLang };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to change language configuration:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updatePreferredLanguage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
