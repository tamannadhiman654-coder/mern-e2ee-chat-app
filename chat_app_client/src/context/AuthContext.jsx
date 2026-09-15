import React, { createContext, useContext, useState, useEffect } from 'react';
import { url } from '../components/GlobalUrl';
import { generateKeyPair } from '../utils/crypto';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  // Validate or refresh profile on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${url}api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.user) {
          const formatted = {
            id: data.user._id || data.user.id,
            username: data.user.username,
            email: data.user.email,
            bio: data.user.bio,
            profilePic: data.user.profilePic,
            publicKey: data.user.publicKey,
            friends: data.user.friends || []
          };
          setUser(formatted);
          localStorage.setItem('user', JSON.stringify(formatted));
        } else {
          // Token invalid or expired
          logout();
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${url}api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || (data.errors ? data.errors[0]?.msg : 'Login failed'));
    }

    const userData = {
      id: data.user.id || data.user._id,
      username: data.user.username,
      email: data.user.email,
      bio: data.user.bio || 'Hey there! I am using E2EE Chat.',
      profilePic: data.user.profilePic || '',
      publicKey: data.user.publicKey,
      friends: data.user.friends || []
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(data.token);
    setUser(userData);
    return userData;
  };

  const register = async ({ username, email, password, bio, profilePic }) => {
    // Generate E2EE cryptographic key pair
    const keys = await generateKeyPair();
    if (keys.privateKey) {
      localStorage.setItem(`e2ee_priv_${username}`, keys.privateKey);
    }

    const res = await fetch(`${url}api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        publicKey: keys.publicKey,
        bio: bio || 'Hey there! I am using E2EE Chat.',
        profilePic: profilePic || ''
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || (data.errors ? data.errors[0]?.msg : 'Registration failed'));
    }

    const userData = {
      id: data.user.id || data.user._id,
      username: data.user.username,
      email: data.user.email,
      bio: data.user.bio,
      profilePic: data.user.profilePic,
      publicKey: data.user.publicKey,
      friends: data.user.friends || []
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(data.token);
    setUser(userData);
    return userData;
  };

  const updateProfile = async ({ username, bio, profilePic }) => {
    const res = await fetch(`${url}api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ username, bio, profilePic })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Profile update failed');
    }

    const updated = {
      ...user,
      username: data.user.username,
      bio: data.user.bio,
      profilePic: data.user.profilePic
    };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  };

  const deleteAccount = async () => {
    const res = await fetch(`${url}api/user/account`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete account');
    }
    logout();
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
        updateProfile,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
