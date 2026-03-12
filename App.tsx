import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ActivitiesProvider, useActivities } from "./components/ActivitiesContext";
import { LoginPage } from "./components/LoginPage";
import { SuperadminLoginPage } from "./components/SuperadminLoginPage";
import { SuperadminDashboard } from "./components/SuperadminDashboard";
import { CalendarView } from "./components/CalendarView";
import { ActivityForm } from "./components/ActivityForm";
import { ActivitiesPerProvince } from "./components/ActivitiesPerProvince";
import { ActivityRecords } from "./components/ActivityRecords";
import { DocumentsPage } from "./components/DocumentsPage";
import { UserProfile } from "./components/UserProfile";
import { DICTLogo } from "./components/DICTLogo";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Toaster } from "./components/ui/sonner";
import { deriveDisplayStatus } from "./components/utils/status";
import { ArrowLeft, LogOut, User, Shield, LayoutDashboard, FileText, PlusCircle,  Bell   } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog";
// Initialize Firebase (must be imported at app root)
import "./src/config/firebase";

// Add shake animation styles
const shakeStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px) rotate(-1deg); }
    20%, 40%, 60%, 80% { transform: translateX(2px) rotate(1deg); }
  }
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shakeStyles;
  document.head.appendChild(styleSheet);
}

