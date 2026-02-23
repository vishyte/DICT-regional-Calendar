import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Users, Settings, FileText, LogOut, LayoutDashboard } from "lucide-react";
import { UserManagement } from "./superadmin/UserManagement";
import { AdminAssignment } from "./superadmin/AdminAssignment";
import { ActivityLogsViewer } from "./superadmin/ActivityLogsViewer";

interface SuperadminDashboardProps {
  onLogout: () => void;
  superadminName?: string;
}

export function SuperadminDashboard({ onLogout, superadminName = "Administrator" }: SuperadminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Superadmin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-medium text-gray-900">{superadminName}</p>
            </div>
            <Button
              variant="outline"
              onClick={onLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">—</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Project Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">—</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">—</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 border-b">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="admins">
                <Settings className="h-4 w-4 mr-2" />
                Project Admins
              </TabsTrigger>
              <TabsTrigger value="logs">
                <FileText className="h-4 w-4 mr-2" />
                Activity Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <CardHeader>
                <CardTitle>Welcome to Superadmin Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Use this dashboard to manage system users, assign project administrators, and view activity logs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">User Management</h3>
                    <p className="text-sm text-blue-700">Add, edit, and manage system users</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-medium text-green-900 mb-2">Project Admins</h3>
                    <p className="text-sm text-green-700">Assign admins to specific projects</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-medium text-purple-900 mb-2">Activity Logs</h3>
                    <p className="text-sm text-purple-700">View system activity and user actions</p>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="admins">
              <AdminAssignment />
            </TabsContent>

            <TabsContent value="logs">
              <ActivityLogsViewer />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
