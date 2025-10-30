import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { User, Lock, AlertCircle, Eye, EyeOff, Mail, IdCard } from "lucide-react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { DICTLogo } from "./DICTLogo";

export function LoginPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const success = login(idNumber, password);
      if (!success) {
        setError("Invalid credentials. Please try again.");
      } else {
        toast.success("Welcome back!", {
          description: "You have successfully logged in.",
        });
      }
      setLoading(false);
    }, 500);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const result = register(fullName, idNumber, email, password, confirmPassword);
      if (!result.success) {
        setError(result.message);
        setLoading(false);
      } else {
        toast.success("Registration successful!", {
          description: "You can now log in with your credentials.",
        });
        // Switch to login form
        setIsRegistering(false);
        setFullName("");
        setPassword("");
        setConfirmPassword("");
        setEmail("");
        setLoading(false);
      }
    }, 500);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setFullName("");
    setIdNumber("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Watermark/logo background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src="/assets/DICT-Logo-Final-2-300x153.png"
          alt=""
          aria-hidden="true"
          role="presentation"
          tabIndex={-1}
          style={{ outline: "none" }}
          className="pointer-events-none select-none opacity-10 w-[900px] h-auto object-contain"
          draggable="false"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Visible DICT logo above the card */}
        <DICTLogo className="mx-auto mb-4 h-16 w-auto" />

          {/* Auth Card */}
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-blue-900">
                {isRegistering ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription>
                {isRegistering
                  ? "Register to access the activity management system"
                  : "Sign in to access the activity management system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
  <div className="space-y-2">
    <Label htmlFor="idNumber">ID Number</Label>
    <div className="relative">
      <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <Input
        id="idNumber"
        type="text"
        placeholder={isRegistering ? "DICT-25-024" : "Enter your ID number"}
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
        className="pl-10"
        required
      />
    </div>
  </div>
)}

              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="idNumber"
                    type="text"
                    placeholder={isRegistering ? "DICT-25-024" : "Enter your ID number"}
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                    className="pl-10"
                    required
                  />
                </div>
                {isRegistering && (
                  <p className="text-xs text-gray-500">Format: DICT-XX-XXX (e.g., DICT-25-024)</p>
                )}
              </div>

              {isRegistering && (
  <div className="space-y-2">
    <Label htmlFor="email">DICT Email</Label>
    <div className="relative">
      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <Input
        id="email"
        type="email"
        placeholder="yourname@dict.gov.ph"
        value={email}
        onChange={(e) => setEmail(e.target.value.toLowerCase())}
        className="pl-10"
        required
      />
    </div>
  </div>
)}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isRegistering ? "Create a password (min. 6 characters)" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading
                  ? isRegistering
                    ? "Creating Account..."
                    : "Signing in..."
                  : isRegistering
                  ? "Create Account"
                  : "Sign In"}
              </Button>
            </form>

            {/* Toggle between login and register */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {isRegistering
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Register"}
              </button>
            </div>

            {!isRegistering && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 mb-2">Demo Credentials:</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>ID Number:</strong> DICT-25-001 or DICT-25-002</p>
                  <p><strong>Password:</strong> user123 or dict2025</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2025 DICT Region 11. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
