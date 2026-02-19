import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      // Simulate fetching user from storage
      let user = StorageService.getUser();

      // If logging in as a different user than stored, or no user stored
      if (!user || user.email !== email) {
        // Create new simulation user
        // Default to 'merchant' role, but onboarding is false so they will select actual role in Onboarding screen
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

  const fillAdmin = () => {
    setEmail('admin');
    setPassword('admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white font-bold text-2xl mb-4">
            1
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in to One82</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back to your analytics platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username / Email</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-sm text-slate-500">
            Don't have an account? <a href="#" className="text-primary-600 hover:underline">Start Free Trial</a>
          </p>
          <button
            onClick={fillAdmin}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
          >
            Demo: Fill Admin Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;