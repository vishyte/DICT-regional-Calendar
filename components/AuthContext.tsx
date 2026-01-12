import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  username: string;
  fullName: string;
  idNumber: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, email: string, password: string, confirmPassword: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const USERS_STORAGE_KEY = "dict_registered_users";

// Mock user database - default users
const DEFAULT_USERS = {
  "DICT-25-001": {
    password: "user123",
    fullName: "Engr. Ma. Jessa Garsuta",
    email: "user@dict.gov.ph",
  },
  "DICT-25-002": {
    password: "dict2025",
    fullName: "Maria Santos",
    email: "staff@dict.gov.ph",
  },
  "DICT-25-003": {
    password: "dict2025",
    fullName: "John Michael Dela Cruz",
    email: "staff.member@dict.gov.ph",
  },
};

// Get all users (default + registered)
const getAllUsers = () => {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  const registeredUsers = storedUsers ? JSON.parse(storedUsers) : {};
  return { ...DEFAULT_USERS, ...registeredUsers };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Check if user is already logged in (stored in localStorage)
    const storedUser = localStorage.getItem("dict_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (username: string, password: string): boolean => {
    const allUsers = getAllUsers();
    const userCredentials = allUsers[username as keyof typeof allUsers];
    
    if (userCredentials && userCredentials.password === password) {
      const loggedInUser: User = {
        username,
        fullName: userCredentials.fullName,
        idNumber: username,
        email: userCredentials.email,
      };
      setUser(loggedInUser);
      localStorage.setItem("dict_user", JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  };

  const register = (username: string, email: string, password: string, confirmPassword: string): { success: boolean; message: string } => {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return { success: false, message: "All fields are required" };
    }

    // Validate username (at least 3 characters)
    if (username.trim().length < 3) {
      return { success: false, message: "Username must be at least 3 characters" };
    }

    // Validate DICT email
    if (!email.endsWith("@dict.gov.ph")) {
      return { success: false, message: "Email must be a valid DICT email (@dict.gov.ph)" };
    }

    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters" };
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" };
    }

    const allUsers = getAllUsers();
    
    // Check if username already exists
    if (allUsers[username as keyof typeof allUsers]) {
      return { success: false, message: "Username already registered" };
    }

    // Store new user
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const registeredUsers = storedUsers ? JSON.parse(storedUsers) : {};
    
    registeredUsers[username] = {
      password,
      username,
      fullName: username, // Use username as fullName for display
      email,
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registeredUsers));

    return { success: true, message: "Registration successful" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dict_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
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
