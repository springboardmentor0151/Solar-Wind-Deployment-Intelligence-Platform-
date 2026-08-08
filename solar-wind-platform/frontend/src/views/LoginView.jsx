import React, { useState, useEffect } from 'react';
import GeoEnergyLogo from '../components/GeoEnergyLogo';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { 
  Sun, 
  Wind, 
  Lock, 
  Mail, 
  User, 
  ShieldAlert, 
  KeyRound, 
  Compass, 
  Globe, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2,
  Cpu,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function LoginView({ onLoginSuccess, initialIsLogin = true, navigate }) {
  // Mode switcher: 'login' | 'signup' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState(initialIsLogin ? 'login' : 'signup');

  // Input states
  const [username, setUsername] = useState(() => localStorage.getItem('remembered_username') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('planner');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('remembered_username'));

  // Forgot password specific states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state managers
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live validator checks helper
  const getPasswordRules = (pass) => {
    return {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*()\-=_+[\]{}|;:',.<>?/~`\\"]/.test(pass)
    };
  };

  const getStrengthMeter = (pass) => {
    if (!pass) return { label: '', color: 'bg-slate-800', width: 'w-0' };
    const rules = getPasswordRules(pass);
    const metCount = Object.values(rules).filter(Boolean).length;
    
    if (pass.length < 8) return { label: 'Too Short (Weak)', color: 'bg-rose-500', width: 'w-1/4' };
    if (metCount === 5) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
    if (metCount >= 3) return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
    return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/3' };
  };

  const currentPassRules = getPasswordRules(authMode === 'reset' ? newPassword : password);
  const currentStrength = getStrengthMeter(authMode === 'reset' ? newPassword : password);

  // Clear notices on view toggle
  useEffect(() => {
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetLink('');
    setForgotSubmitted(false);
  }, [authMode]);

  const validateEmail = (mail) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
  };

  const handleGoogleLogin = async (credential) => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const res = await axios.post('/api/auth/google-login', { credential });
      const mockUser = res.data.user || { 
        email: res.data.email, 
        full_name: res.data.full_name, 
        google_picture: res.data.google_picture, 
        is_onboarded: false, 
        role: 'planner', 
        username: (res.data.email || 'google_user').split('@')[0] 
      };

      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('username', mockUser.username);
      localStorage.setItem('role', mockUser.role);

      console.log("[GOOGLE AUTH DEBUG] API Response:", res.data);
      console.log("[GOOGLE AUTH DEBUG] Navigation Decision - Redirect to onboarding:", res.data.new_user || !res.data.is_onboarded);

      const response = res;
      if (response.data.new_user || !response.data.is_onboarded) {
          onLoginSuccess(mockUser);
          navigate("/complete-profile");
          return;
      } else {
        setSuccess("Google login successful! Syncing workspace...");
        setTimeout(() => {
          onLoginSuccess(res.data.user);
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Google authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Perform submissions
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Input Trimming
    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();

    // Client Side Validation
    if (authMode === 'login') {
      if (!trimmedUser) {
        setError("Username or Email is required.");
        return;
      }
      if (trimmedUser.includes('@') && !validateEmail(trimmedUser)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    if (authMode === 'signup') {
      if (trimmedUser.length < 3) {
        setError("Username must be at least 3 characters long.");
        return;
      }
      if (!/^[a-zA-Z0-9]+$/.test(trimmedUser)) {
        setError("Username must be alphanumeric.");
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!fullName.trim()) {
        setError("Full Name is required.");
        return;
      }
      
      // Password checks
      const rules = getPasswordRules(password);
      if (!Object.values(rules).every(Boolean)) {
        setError("Password does not meet all complexity requirements.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const params = new URLSearchParams();
        params.append('username', trimmedUser);
        params.append('password', password);

        const res = await axios.post('/api/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Save remember state
        if (rememberMe) {
          localStorage.setItem('remembered_username', trimmedUser);
        } else {
          localStorage.removeItem('remembered_username');
        }

        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('role', res.data.role);

        const meRes = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${res.data.access_token}` }
        });

        setSuccess("Login successful! Syncing profile datasets...");
        setTimeout(() => {
          onLoginSuccess(meRes.data);
        }, 800);

      } else if (authMode === 'signup') {
        const signupPayload = {
          username: trimmedUser,
          email: trimmedEmail,
          full_name: fullName.trim(),
          password
        };

        await axios.post('/api/auth/signup', signupPayload);
        setSuccess("Registration successful! Redirecting to login page...");
        setTimeout(() => {
          setAuthMode('login');
          if (navigate) navigate('/login');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError("Network connection error. Ensure the backend server is running on port 8001.");
      } else {
        setError(err.response.data?.detail || "Authentication failed. Validate credentials and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password verify trigger
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = forgotEmail.trim();
    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email: trimmedEmail });
      setForgotSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "No account found with this email.");
    } finally {
      setIsLoading(false);
    }
  };



  const roleOptions = [
    { id: 'planner', label: 'Energy Planner', icon: Compass, desc: 'Select target grids' },
    { id: 'analyst', label: 'GIS Analyst', icon: Globe, desc: 'Slope & elevation maps' },
    { id: 'manager', label: 'Project Manager', icon: TrendingUp, desc: 'Cost summaries & ROI' },
    { id: 'admin', label: 'Administrator', icon: ShieldCheck, desc: 'Audit compliance logs' }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#16A34A]/30 selection:text-emerald-400">
      
      {/* Background Graphic Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
        <svg className="absolute w-full h-full" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
          <path d="M150,150 Q180,100 250,120 T350,150 T500,200 T650,180" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="0" y1="200" x2="1000" y2="200" stroke="#ffffff" strokeWidth="0.5" />
          <line x1="0" y1="400" x2="1000" y2="400" stroke="#ffffff" strokeWidth="0.5" />
          <line x1="350" y1="0" x2="350" y2="600" stroke="#ffffff" strokeWidth="0.5" />
          <line x1="750" y1="0" x2="750" y2="600" stroke="#ffffff" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-900/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-900/10 blur-[100px] pointer-events-none z-0"></div>

      {/* Auth Card */}
      <div className="w-full max-w-5xl bg-[#0b101f]/85 border border-slate-800/80 rounded-3xl p-6 md:p-12 z-10 glass shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
        
        {/* Left Column: Rebranding details */}
        <div className="lg:col-span-5 space-y-8 pr-0 lg:pr-6 hidden lg:block">
          <div className="space-y-4">
            <GeoEnergyLogo type="full" size="large" className="mb-4" />
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Analyze renewable energy potential anywhere in the world using AI, GIS, weather intelligence and environmental analytics.
            </p>
          </div>

          <div className="space-y-3 border-t border-slate-900 pt-6">
            <span className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-widest block mb-2">Platform Capabilities</span>
            {[
              "Global GIS Mapping",
              "AI Recommendations",
              "Weather Intelligence",
              "Solar Analysis",
              "Wind Analysis",
              "Investment Planning"
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Form Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col items-center text-center mb-6 lg:hidden">
            <GeoEnergyLogo type="full" size="normal" />
          </div>

          {/* Form headers */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100">
              {authMode === 'login' && "Sign In to GeoEnergy AI"}
              {authMode === 'signup' && "Create Planner Account"}
              {authMode === 'forgot' && "Verify Reset Account"}
              {authMode === 'reset' && "Configure Secure Password"}
            </h3>
            <p className="text-[11px] text-slate-500">
              {authMode === 'login' && "Enter your secure planner account to query GIS datasets."}
              {authMode === 'signup' && "Create a platform planner account to compute feasibility ratings."}
              {authMode === 'forgot' && "Enter your registered email to request password update token."}
              {authMode === 'reset' && "Password must satisfy core security requirements."}
            </p>
          </div>

          {/* Status alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-start space-x-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {authMode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[10px] text-[#0EA5E9] hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg py-2 pl-10 pr-10 text-xs glass-input font-bold placeholder-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me row */}
              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-400 font-semibold">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="rounded bg-slate-950 border-slate-800 text-[#16A34A] focus:ring-0"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#16A34A] via-[#0EA5E9] to-[#F59E0B] hover:opacity-90 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center space-x-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to GeoEnergy AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div className="flex flex-col items-center justify-center w-full space-y-3">
                {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                          handleGoogleLogin(credentialResponse.credential);
                        }
                      }}
                      onError={() => {
                        setError("Google Sign-In failed.");
                      }}
                      theme="filled_dark"
                      shape="pill"
                      width="100%"
                    />
                  </div>
                ) : (
                  <div className="w-full p-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 rounded-xl text-[10px] font-bold text-center leading-normal">
                    ⚠️ Google Sign-In is disabled: VITE_GOOGLE_CLIENT_ID is not configured in your .env file.
                  </div>
                )}
              </div>
            </form>
          )}

          {/* 2. SIGNUP MODE */}
          {authMode === 'signup' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g., greenplanner"
                      className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@geoenergy.ai"
                      className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-700"
                  />
                </div>
              </div>



              {/* Password inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg py-2 pl-10 pr-10 text-xs glass-input font-bold placeholder-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Strength indicator panel */}
              {password && (
                <div className="p-3 bg-slate-955/60 border border-slate-900 rounded-xl space-y-2 text-[10px] font-semibold text-slate-400 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span>Password Strength: <strong>{currentStrength.label}</strong></span>
                    <div className="w-24 bg-slate-900 h-1.5 rounded overflow-hidden">
                      <div className={`h-full ${currentStrength.color} ${currentStrength.width} transition-all`}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border-t border-slate-900 pt-2 text-[9px] font-bold">
                    <span className={`flex items-center ${currentPassRules.length ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {currentPassRules.length ? '✔' : '✖'} Min 8 characters
                    </span>
                    <span className={`flex items-center ${currentPassRules.upper ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {currentPassRules.upper ? '✔' : '✖'} One uppercase letter
                    </span>
                    <span className={`flex items-center ${currentPassRules.lower ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {currentPassRules.lower ? '✔' : '✖'} One lowercase letter
                    </span>
                    <span className={`flex items-center ${currentPassRules.number ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {currentPassRules.number ? '✔' : '✖'} One number
                    </span>
                    <span className={`flex items-center ${currentPassRules.special ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {currentPassRules.special ? '✔' : '✖'} One special character
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#16A34A] via-[#0EA5E9] to-[#F59E0B] hover:opacity-90 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center space-x-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create GeoEnergy AI Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {authMode === 'forgot' && (
            <div className="space-y-4">
              {!forgotSubmitted ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter registered email address"
                        className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-700"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center space-x-1.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-2.5">
                    <span className="text-xs font-bold text-emerald-400 flex items-center">
                      ✓ Password reset instructions have been sent to your registered email.
                    </span>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Please check your inbox. If you don't receive the email within a few minutes, check your spam folder.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotSubmitted(false);
                      setAuthMode('login');
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode switch links */}
          <div className="text-center pt-2 flex flex-col items-center space-y-2">
            {authMode !== 'login' && (
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-[11px] font-bold text-slate-400 hover:text-blue-400 transition-colors"
              >
                Back to secure Sign In
              </button>
            )}
            
            {authMode === 'login' && (
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-[11px] font-bold text-slate-400 hover:text-blue-400 transition-colors"
              >
                New to GeoEnergy AI? Create an account
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
