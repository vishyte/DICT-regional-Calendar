import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "../utils/api";

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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (username: string, email: string, password: string, confirmPassword: string, firstName: string, middleName: string, lastName: string, project: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Validate token and get user profile
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
      const response = await authAPI.login({ username, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.error || 'Login failed' };
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
    } catch (error: any) {
      return { success: false, message: error.response?.data?.error || 'Registration failed' };
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
