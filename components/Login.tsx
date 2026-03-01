import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { AuthMode, User } from '../types';
import { Loader2, Zap, TrendingUp, Shield, BarChart2, Gift, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User, mode: AuthMode) => void;
  showTrialMode?: boolean;
  onBackToHome?: () => void;
  initialAuthMode?: AuthMode;
}

const FEATURES = [
  { icon: TrendingUp, text: 'Live portfolio analytics' },
  { icon: BarChart2, text: 'AI-powered statement analysis' },
  { icon: Shield, text: 'Churn risk & residual tracking' },
];

const Login: React.FC<LoginProps> = ({ onLogin, showTrialMode = false, onBackToHome, initialAuthMode = 'demo' }) => {
  const isBackendAuthEnabled = AuthService.isBackendEnabled();
  const overseerEmail = AuthService.getOverseerEmail();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>(isBackendAuthEnabled ? initialAuthMode : 'demo');
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await AuthService.login({
        email,
        password,
        mode: authMode
      });

      setIsLoading(false);
      onLogin(result.user, result.mode);
    } catch (loginError) {
      setIsLoading(false);
      setError(loginError instanceof Error ? loginError.message : 'Sign-in failed. Please try again.');
    }
  };

  const fillDemo = () => {
    setEmail('demo@one82.io');
    setPassword('admin');
    setAuthMode('demo');
  };

  const fillOverseer = () => {
    setEmail(overseerEmail);
    setPassword('owner');
    setAuthMode('demo');
  };

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">

      {/* ── Left panel: brand ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative p-14 bg-gray-50/50">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/logos/one82-logo-white-centered-v2.png" 
            alt="ONE82" 
            className="h-16 w-16 object-contain"
          />
          <span className="text-gray-900 font-bold text-2xl tracking-tight">ONE82</span>
        </div>

        {/* Hero copy */}
        <div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Intelligence<br />
            at Speed
          </h1>
          <p className="text-gray-600 text-lg mb-10 leading-relaxed max-w-md">
            Real-time portfolio analytics, AI-powered statement analysis,
            and operational clarity for payment ISOs.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div>
          <div className="flex gap-8">
            {['5 ISOs', '240+ Merchants', '$2.4M Volume'].map(stat => (
              <div key={stat}>
                <p className="text-gray-900 font-bold text-xl">{stat.split(' ')[0]}</p>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{stat.split(' ').slice(1).join(' ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        
        <div className="w-full max-w-sm">
          {/* Back to Home button */}
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          )}

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img 
              src="/logos/one82-logo-white-centered-v2.png" 
              alt="ONE82" 
              className="h-12 w-12 object-contain"
            />
            <span className="text-gray-900 font-bold text-xl">ONE82</span>
          </div>

          {showTrialMode && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Gift className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 text-sm mb-1">14-Day Free Trial</h3>
                  <p className="text-green-700 text-xs">
                    No credit card required. Full access to all features. Start now!
                  </p>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-900 mb-2">{showTrialMode ? 'Start Your Free Trial' : 'Welcome back'}</h2>
          <p className="text-gray-600 text-sm mb-8">{showTrialMode ? 'Create your account to get started' : 'Sign in to your dashboard'}</p>

          <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
            <p className="text-xs font-semibold text-indigo-700">
              Owner Demo Access: use <span className="font-bold">{overseerEmail}</span> to open the Overseer dashboard.
            </p>
          </div>

          <div className="mb-6 rounded-lg border-2 border-gray-200 p-3 bg-gray-50">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Sign-in Mode</p>
            {isBackendAuthEnabled ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('demo')}
                  className={`px-3 py-2 text-sm font-semibold rounded-md border-2 transition-colors ${authMode === 'demo' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                >
                  Demo Mode
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('backend')}
                  className={`px-3 py-2 text-sm font-semibold rounded-md border-2 transition-colors ${authMode === 'backend' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                >
                  Backend Auth
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('demo')}
                  className="px-3 py-2 text-sm font-semibold rounded-md border-2 transition-colors bg-gray-900 text-white border-gray-900"
                >
                  Demo Mode
                </button>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              {!isBackendAuthEnabled
                ? 'Demo phase: backend auth is currently locked. Use demo mode for access.'
                : authMode === 'demo'
                  ? 'Uses local demo data and simulated session.'
                  : 'Requires a reachable auth API endpoint.'}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              Owner-only overseer access is reserved for <span className="font-semibold">{overseerEmail}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="you@company.com"
                className={`w-full px-4 py-3.5 rounded-lg border-2 bg-white text-gray-900 placeholder-gray-400 outline-none transition-all ${focused === 'email'
                    ? 'border-gray-900 ring-4 ring-gray-100'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                className={`w-full px-4 py-3.5 rounded-lg border-2 bg-white text-gray-900 placeholder-gray-400 outline-none transition-all ${focused === 'password'
                    ? 'border-gray-900 ring-4 ring-gray-100'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</>
              ) : authMode === 'demo' ? 'Enter Demo →' : 'Sign In →'}
            </button>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500">
              No account?{' '}
              <a href="#" className="text-gray-900 hover:text-gray-700 font-semibold underline">
                Start Free Trial
              </a>
            </p>
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={fillDemo}
                className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
              >
                Fill demo credentials
              </button>
              <button
                onClick={fillOverseer}
                className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
              >
                Fill owner credentials
              </button>
            </div>
          </div>

          {/* Simulation badge */}
          {authMode === 'demo' && (
            <div className="mt-8 flex items-center gap-2 justify-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
              </span>
              <span className="text-xs text-gray-500 font-medium">Simulation mode — no real data required</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;