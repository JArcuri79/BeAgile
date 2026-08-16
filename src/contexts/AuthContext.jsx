import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authClient } from '../lib/auth-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { data: session, isPending } = authClient.useSession();
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('guest');

  useEffect(() => {
    if (session?.user) {
      const userRole = session.user.role === 'superuser' ? 'global_admin' : (session.user.role || 'user');
      setCurrentUser({ ...session.user, role: userRole, company: session.user.company || null });
      setRole(userRole);
    } else if (!isPending) {
      setCurrentUser(null);
      setRole('guest');
    }
  }, [session, isPending]);

  const isAuthenticated = useMemo(() => !!currentUser, [currentUser]);
  const isLoading = isPending;

  const switchRole = (newRole) => {
    setRole(newRole);
  };

  const login = async (email, password) => {
    if (!email.trim() || !password.trim()) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (result.error) {
      return { success: false, error: result.error.message || 'Login failed. Check your email and password.' };
    }

    return { success: true };
  };

  const logout = async () => {
    await authClient.signOut();
    setCurrentUser(null);
    setRole('guest');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        currentUser,
        isAuthenticated,
        isLoading,
        switchRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
