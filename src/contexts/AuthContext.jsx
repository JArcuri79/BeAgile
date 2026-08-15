import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();

const DEMO_ACCOUNTS = {
  'admin@beagile.com': { name: 'Admin User', role: 'admin' },
  'sarah.j@beagile.com': { name: 'Sarah Jenkins', role: 'crew' },
  'evance@beagile.com': { name: 'Elena Vance', role: 'crew' },
  'j.marcus@beagile.com': { name: 'John Marcus', role: 'user' },
  'super@beagile.com': { name: 'Super Admin', role: 'global_admin' },
  'global@beagile.com': { name: 'Global Admin', role: 'global_admin' }
};

const SESSION_KEY = 'beagile_session';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('guest');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        setCurrentUser(session.user || null);
        setRole(session.role || 'guest');
      }
    } catch {
      setCurrentUser(null);
      setRole('guest');
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: currentUser, role }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser, role]);

  const isAuthenticated = useMemo(() => !!currentUser, [currentUser]);

  const switchRole = (newRole) => {
    setRole(newRole);
  };

  const login = (email, password) => {
    if (!email.trim() || !password.trim()) return { success: false, error: 'Please enter both email and password.' };

    const account = DEMO_ACCOUNTS[email.toLowerCase()];
    if (!account) return { success: false, error: 'Unrecognized email address.' };

    const user = { email: email.toLowerCase(), name: account.name, role: account.role };
    setCurrentUser(user);
    setRole(account.role);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setRole('guest');
  };

  return (
    <AuthContext.Provider value={{ role, currentUser, isAuthenticated, switchRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
