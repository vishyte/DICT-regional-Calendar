import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { User, Lock, AlertCircle, Eye, EyeOff, Mail, Shield } from "lucide-react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { DICTLogo } from "./DICTLogo";
import { generateVerificationCode, sendVerificationCodeEmail } from "./utils/verificationEmailService";

// OTP cooldown duration in seconds
const OTP_COOLDOWN_SECONDS = 60;

export function LoginPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [project, setProject] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Email verification state
  const [verificationStep, setVerificationStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  
  // OTP cooldown timer (in seconds)
  const [cooldownTimer, setCooldownTimer] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTimer > 0) {
      const timer = setTimeout(() => {
        setCooldownTimer(cooldownTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message || "Invalid credentials. Please try again.");
      } else {
        toast.success("Welcome back!", {
          description: "You have successfully logged in.",
        });
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Check cooldown
    if (cooldownTimer > 0) {
      setError(`Please wait ${cooldownTimer} seconds before requesting a new code.`);
      return;
    }
    
    // Basic validation before sending code
    if (!username || !firstName || !lastName || !email || !password || !confirmPassword || !project) {
      setError("All required fields are required");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!email.endsWith("@dict.gov.ph")) {
      setError("Email must be a valid DICT email (@dict.gov.ph)");
      return;
    }
    
    setSendingCode(true);
    const code = generateVerificationCode();
    setVerificationCode(code);
    
    // Store code temporarily (in sessionStorage for security)
    sessionStorage.setItem(`verification_code_${email}`, code);
    sessionStorage.setItem(`verification_data_${email}`, JSON.stringify({ username, firstName, middleName, lastName, email, password, project }));
    
    const result = await sendVerificationCodeEmail(email, code, username);
    
    if (result.success) {
      setVerificationStep('verify');
      setCooldownTimer(OTP_COOLDOWN_SECONDS);
      toast.success("Verification code sent!", {
        description: `Check your email (${email}) for the verification code.`,
      });
    } else {
      // If email fails, still allow verification with code shown in console (for development)
      if (result.message?.includes('not configured') || result.message?.includes('console')) {
        setVerificationStep('verify');
        setCooldownTimer(OTP_COOLDOWN_SECONDS);
        toast.info("Verification code generated", {
          description: `Check the browser console (F12) for the code. Email sending not configured.`,
          duration: 10000,
        });
      } else {
        setError(result.error || "Failed to send verification code");
      }
    }
    setSendingCode(false);
  };
  
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const storedCode = sessionStorage.getItem(`verification_code_${email}`);
    const storedData = sessionStorage.getItem(`verification_data_${email}`);
    
    if (!storedCode || !storedData) {
      setError("Verification session expired. Please start registration again.");
      setVerificationStep('form');
      return;
    }
    
    if (enteredCode !== storedCode && enteredCode !== verificationCode) {
      setError("Invalid verification code. Please check your email and try again.");
      return;
    }
    
    let data;
    try {
      data = JSON.parse(storedData);
    } catch (parseError) {
      setError("Registration data corrupted. Please start registration again.");
      setVerificationStep('form');
      sessionStorage.removeItem(`verification_code_${email}`);
      sessionStorage.removeItem(`verification_data_${email}`);
      return;
    }

    setLoading(true);
    
    setTimeout(async () => {
      try {
        const result = await register(data.username, data.email, data.password, data.password, data.firstName, data.middleName, data.lastName, data.project);
        
        // Clean up session storage
        sessionStorage.removeItem(`verification_code_${email}`);
        sessionStorage.removeItem(`verification_data_${email}`);
        
        if (!result.success) {
          setError(result.message);
          setLoading(false);
        } else {
          toast.success("Registration successful!", {
            description: "You can now log in with your credentials.",
          });
          // Switch to login form
          setIsRegistering(false);
          setVerificationStep('form');
          setUsername("");
          setFirstName("");
          setMiddleName("");
          setLastName("");
          setPassword("");
          setConfirmPassword("");
          setEmail("");
        setProject("");
        setEnteredCode("");
        setVerificationCode("");
        setCooldownTimer(0);
        setLoading(false);
      }
      } catch (err: any) {
        console.error('Registration error:', err);
        setError("An unexpected error occurred during registration. Please try again.");
        setLoading(false);
      }
    }, 500);
  };
  
  const handleBackToForm = () => {
    setVerificationStep('form');
    setEnteredCode("");
    sessionStorage.removeItem(`verification_code_${email}`);
    sessionStorage.removeItem(`verification_data_${email}`);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setUsername("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setProject("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setVerificationStep('form');
    setEnteredCode("");
    setVerificationCode("");
    setCooldownTimer(0);
    // Clean up session storage
    if (email) {
      sessionStorage.removeItem(`verification_code_${email}`);
      sessionStorage.removeItem(`verification_data_${email}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Watermark/logo background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src={`${import.meta.env.BASE_URL}assets/DICT-Logo-Final-2-300x153.png`}
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
                {isRegistering && verificationStep === 'verify' 
                  ? "Verify Your Email" 
                  : isRegistering 
                  ? "Create Account" 
                  : "Welcome Back"}
              </CardTitle>
              <CardDescription>
                {isRegistering && verificationStep === 'verify'
                  ? "Enter the verification code sent to your email"
                  : isRegistering
                  ? "Register to access the activity management system"
                  : "Sign in to access the activity management system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={isRegistering && verificationStep === 'verify' ? handleVerifyAndRegister : isRegistering ? handleSendVerificationCode : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder={isRegistering ? "Enter your username" : "Enter your username"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {isRegistering && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        type="text"
                        placeholder="Enter middle name (optional)"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

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

              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="project">Project/Program <span className="text-red-500">*</span></Label>
                  <Select value={project} onValueChange={setProject} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your project/program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IIDB">IIDB</SelectItem>
                      <SelectItem value="ILCDB">ILCDB</SelectItem>
                      <SelectItem value="Free Wi-Fi">Free Wi-Fi</SelectItem>
                      <SelectItem value="NBP">NBP</SelectItem>
                      <SelectItem value="NGP">NGP</SelectItem>
                      <SelectItem value="eGOVSD">eGOVSD</SelectItem>
                      <SelectItem value="IMB-DRRMD">IMB-DRRMD</SelectItem>
                      <SelectItem value="NIPPSB">NIPPSB</SelectItem>
                      <SelectItem value="PNPKI">PNPKI</SelectItem>
                      <SelectItem value="MISS">MISS</SelectItem>
                    </SelectContent>
                  </Select>
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

              {isRegistering && verificationStep === 'form' && (
                <>
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
                    disabled={sendingCode || cooldownTimer > 0}
                  >
                    {sendingCode ? "Sending Code..." : cooldownTimer > 0 ? `Wait ${cooldownTimer}s` : "Send Verification Code"}
                  </Button>
                </>
              )}

              {isRegistering && verificationStep === 'verify' && (
                <>
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-900">
                      <Shield className="h-5 w-5" />
                      <p className="font-medium">Verify Your Email</p>
                    </div>
                    <p className="text-sm text-gray-700">
                      We've sent a 6-digit verification code to <strong>{email}</strong>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="verificationCode">Verification Code</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="verificationCode"
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={enteredCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setEnteredCode(value);
                          }}
                          className="pl-10 text-center text-2xl tracking-widest font-mono"
                          required
                          maxLength={6}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Check your email for the code. 
                        {cooldownTimer > 0 ? (
                          <span className="text-orange-600"> Resend available in {cooldownTimer}s</span>
                        ) : (
                          <button type="button" onClick={handleSendVerificationCode} className="text-blue-600 hover:underline" disabled={sendingCode || cooldownTimer > 0}>
                            {sendingCode ? "Sending..." : "Resend code"}
                          </button>
                        )}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleBackToForm}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={loading || enteredCode.length !== 6}
                    >
                      {loading ? "Creating Account..." : "Verify & Create Account"}
                    </Button>
                  </div>
                </>
              )}

              {!isRegistering && (
                <>
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
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </>
              )}
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
