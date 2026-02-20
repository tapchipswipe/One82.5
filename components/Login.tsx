import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';
import { Loader2, Zap, TrendingUp, Shield, BarChart2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const FEATURES = [
  { icon: TrendingUp, text: 'Live portfolio analytics' },
  { icon: BarChart2, text: 'AI-powered statement analysis' },
  { icon: Shield, text: 'Churn risk & residual tracking' },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
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
    <div className="min-h-screen flex bg-[#0a0a14] overflow-hidden">

      {/* ── Left panel: brand ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative p-14 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-[80px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">One82</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            The intelligence<br />
            layer for <span className="text-indigo-400">ISOs</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            Real-time portfolio analytics, AI-powered statement analysis,
            and per-rep profitability — all in one platform.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <div className="flex gap-6">
            {['5 ISOs', '240+ Merchants', '$2.4M Volume'].map(stat => (
              <div key={stat}>
                <p className="text-white font-bold text-lg">{stat.split(' ')[0]}</p>
                <p className="text-gray-500 text-xs">{stat.split(' ').slice(1).join(' ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Mobile bg orb */}
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">One82</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">Sign in to your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Username / Email
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 rounded-xl border bg-white/5 text-white placeholder-gray-600 outline-none transition-all text-sm ${focused === 'email'
                    ? 'border-indigo-500 bg-indigo-600/10 ring-2 ring-indigo-500/20'
                    : 'border-white/10 hover:border-white/20'
                  }`}
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
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
                className={`w-full px-4 py-3 rounded-xl border bg-white/5 text-white placeholder-gray-600 outline-none transition-all text-sm ${focused === 'password'
                    ? 'border-indigo-500 bg-indigo-600/10 ring-2 ring-indigo-500/20'
                    : 'border-white/10 hover:border-white/20'
                  }`}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600">
              No account?{' '}
              <a href="#" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                Start Free Trial
              </a>
            </p>
            <button
              onClick={fillDemo}
              className="text-xs text-gray-600 hover:text-gray-400 underline underline-offset-2 transition-colors"
            >
              Fill demo credentials
            </button>
          </div>

          {/* Simulation badge */}
          <div className="mt-8 flex items-center gap-2 justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-gray-600">Simulation mode — no real data required</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;