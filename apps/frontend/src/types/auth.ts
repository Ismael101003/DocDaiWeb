export type UserRole = 'doctor' | 'patient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  medicalId?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: AuthCredentials) => Promise<void>;
  register: (input: AuthCredentials) => Promise<void>;
  logout: () => void;
}

export interface AuthCredentials {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
