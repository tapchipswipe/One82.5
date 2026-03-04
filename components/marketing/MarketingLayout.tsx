import React from 'react';
import { ArrowRight } from 'lucide-react';

interface MarketingLayoutProps {
  children: React.ReactNode;
  activePage: 'home' | 'features' | 'pricing';
  onNavigate: (page: 'home' | 'features' | 'pricing' | 'login' | 'trial') => void;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children, activePage, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
              <img
                src="/logos/one82-logo-white-centered-v2.png"
                alt="ONE82"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-gray-900">ONE82</span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => onNavigate('home')}
                className={`text-sm font-medium transition-colors ${
                  activePage === 'home'
                    ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('features')}
                className={`text-sm font-medium transition-colors ${
                  activePage === 'features'
                    ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Features
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className={`text-sm font-medium transition-colors ${
                  activePage === 'pricing'
                    ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pricing
              </button>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('login')}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('trial')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Auth Login
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logos/one82-logo-white-centered-v2.png"
                  alt="ONE82"
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold text-gray-900">ONE82</span>
              </div>
              <p className="text-sm text-gray-600">
                Intelligence at Speed.<br />Turn transaction data into a goldmine.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => onNavigate('features')} className="text-sm text-gray-600 hover:text-gray-900">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('pricing')} className="text-sm text-gray-600 hover:text-gray-900">
                    Pricing
                  </button>
                </li>
                <li>
                  <span className="text-sm text-gray-400">Integrations</span>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-sm text-gray-400">About</span>
                </li>
                <li>
                  <span className="text-sm text-gray-400">Blog</span>
                </li>
                <li>
                  <span className="text-sm text-gray-400">Careers</span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-sm text-gray-400">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-sm text-gray-400">Terms of Service</span>
                </li>
                <li>
                  <span className="text-sm text-gray-400">Security</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-600">
              © 2026 ONE82. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
