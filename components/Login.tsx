import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Loader2, Zap, TrendingUp, Shield, BarChart2, Gift, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  showTrialMode?: boolean;
  onBackToHome?: () => void;
}

const FEATURES = [
  { icon: TrendingUp, text: 'Live portfolio analytics' },
  { icon: BarChart2, text: 'AI-powered statement analysis' },
  { icon: Shield, text: 'Churn risk & residual tracking' },
];

const Login: React.FC<LoginProps> = ({ onLogin, showTrialMode = false, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      let user = StorageService.getUser();
      if (!user || user.email !== email) {
        user = {
          id: 'u_' + Date.now(),
          email,
          name: email.split('@')[0] || 'User',
          role: 'merchant',
          businessType: undefined,
          onboardingComplete: false,
          credits: 50,
          plan: 'Free'
        };
        StorageService.saveUser(user);
      }
      setIsLoading(false);
      onLogin(user);
    }, 1000);
  };

  const fillDemo = () => { setEmail('demo@one82.io'); setPassword('admin'); };

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
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500">
              No account?{' '}
              <a href="#" className="text-gray-900 hover:text-gray-700 font-semibold underline">
                Start Free Trial
              </a>
            </p>
            <button
              onClick={fillDemo}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Fill demo credentials
            </button>
          </div>

          {/* Simulation badge */}
          <div className="mt-8 flex items-center gap-2 justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
            </span>
            <span className="text-xs text-gray-500 font-medium">Simulation mode — no real data required</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;