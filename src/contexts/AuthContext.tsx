import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  email: string;
  password: string;
  name: string;
  role: 'doctor' | 'patient';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (userData: User) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'medigist_users';
const SESSION_KEY = 'medigist_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (sessionData) {
      try {
        const parsedUser = JSON.parse(sessionData);
        setUser(parsedUser);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const getStoredUsers = (): User[] => {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const signup = (userData: User): { success: boolean; error?: string } => {
    // Validate inputs
    if (!userData.name || userData.name.trim().length === 0) {
      return { success: false, error: 'Name is required' };
    }
    if (!userData.email || userData.email.trim().length === 0) {
      return { success: false, error: 'Email is required' };
    }
    if (!userData.email.includes('@')) {
      return { success: false, error: 'Invalid email format' };
    }
    if (!userData.password || userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    if (!userData.role) {
      return { success: false, error: 'Role selection is required' };
    }

    const users = getStoredUsers();
    
    // Check for duplicate email
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // Save new user
    users.push({
      ...userData,
      email: userData.email.toLowerCase().trim(),
      name: userData.name.trim()
    });
    saveUsers(users);

    return { success: true };
  };

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    if (!email || email.trim().length === 0) {
      return { success: false, error: 'Email is required' };
    }
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    const users = getStoredUsers();
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );

    if (!foundUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Save session
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(foundUser));
    setUser(foundUser);

    return { success: true };
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
