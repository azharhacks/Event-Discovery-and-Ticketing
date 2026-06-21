import { createContext, useState, useCallback } from 'react';
import { getUser, getToken, setAuth, clearAuth } from '../lib/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());

  const login = useCallback((newToken, newUser) => {
    setAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
