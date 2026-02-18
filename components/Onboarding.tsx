import React from 'react';
import { BUSINESS_TYPES } from '../constants';
import { BusinessType } from '../types';

interface OnboardingProps {
  onComplete: (type: BusinessType) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Welcome to One82
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            To tailor your AI analytics, please select your primary business type.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BUSINESS_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onComplete(type.id as BusinessType)}
              className="relative group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all text-left"
            >
              <div className="text-3xl mb-3">{type.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                {type.label}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Optimized AI models for {type.label.toLowerCase()} metrics.
              </p>
            </button>
          ))}
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8">
            One82 uses intelligent models to benchmark your performance against industry standards.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;