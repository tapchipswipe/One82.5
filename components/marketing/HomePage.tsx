import React from 'react';
import { ArrowRight, TrendingUp, Package, Zap, LineChart, Target, Brain } from 'lucide-react';
import IntegrationLogos from './IntegrationLogos';

interface HomePageProps {
  onNavigate: (page: 'features' | 'pricing' | 'trial') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Transaction Data<br />Into a <span className="text-gray-600">Goldmine</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Real-time portfolio intelligence for payment ISOs. AI-powered analytics for merchants.
              Transform your transaction stream into actionable insights.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => onNavigate('trial')}
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Explore Features
              </button>
            </div>

            {/* Social Proof Strip */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong className="text-gray-900">5 ISOs</strong> trusted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong className="text-gray-900">240+</strong> merchants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong className="text-gray-900">$2.4M+</strong> volume</span>
              </div>
            </div>
          </div>

          {/* Dashboard Screenshot Placeholder */}
          <div className="mt-16 max-w-6xl mx-auto">
            <div className="relative rounded-2xl border-2 border-gray-200 bg-white shadow-2xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Live Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Value Proposition */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for ISOs and Merchants
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              One platform, two powerful perspectives. Intelligence at every level of the payment ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ISO Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For ISOs & Processors</h3>
              <p className="text-gray-300 mb-6">
                Manage your entire portfolio with real-time intelligence. Track per-rep profitability,
                detect churn before it happens, and convert leads with AI-powered competitive analysis.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-gray-200">Live portfolio analytics across all merchants</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-gray-200">AI Statement Reader for competitive proposals</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-gray-200">Per-rep profitability tracking and residuals</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-gray-200">Automated churn detection and risk alerts</span>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center gap-2 text-white hover:text-gray-200 font-semibold transition-colors"
              >
                View ISO Pricing
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Merchant Card */}
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-6">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Merchants</h3>
              <p className="text-gray-600 mb-6">
                Transform your transaction data into operational intelligence. Predict inventory needs,
                understand customer behavior, and make data-driven decisions with AI assistance.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2"></div>
                  <span className="text-gray-700">Transaction analytics and revenue insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2"></div>
                  <span className="text-gray-700">AI inventory predictions from purchase patterns</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2"></div>
                  <span className="text-gray-700">Live volume tracking and processing metrics</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2"></div>
                  <span className="text-gray-700">Ask AI questions about your business data</span>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('features')}
                className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 font-semibold transition-colors"
              >
                Explore Merchant Features
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Intelligence at Speed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop managing portfolios with spreadsheets. Start making decisions with real-time AI intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Insights</h3>
              <p className="text-gray-600">
                Live transaction stream analysis. No more waiting for monthly statements or stale data.
                Make decisions with up-to-the-minute intelligence.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-6">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Advanced pattern recognition for churn detection, inventory forecasting, and competitive
                positioning. Let AI do the heavy lifting.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-6">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Actionable Outcomes</h3>
              <p className="text-gray-600">
                Every insight comes with clear next steps. From reorder recommendations to sales
                opportunities, know exactly what to do next.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Works with Your Existing Stack
            </h2>
            <p className="text-lg text-gray-600">
              Seamless integration with all major payment processors
            </p>
          </div>
          <IntegrationLogos />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Transaction Data?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the ISOs and merchants already using ONE82 to make smarter decisions faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('trial')}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white hover:bg-white/10 rounded-lg transition-colors"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
