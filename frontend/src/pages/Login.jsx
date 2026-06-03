import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, KeyRound, X } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden px-4">
      {/* Decorative Blur Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '-4s' }} />
      
      {/* Glassmorphic Login Container */}
      <div className="w-full max-w-md glass-panel-dark rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-800/80 animate-scale-up relative z-10">
        
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-lg mb-4 p-0.5 border border-slate-850">
            <img src="/Logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent text-center">
            Ekaakshara Finance Services
          </h1>
          <p className="text-[10px] text-slate-400 font-extrabold mt-2 uppercase tracking-widest leading-none">
            Joint Liability Group Microfinance
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-ping" />
            <span className="text-left">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="text-left">
            <label className="block text-[10px] font-black text-slate-300 mb-2 uppercase tracking-wider">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <User size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Enter username"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-sm text-slate-100 placeholder:text-slate-600 transition-premium font-medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="text-left">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-wider">Password</label>
              <button 
                type="button" 
                onClick={() => {
                  setShowForgot(true);
                  setForgotSuccess('');
                  setForgotUsername('');
                }}
                className="text-[9px] text-violet-400 hover:text-violet-300 transition-premium font-black uppercase tracking-widest cursor-pointer bg-transparent border-0"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock size={16} />
              </span>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 text-sm text-slate-100 placeholder:text-slate-600 transition-premium font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-premium cursor-pointer bg-transparent border-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider hover:from-violet-500 hover:to-indigo-500 transition-premium shadow-lg shadow-violet-500/10 hover:shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound size={14} />
                <span>Secure Sign In</span>
              </>
            )}
          </button>
        </form>
        
        {/* Support Lockup Info */}
        <div className="mt-8 text-center text-[9px] text-slate-500 font-extrabold uppercase tracking-wider border-t border-slate-900/60 pt-6">
          🔒 Secure authentication. Authorized personnel only.
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-display">Reset Password</h3>
              <button 
                onClick={() => setShowForgot(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-premium cursor-pointer bg-transparent border-0"
              >
                <X size={18} />
              </button>
            </div>
            
            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-250 rounded-2xl text-xs font-semibold leading-relaxed">
                  {forgotSuccess}
                </div>
                <button 
                  onClick={() => setShowForgot(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-[11px] text-slate-400 font-medium">Enter your registered username to request a credential reset.</p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Username</label>
                  <input 
                    type="text" 
                    placeholder="e.g. admin"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs text-slate-100 placeholder:text-slate-750 font-medium"
                    value={forgotUsername}
                    onChange={e => setForgotUsername(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => {
                    if (!forgotUsername.trim()) {
                      alert('Please enter your username');
                      return;
                    }
                    setForgotSuccess(`Reset Request Submitted: Please contact your microfinance administrator at support@ekaakshara.com or call +91 7999049627 to manually reset the password for account: @${forgotUsername}`);
                  }}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs hover:from-violet-500 hover:to-indigo-500 transition-all uppercase tracking-wider cursor-pointer"
                >
                  Request Reset
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
