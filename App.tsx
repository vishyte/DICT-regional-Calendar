import { useState } from "react";
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

function AppContent() {
  const { user, logout, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<"calendar" | "activity" | "provinces" | "records">("calendar");
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [isSuperadminMode, setIsSuperadminMode] = useState(false);
  const [superadminUser, setSuperadminUser] = useState<{username: string} | null>(null);

  // Default superadmin credentials (for demo purposes)
  const SUPERADMIN_CREDENTIALS = {
    username: "superadmin",
    password: "admin123"
  };

  const handleSuperadminLogin = async (username: string, password: string) => {
    // Validate credentials
    if (username === SUPERADMIN_CREDENTIALS.username && password === SUPERADMIN_CREDENTIALS.password) {
      setSuperadminUser({ username });
      return { success: true };
    }
    return { success: false, message: "Invalid username or password" };
  };

  if (loading) {
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
  if (isSuperadminMode && !superadminUser) {
    return (
      <SuperadminLoginPage 
        onLogin={handleSuperadminLogin}
        onBackToUserLogin={() => setIsSuperadminMode(false)}
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
            }}
            superadminName={superadminUser?.username}
          />
        </div>
      </div>
    );
  }

  if (!user) {
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
