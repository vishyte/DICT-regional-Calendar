import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { User, Mail, Shield, Calendar, AlertCircle, LogOut } from "lucide-react";

export function UserProfile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    username: user?.idNumber || "",
    project: user?.project || ""
  });
  const projects = [
    "IIDB",
    "Free Wi-Fi for All",
    "Cybersecurity",
    "PNPKI",
    "ILCDB",
    "DTC ILCDB Core",
    "ILCDB SPARK",
    "eGOV",
    "Admin and Finance Related Activities",
    "Provincial Activity",
    "RD's Office",
    "Technical Operations Division"
  ];
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    // In a real app, this would send data to the backend
    setSuccessMessage("Profile updated successfully!");
    setIsEditing(false);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      middleName: user?.middleName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.idNumber || "",
      project: user?.project || ""
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-blue-200">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-blue-900">User Profile</h2>
            <p className="text-gray-600">Manage your profile information and account settings</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle>Account Information</CardTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 font-medium">
                  First Name
                </Label>
                {!isEditing ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{formData.firstName}</p>
                  </div>
                ) : (
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="border-gray-300"
                    placeholder="First name"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName" className="text-gray-700 font-medium">
                  Middle Name
                </Label>
                {!isEditing ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{formData.middleName}</p>
                  </div>
                ) : (
                  <Input
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="border-gray-300"
                    placeholder="Middle name"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 font-medium">
                  Last Name
                </Label>
                {!isEditing ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{formData.lastName}</p>
                  </div>
                ) : (
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="border-gray-300"
                    placeholder="Last name"
                  />
                )}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              {!isEditing ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{formData.username}</p>
                </div>
              ) : (
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled
                  className="border-gray-300 bg-gray-50 cursor-not-allowed"
                  placeholder="Username (read-only)"
                />
              )}
              <p className="text-xs text-gray-500">Username cannot be changed</p>
            </div>

            {/* Project */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-gray-700 font-medium">
                Project/Program
              </Label>
              {!isEditing ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{formData.project}</p>
                </div>
              ) : (
                <select
                  id="project"
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded"
                >
                  <option value="">Select project</option>
                  {projects.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              {!isEditing ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{formData.email}</p>
                </div>
              ) : (
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="border-gray-300"
                  placeholder="Enter your email address"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Account Role</p>
                  <p className="text-sm text-blue-700">Staff Member</p>
                </div>
              </div>
              <Badge className="bg-blue-600">Staff</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Account Status</p>
                  <p className="text-sm text-green-700">Active and Verified</p>
                </div>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Management Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Account Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                <strong>Password Management:</strong> To change your password, please contact your system administrator.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}