function AppContent() {
  const { user, logout, loading } = useAuth();
  const { activities } = useActivities();
  const [currentPage, setCurrentPage] = useState<"calendar" | "activity" | "provinces" | "records" | "documents" | "approvals" | "profile">("calendar");
  // debug: log navigation
  useEffect(() => {
    console.log("navigated to", currentPage);
  }, [currentPage]);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(2);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [triggerShake, setTriggerShake] = useState<number>(0);
  const [isSuperadminMode, setIsSuperadminMode] = useState<boolean | null>(null); // null = checking, true/false = determined
  const [superadminUser, setSuperadminUser] = useState<{username: string} | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState<boolean>(false);

  const isAdminOrSuperadmin = ["admin", "project_focal", "project_team_lead"].includes(user?.role || "") || user?.role === "superadmin";

  // Compute pending activities
  const pendingActivities = React.useMemo(() => {
    if (!user || !activities) return [];
    
    // Flatten activities from DayActivities
    const flattened: any[] = Object.values(activities).flat();
    
    console.log('Checking pending activities for user:', user.idNumber, 'project:', user.project, 'Total activities:', flattened.length);
    
    // Filter for activities with display status "Submission of Documents"
    return flattened.filter(activity => {
      // Get the display status (computed based on date/time)
      const displayStatus = deriveDisplayStatus(activity);
      
      if (displayStatus !== "Submission of Documents") return false;
      
      // Check if activity belongs to user's project
      if (activity.project === user.project) {
        console.log('✓ Found pending activity for project:', activity.name);
        return true;
      }
      
      // Also check if created by current user
      if (activity.createdBy?.idNumber === user.idNumber) {
        console.log('✓ Found pending activity created by user:', activity.name);
        return true;
      }
      
      // Check if assigned to current user
      if (activity.assignedPersonnel?.some((ap: any) => ap.idNumber === user.idNumber)) {
        console.log('✓ Found pending activity assigned to user:', activity.name);
        return true;
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by date descending
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [activities, user]);

  // Update unread count to match pending activities
  useEffect(() => {
    setUnreadNotifications(pendingActivities.length);
    console.log('Pending activities count:', pendingActivities.length);
    if (pendingActivities.length > 0) {
      console.log('Pending activities:', pendingActivities.map(a => a.name));
    }
  }, [pendingActivities]);

  // Trigger shake animation periodically
  useEffect(() => {
    if (unreadNotifications === 0) return;
    
    const shakeInterval = setInterval(() => {
      setTriggerShake(prev => prev + 1);
    }, 5000); // Shake every 5 seconds
    
    return () => clearInterval(shakeInterval);
  }, [unreadNotifications]);

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
                  <p className="text-sm text-gray-600">Logged in as: Admin</p>
                </div>
              </div>
              <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to log out? You will need to log in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setSuperadminUser(null);
                        setIsSuperadminMode(false);
                        localStorage.removeItem('is_superadmin');
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('current_local_user');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Yes, Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <SuperadminDashboard
            onLogout={() => setLogoutDialogOpen(true)}
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

          </div>
        </div>
      </div>
      
      <div className="flex gap-0">
        <nav className="w-56 bg-gray-50 shadow-lg py-8 px-4 border-r border-gray-200">
          {/* user summary */}
          <div className="mb-4 flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold">
              { (user?.firstName?.[0] || user?.fullName?.[0] || 'S') }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{(user?.fullName || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()).toUpperCase()}</p>
              {user?.role !== 'provincial_officer' && (
                <p className="text-xs text-gray-700 truncate mt-0.5">{(user?.project || 'eGOV').toUpperCase()}</p>
              )}
              {user?.officeAssignment && (
                <p className="text-xs text-gray-700 truncate mt-0.5">{user.officeAssignment}</p>
              )}
              <div className="mt-1">
                <Badge
                  variant={
                    user?.role === 'provincial_officer'
                      ? 'royal'
                      : user?.role === 'admin' || user?.role === 'superadmin'
                      ? 'default'
                      : 'staff'
                  }
                  className="text-xs"
                >
                  {user?.role === 'superadmin'
                    ? 'Superadmin'
                    : user?.role === 'admin'
                    ? 'Admin'
                    : user?.role === 'provincial_officer'
                    ? 'Provincial Officer'
                    : 'Staff'}
                </Badge>
              </div>
            </div>
          </div>
          <hr className="border-gray-300 my-4" />
          <ul className="space-y-4">
            <li>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 py-2 rounded-md transition-colors font-medium ${currentPage === "calendar" ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600" : "hover:bg-gray-100"}`}
                onClick={() => setCurrentPage("calendar")}
              >
                <LayoutDashboard className="h-5 w-5" /> Dashboard
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 py-2 rounded-md transition-colors font-medium ${currentPage === "documents" ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600" : "hover:bg-gray-100"}`}
                onClick={() => setCurrentPage("documents")}
              >
                <FileText className="h-5 w-5" /> Documents
              </Button>
            </li>
            {isAdminOrSuperadmin && (
              <li>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 py-2 rounded-md transition-colors font-medium ${currentPage === "approvals" ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600" : "hover:bg-gray-100"}`}
                  onClick={() => setCurrentPage("approvals")}
                >
                  <Shield className="h-5 w-5" /> Activities Approval
                </Button>
              </li>
            )}
            <li>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 py-2 rounded-md transition-colors font-medium ${currentPage === "activity" ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600" : "hover:bg-gray-100"}`}
                onClick={() => setCurrentPage("activity")}
              >
                <PlusCircle className="h-5 w-5" /> Create Activity
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 py-2 rounded-md transition-colors font-medium ${currentPage === "profile" ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600" : "hover:bg-gray-100"}`}
                onClick={() => setCurrentPage("profile")}
              >
                <User className="h-5 w-5" /> Profile
              </Button>
            </li>
            <li>
              <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-red-600"> 
                    <LogOut className="h-5 w-5" /> Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to log out? You will need to log in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={logout}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Yes, Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          </ul>
        </nav>
        <main className="flex-grow max-w-screen-xl mx-auto px-0 py-8">
        {(currentPage === "activity" || currentPage === "provinces" || currentPage === "records" || currentPage === "profile") && (
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
        {/* page heading for clarity when navigating */}
        {currentPage === "records" && (
          <h1 className="text-2xl font-semibold mb-6">Activity Records</h1>
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
        {currentPage === "profile" && <UserProfile />}
        {currentPage === "provinces" && <ActivitiesPerProvince />}
        {currentPage === "records" && <ActivityRecords />}
        {currentPage === "documents" && <DocumentsPage />}
        {currentPage === "approvals" && isAdminOrSuperadmin && <DocumentsPage onlyApprovals />}
        </main>
        {/* Notifications panel - fixed on right side */}
        <div className="fixed top-24 right-6 z-20">
          <button
            key={triggerShake}
            onClick={() => setShowNotifications((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md bg-white border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-blue-400 hover:scale-105 transition-all ${unreadNotifications > 0 && triggerShake % 2 === 0 ? 'animate-shake' : ''}`}
          >
            <Bell className="h-5 w-5 text-gray-700" />
            {unreadNotifications > 0 && (
              <span className="inline-flex items-center justify-center bg-red-600 text-white text-xs font-semibold h-5 w-5 rounded-full">
                {unreadNotifications}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute top-12 right-0 w-72 bg-white border border-gray-200 shadow-lg rounded-md p-4 z-30">
              <p className="text-sm font-medium mb-3">Pending Documents ({pendingActivities.length})</p>
              <ul className="space-y-2 text-sm text-gray-700 max-h-80 overflow-y-auto">
                {pendingActivities.slice(0, 6).map((activity, index) => (
                  <li key={activity.id} className="px-2 py-1 rounded hover:bg-gray-50">
                    <span className="font-semibold">{index + 1}.</span> {activity.name} ({activity.date})
                  </li>
                ))}
                {pendingActivities.length === 0 && (
                  <li className="px-2 py-1 rounded text-gray-500">No pending documents</li>
                )}
              </ul>
              <div className="mt-3 text-right">
                <Button variant="link" onClick={() => { setShowNotifications(false); setUnreadNotifications(0); setCurrentPage("records"); }} className="text-xs">
                  View all
                </Button>
              </div>
            </div>
          )}
        </div>
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
