import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "../utils/api";
// @ts-ignore
import bcrypt from "bcryptjs";

interface User {
  id: number;
  username: string;
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  idNumber: string;
  email: string;
  project: string;
}

interface LocalUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  project: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (username: string, email: string, password: string, confirmPassword: string, firstName: string, middleName: string, lastName: string, project: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get all local users from localStorage
function getLocalUsers(): LocalUser[] {
  try {
    const users = localStorage.getItem('local_users');
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
}

// Save users to localStorage
function saveLocalUsers(users: LocalUser[]): void {
  localStorage.setItem('local_users', JSON.stringify(users));
}

// Find user by username
function findLocalUser(username: string): LocalUser | null {
  const users = getLocalUsers();
  return users.find(u => u.username === username) || null;
}

// Check if username or email exists
function userExists(username: string, email: string): boolean {
  const users = getLocalUsers();
  return users.some(u => u.username === username || u.email === email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Try to get user profile from backend first
      authAPI.getProfile()
        .then((response: any) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // First try backend
      const response = await authAPI.login({ username, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      // Fall back to local users
      const localUser = findLocalUser(username);
      if (!localUser) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check password against hash (for local storage, we'll use a simple comparison)
      // In production, use proper bcrypt comparison
      try {
        const passwordMatch = await bcrypt.compare(password, localUser.password_hash);
        if (!passwordMatch) {
          return { success: false, message: 'Invalid credentials' };
        }

        // Generate a mock token for local user
        const mockToken = 'local_' + btoa(localUser.username + '_' + Date.now());
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('current_local_user', JSON.stringify(localUser));

        const userData = {
          id: localUser.id,
          username: localUser.username,
          fullName: `${localUser.first_name} ${localUser.middle_name ? localUser.middle_name + ' ' : ''}${localUser.last_name}`,
          firstName: localUser.first_name,
          middleName: localUser.middle_name,
          lastName: localUser.last_name,
          idNumber: localUser.username,
          email: localUser.email,
          project: localUser.project
        };

        setUser(userData);
        return { success: true };
      } catch (err) {
        return { success: false, message: 'Login failed' };
      }
    }
  };

  const register = async (username: string, email: string, password: string, confirmPassword: string, firstName: string, middleName: string, lastName: string, project: string): Promise<{ success: boolean; message: string }> => {
    // Client-side validation
    if (!username || !email || !password || !confirmPassword || !firstName || !lastName || !project) {
      return { success: false, message: "All required fields are required" };
    }

    if (username.trim().length < 3) {
      return { success: false, message: "Username must be at least 3 characters" };
    }

    if (!email.endsWith("@dict.gov.ph")) {
      return { success: false, message: "Email must be a valid DICT email (@dict.gov.ph)" };
    }

    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters" };
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" };
    }

    // Check if user already exists
    if (userExists(username, email)) {
      return { success: false, message: "Username or email already exists" };
    }

    try {
      // Try backend first
      try {
        await authAPI.register({
          username,
          email,
          password,
          firstName,
          middleName: middleName || undefined,
          lastName,
          project
        });

        return { success: true, message: "Registration successful" };
      } catch (backendError: any) {
        // If backend fails, save to local storage as temporary solution
        console.warn('Backend registration failed, saving to local storage:', backendError.message);
        
        // Hash password using bcryptjs
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Get existing users
        const users = getLocalUsers();
        
        // Create new user
        const newUser: LocalUser = {
          id: Math.max(...users.map(u => u.id), 0) + 1,
          username,
          email,
          password_hash: passwordHash,
          first_name: firstName,
          middle_name: middleName || undefined,
          last_name: lastName,
          project
        };
        
        // Add to users and save
        users.push(newUser);
        saveLocalUsers(users);
        
        console.log('✅ User registered locally:', username);
        return { success: true, message: "Registration successful (saved locally)" };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
