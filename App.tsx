import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ActivitiesProvider } from "./components/ActivitiesContext";
import { LoginPage } from "./components/LoginPage";
import { SuperadminLoginPage } from "./components/SuperadminLoginPage";
import { SuperadminDashboard } from "./components/SuperadminDashboard";
import { CalendarView } from "./components/CalendarView";
import { ActivityForm } from "./components/ActivityForm";
import { ActivitiesPerProvince } from "./components/ActivitiesPerProvince";
import { ActivityRecords } from "./components/ActivityRecords";
import { DICTLogo } from "./components/DICTLogo";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Toaster } from "./components/ui/sonner";
import { ArrowLeft, LogOut, User, Shield } from "lucide-react";
// Initialize Firebase (must be imported at app root)
import "./src/config/firebase";

function AppContent() {
  const { user, logout, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<"calendar" | "activity" | "provinces" | "records">("calendar");
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [isSuperadminMode, setIsSuperadminMode] = useState<boolean | null>(null); // null = checking, true/false = determined
  const [superadminUser, setSuperadminUser] = useState<{username: string} | null>(null);

  // Restore superadmin session on mount/refresh based on localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const isSuperadmin = localStorage.getItem('is_superadmin');
    
    if (token && isSuperadmin === 'true') {
      // This is a superadmin session, restore it
      try {
        const decoded = JSON.parse(atob(token));
        setSuperadminUser({ username: decoded.username || 'superadmin' });
      } catch (e) {
        // JWT from backend, use default username
        setSuperadminUser({ username: 'superadmin' });
      }
      setIsSuperadminMode(true);
    } else {
      // Not a superadmin session
      setIsSuperadminMode(false);
    }
  }, []);

  const handleSuperadminLogin = async (username: string, password: string) => {
    // Default superadmin credentials (for local/demo purposes)
    const SUPERADMIN_CREDENTIALS = {
      username: "superadmin",
      password: "admin123"
    };

    // First, try to connect to backend
    try {
      const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${API_BASE_URL}/users/superadmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          // Store the token for API calls
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('is_superadmin', 'true');
          setSuperadminUser({ username: data.user.username });
          setIsSuperadminMode(true);
          return { success: true };
        }
      }
    } catch (error: any) {
      // If backend is not available, fall back to local validation
      if (error.name === 'AbortError' || error.message?.includes('fetch')) {
        console.log('Backend not available, using local validation');
      } else {
        console.error('Superadmin login error:', error);
      }
    }

    // Fallback to local validation if backend is not available
    if (username === SUPERADMIN_CREDENTIALS.username && password === SUPERADMIN_CREDENTIALS.password) {
      // Create a local token for API calls (will work if backend is available)
      const localToken = btoa(JSON.stringify({ 
        id: 0, 
        username: 'superadmin', 
        email: 'superadmin@dict.gov.ph', 
        role: 'superadmin',
        local: true 
      }));
      localStorage.setItem('auth_token', localToken);
      localStorage.setItem('is_superadmin', 'true');
      setSuperadminUser({ username });
      setIsSuperadminMode(true);
      return { success: true };
    }
    
    return { success: false, message: "Invalid username or password" };
  };

  // Show loading screen while checking authentication
  if (loading || isSuperadminMode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Superadmin login page
  if (isSuperadminMode === null) {
    // Still determining mode from localStorage
    return <div className="min-h-screen bg-white" />;
  }

  if (isSuperadminMode && !superadminUser) {
    return (
      <SuperadminLoginPage 
        onLogin={handleSuperadminLogin}
        onBackToUserLogin={() => {
          setIsSuperadminMode(false);
          localStorage.removeItem('is_superadmin');
        }}
      />
    );
  }

  // Superadmin dashboard
  if (isSuperadminMode && superadminUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Toaster position="top-right" />
        <div className="bg-white py-6 px-6 shadow-lg border-b-4 border-blue-600">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DICTLogo className="h-32 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-blue-600">Superadmin Dashboard</h1>
                  <p className="text-sm text-gray-600">Logged in as: {superadminUser.username}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSuperadminUser(null);
                  setIsSuperadminMode(false);
                  localStorage.removeItem('is_superadmin');
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('current_local_user');
                }}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <SuperadminDashboard
            onLogout={() => {
              setSuperadminUser(null);
              setIsSuperadminMode(false);
              localStorage.removeItem('is_superadmin');
              localStorage.removeItem('auth_token');
            }}
            superadminName={superadminUser?.username}
          />
        </div>
      </div>
    );
  }

  // Only show login page if user is not logged in AND not loading AND not superadmin
  // Check for token to prevent showing login during state restoration
  const hasToken = localStorage.getItem('auth_token');
  if (!user && !loading && !hasToken && isSuperadminMode === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <LoginPage />
        <div className="fixed bottom-6 right-6">
          <Button
            variant="outline"
            onClick={() => setIsSuperadminMode(true)}
            className="gap-2 bg-purple-600 text-white hover:bg-purple-700 border-0"
          >
            <Shield className="h-4 w-4" />
            Superadmin Login
          </Button>
        </div>
      </div>
    );
  }

  // If we have a token but no user (and not superadmin), treat it as a stale session:
  // clear auth and fall back to normal login instead of hanging on "Restoring session".
  if (hasToken && !user && isSuperadminMode === false && !loading) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_superadmin');
    localStorage.removeItem('current_local_user');
  }

  // Type-safe guard: if we reach here without a user, render nothing for this tick.
  // Next render will hit the login branch once token is cleared.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Toaster position="top-right" />
      <div className="bg-white py-6 px-6 shadow-lg border-b-4 border-blue-600">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DICTLogo className="h-32 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <p className="text-gray-900">{user.fullName}</p>
                  <Badge className="bg-blue-600">
                    <User className="h-3 w-3 mr-1" />
                    Staff
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{user.idNumber} • {user.email}</p>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {(currentPage === "activity" || currentPage === "provinces" || currentPage === "records") && (
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage("calendar")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Calendar
            </Button>
          </div>
        )}
        
        {currentPage === "calendar" && (
          <CalendarView 
            onNavigateToActivity={(dateKey?: string) => {
              setPrefillDate(dateKey);
              setCurrentPage("activity");
            }}
            onNavigateToProvinces={() => setCurrentPage("provinces")}
            onNavigateToRecords={() => setCurrentPage("records")}
          />
        )}
        {currentPage === "activity" && (
          <ActivityForm 
            prefillDate={prefillDate}
            onSubmitted={() => setCurrentPage("calendar")} 
            onViewRecords={() => setCurrentPage("records")} 
          />
        )}
        {currentPage === "provinces" && <ActivitiesPerProvince />}
        {currentPage === "records" && <ActivityRecords />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ActivitiesProvider>
        <AppContent />
      </ActivitiesProvider>
    </AuthProvider>
  );
}
