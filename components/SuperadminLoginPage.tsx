import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Lock, User } from "lucide-react";

interface SuperadminLoginPageProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onBackToUserLogin?: () => void;
}

export function SuperadminLoginPage({ onLogin, onBackToUserLogin }: SuperadminLoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await onLogin(username, password);
      if (!result.success) {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lock className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Superadmin</h1>
          </div>
          <CardTitle>System Administration</CardTitle>
          <CardDescription>
            Access the administrative control panel
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter superadmin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={onBackToUserLogin}
                className="w-full"
              >
                Back to User Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
