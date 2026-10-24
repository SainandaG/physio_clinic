import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/client';

const AuthContext = createContext(null);

export const STAFF_ROLES = ['admin', 'receptionist'];
export const isStaff = (user) => !!user && STAFF_ROLES.includes(user.role);
// Where an account lands after signing in
export const homeFor = (user) => (isStaff(user) ? '/admin/dashboard' : '/account');

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signedIn = (data) => {
    localStorage.setItem('token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const form = new URLSearchParams({ username: email, password });
    const { data } = await API.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return signedIn(data);
  };

  const signup = async (details) => {
    const { data } = await API.post('/api/auth/signup', details);
    return signedIn(data);
  };

  const updateProfile = async (changes) => {
    const { data } = await API.put('/api/auth/me', changes);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
