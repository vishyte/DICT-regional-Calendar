import { useState } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ActivitiesProvider } from "./components/ActivitiesContext";
import { LoginPage } from "./components/LoginPage";
import { CalendarView } from "./components/CalendarView";
import { ActivityForm } from "./components/ActivityForm";
import { ActivitiesPerProvince } from "./components/ActivitiesPerProvince";
import { ActivityRecords } from "./components/ActivityRecords";
import { DICTLogo } from "./components/DICTLogo";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Toaster } from "./components/ui/sonner";
import { ArrowLeft, LogOut, User } from "lucide-react";

function AppContent() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<"calendar" | "activity" | "provinces" | "records">("calendar");

  if (!user) {
    return <LoginPage />;
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
            onNavigateToActivity={() => setCurrentPage("activity")}
            onNavigateToProvinces={() => setCurrentPage("provinces")}
            onNavigateToRecords={() => setCurrentPage("records")}
          />
        )}
        {currentPage === "activity" && (
          <ActivityForm 
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
