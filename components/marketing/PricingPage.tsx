import React, { useState } from 'react';
import { Check, ArrowRight, Users, Briefcase, Package, Calculator } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (page: 'trial' | 'features') => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [repCount, setRepCount] = useState(10);

  const monthlyCost = repCount * 100;
  const annualCost = monthlyCost * 12;
  const annualSavings = annualCost * 0.15; // 15% discount if we offer annual billing
  const annualCostDiscounted = annualCost - annualSavings;

  const isoFeatures = [
    'Live Portfolio Analytics',
    'AI Statement Reader',
    'Per-Rep Profitability Tracking',
    'Automated Churn Detection',
    'Merchant Ledger & CRM',
    'Health Scoring & Risk Alerts',
    'Unlimited Merchant Accounts',
    'Multi-Processor Support',
    'API Access',
    'Priority Support'
  ];

  const merchantFeatures = [
    'Transaction Analytics Dashboard',
    'AI Inventory Intelligence',
    'Live Volume Tracking',
    'AI Data Chat',
    'Customer Insights',
    'Revenue Forecasting',
    'Custom Reports',
    'Mobile Access'
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Pay per user, scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* ISO Pricing Calculator */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-semibold rounded-full mb-4">
                  <Briefcase className="w-4 h-4" />
                  For ISOs & Processors
                </div>
                <h2 className="text-4xl font-bold mb-4">$100 per user/month</h2>
                <p className="text-gray-300 text-lg">
                  Priced per sales representative. Scale your team without limits.
                </p>
              </div>

              {/* Interactive Calculator */}
              <div className="bg-white/10 rounded-xl p-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <Calculator className="w-6 h-6 text-white" />
                  <h3 className="text-xl font-semibold">Calculate Your Cost</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Number of Sales Representatives
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={repCount}
                      onChange={(e) => setRepCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-sm text-gray-300 mt-2">
                      <span>1 rep</span>
                      <span className="font-bold text-white text-lg">{repCount} reps</span>
                      <span>100 reps</span>
                    </div>
                  </div>

                  <div className="border-t border-white/20 pt-6 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-300">Monthly Cost</span>
                      <span className="text-3xl font-bold">${monthlyCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-300">Annual Cost</span>
                      <span className="text-xl text-gray-300">
                        ${annualCost.toLocaleString()}/year
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Positioning */}
              <div className="bg-white/10 rounded-xl p-6 mb-8 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">Built-In Pricing Strategy Simulator</h3>
                <p className="text-gray-300 text-sm mb-4">
                  ONE82 includes a strategy simulator designed for your own growth model: test ONE82 subscription pricing
                  and CRM engagement intensity before rolling changes out to your team.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="font-semibold text-white mb-1">Subscription Price Lever</p>
                    <p className="text-gray-300">Model how plan pricing adjustments affect conversion, retention, and net MRR.</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="font-semibold text-white mb-1">CRM Engagement Lever</p>
                    <p className="text-gray-300">Model how account-touch intensity impacts onboarding success and churn reduction.</p>
                  </div>
                </div>
              </div>

              {/* Feature List */}
              <div className="grid md:grid-cols-2 gap-3 mb-8">
                {isoFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('trial')}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors"
              >
                Use Auth Login
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Merchant Pricing */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 text-sm font-semibold rounded-full mb-4">
                  <Package className="w-4 h-4" />
                  For Merchants
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Included with ISO Partnership</h2>
                <p className="text-gray-600 text-lg">
                  Merchant features are included when your ISO uses ONE82 to manage their portfolio.
                  Contact your payment processor to get access.
                </p>
              </div>

              {/* Feature List */}
              <div className="grid md:grid-cols-2 gap-3 mb-8">
                {merchantFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-4">
                  Are you an independent merchant looking for direct access?
                </p>
                <button
                  onClick={() => onNavigate('trial')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-900 bg-white border-2 border-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Contact Sales
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ROI That Speaks for Itself
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ONE82 pays for itself by saving time, preventing churn, and accelerating sales cycles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">10+</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">Hours Saved Weekly</div>
              <p className="text-sm text-gray-600">
                Eliminate manual statement analysis and portfolio reporting
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">25%</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">Churn Reduction</div>
              <p className="text-sm text-gray-600">
                Early detection and proactive outreach prevent merchant loss
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">3x</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">Faster Sales Cycles</div>
              <p className="text-sm text-gray-600">
                AI-generated proposals close deals in days, not weeks
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              For a 10-rep team at $1,000/month, you'd need to save just <strong>2.5 hours per week</strong> to break even.
              Most teams save 3-4x that amount.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ONE82 vs. Traditional Tools
            </h2>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-6 text-gray-900 font-semibold">Capability</th>
                  <th className="text-center p-6 text-gray-900 font-semibold bg-gray-50">Spreadsheets</th>
                  <th className="text-center p-6 text-white font-semibold bg-gray-900">ONE82</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { capability: 'Real-time data', traditional: false, one82: true },
                  { capability: 'AI churn detection', traditional: false, one82: true },
                  { capability: 'Automated statement analysis', traditional: false, one82: true },
                  { capability: 'Per-rep profitability', traditional: 'Manual', one82: true },
                  { capability: 'Portfolio health scoring', traditional: false, one82: true },
                  { capability: 'Multi-processor support', traditional: 'Manual', one82: true },
                  { capability: 'Merchant inventory AI', traditional: false, one82: true },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="p-6 text-gray-900">{row.capability}</td>
                    <td className="p-6 text-center bg-gray-50">
                      {row.traditional === true ? (
                        <Check className="w-5 h-5 text-gray-400 mx-auto" />
                      ) : row.traditional === false ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className="text-sm text-gray-500">{row.traditional}</span>
                      )}
                    </td>
                    <td className="p-6 text-center bg-gray-50">
                      {row.one82 === true ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How does Auth Login work?</h3>
              <p className="text-gray-600">
                Auth Login connects through the authentication API for account-based access.
                If Auth Login is unavailable, you can still use Demo Login immediately.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What payment processors do you support?</h3>
              <p className="text-gray-600">
                Stripe, Square, Clover, TSYS, Fiserv, Global Payments, WorldPay, and Elevon.
                New integrations added regularly based on customer demand.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I add/remove users as needed?</h3>
              <p className="text-gray-600">
                Yes. Add or remove sales reps anytime. Billing automatically adjusts on your next cycle.
                No long-term contracts or commitments.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-gray-600">
                Enterprise-grade security with SOC 2 compliance, end-to-end encryption, and strict data access controls.
                Your transaction data never leaves our secure infrastructure.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer annual billing?</h3>
              <p className="text-gray-600">
                Yes. Annual plans available with 15% discount. Contact sales for custom enterprise agreements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the ISOs already using ONE82 to transform their portfolio management.
            Use Auth Login for account access, or Demo Login to explore instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('trial')}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-lg"
            >
              Use Auth Login
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('features')}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Explore Features
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
