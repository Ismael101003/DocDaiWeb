import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthContextValue, AuthCredentials, AuthUser, UserRole } from '@/types/auth';

const STORAGE_KEY = 'docdaiweb.auth.user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthUser;

    if (parsed && (parsed.role === 'doctor' || parsed.role === 'patient')) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return null;
};

const buildUser = ({ name, email, role }: AuthCredentials): AuthUser => ({
  id: `${role}-${email.toLowerCase()}`,
  name,
  email,
  role,
  organization: role === 'doctor' ? 'Red médica DocDai' : undefined,
  medicalId: role === 'patient' ? 'PT-2045' : undefined,
});

const persistUser = (user: AuthUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(readStoredUser());
    setIsLoading(false);
  }, []);

  const authenticate = async (input: AuthCredentials) => {
    const nextUser = buildUser(input);
    setUser(nextUser);
    persistUser(nextUser);
  };

  const logout = () => {
    setUser(null);
    persistUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: authenticate,
      register: authenticate,
      logout,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
};

export const roles: UserRole[] = ['doctor', 'patient'];
