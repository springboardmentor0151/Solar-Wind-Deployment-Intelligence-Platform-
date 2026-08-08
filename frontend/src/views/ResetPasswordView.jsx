import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  KeyRound, Lock, Eye, EyeOff, CheckCircle, 
  ShieldAlert, Loader2, ArrowRight 
} from 'lucide-react';
import GeoEnergyLogo from '../components/GeoEnergyLogo';

export default function ResetPasswordView({ navigate }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Read token from URL
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token') || '';

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

  const currentPassRules = getPasswordRules(newPassword);
  const currentStrength = getStrengthMeter(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError("Secure reset token is missing or invalid. Please request a new link.");
      return;
    }

    const rules = getPasswordRules(newPassword);
    if (!Object.values(rules).every(Boolean)) {
      setError("New password does not meet complexity requirements.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/auth/reset-password', {
        token: token,
        password: newPassword
      });
      setSuccess("Password updated successfully! Redirecting to login page...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to reset password. Token may be expired or reused.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative background grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-900/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-900/10 blur-[100px] pointer-events-none z-0"></div>

      {/* Reset Card */}
      <div className="w-full max-w-md bg-[#0b101f]/85 border border-slate-800/80 rounded-3xl p-6 md:p-8 z-10 glass shadow-2xl space-y-6">
        
        <div className="flex flex-col items-center text-center">
          <GeoEnergyLogo type="full" size="normal" className="mb-4" />
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">Configure Secure Password</h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Your token has been read automatically from the URL. Please configure your new password.
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

        {!token && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs leading-normal">
            ⚠️ <strong>Missing Reset Token:</strong> This page must be loaded from the reset link sent to your email. Click "Forgot Password" on the login page to request a reset link.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={!token || isLoading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg py-2.5 pl-10 pr-10 text-xs glass-input font-bold placeholder-slate-700 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={!token}
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
                disabled={!token || isLoading}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg py-2.5 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-700 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Strength indicator panel */}
          {newPassword && (
            <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2 text-[10px] font-semibold text-slate-400 animate-fade-in">
              <div className="flex justify-between items-center">
                <span>Password Strength: <strong>{currentStrength.label}</strong></span>
                <div className="w-24 bg-slate-900 h-1.5 rounded overflow-hidden">
                  <div className={`h-full ${currentStrength.color} ${currentStrength.width} transition-all`}></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 border-t border-slate-900 pt-2 text-[9px] font-bold">
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
            disabled={!token || isLoading}
            className="w-full bg-gradient-to-r from-emerald-600 via-sky-600 to-indigo-650 hover:opacity-90 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center space-x-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Reset Account Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="text-xs text-slate-500 hover:text-white font-semibold transition-all"
          >
            Back to Login Screen
          </button>
        </div>

      </div>
    </div>
  );
}
