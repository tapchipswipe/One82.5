import React from 'react';
import {
  TrendingUp, FileText, DollarSign, AlertTriangle, Briefcase, LineChart,
  CreditCard, Package, MessageSquare, BarChart3, Clock, Target, Brain, Zap
} from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (page: 'trial' | 'pricing') => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  const isoFeatures = [
    {
      icon: LineChart,
      title: 'Live Portfolio Analytics',
      description: 'Real-time transaction stream analysis across your entire merchant portfolio. Track volume, revenue, and processing metrics without waiting for monthly statements.',
      highlights: ['Live transaction monitoring', 'Multi-merchant dashboards', 'Custom date range analysis', 'Volume trend visualization']
    },
    {
      icon: FileText,
      title: 'AI Statement Reader',
      description: 'Upload competitor merchant statements and instantly generate savings proposals. AI analyzes rates, fees, and processing costs to identify opportunities.',
      highlights: ['Automatic rate extraction', 'Savings calculation engine', 'Professional proposal generation', 'MCC code analysis']
    },
    {
      icon: DollarSign,
      title: 'Per-Rep Profitability',
      description: 'Track residual income and performance by sales representative. Know exactly which reps are driving portfolio growth and which accounts are most valuable.',
      highlights: ['Rep-level revenue tracking', 'Residual income calculations', 'Performance leaderboards', 'Commission visibility']
    },
    {
      icon: AlertTriangle,
      title: 'Churn Detection',
      description: 'AI-powered early warning system detects merchants at risk based on volume drops, processing pattern changes, and behavioral signals.',
      highlights: ['Automated risk scoring', 'Volume drop alerts', 'Trend anomaly detection', 'Retention workflow triggers']
    },
    {
      icon: Briefcase,
      title: 'Merchant Ledger',
      description: 'Excel-style portfolio management with contact information, processing rates, volume tracking, and account notes. Your entire portfolio in one place.',
      highlights: ['Spreadsheet-style interface', 'Custom fields and tags', 'Bulk import/export', 'Advanced filtering and search']
    },
    {
      icon: Target,
      title: 'Health Scoring',
      description: 'Automated merchant health assessment based on transaction volume, growth trends, processing stability, and risk factors.',
      highlights: ['Overall health score (0-100)', 'Growth opportunity identification', 'Risk factor breakdown', 'Benchmarking against peers']
    }
  ];

  const merchantFeatures = [
    {
      icon: CreditCard,
      title: 'Transaction Analytics',
      description: 'Comprehensive revenue and volume analysis with flexible date ranges (Day/Week/Month/Year). Understand your sales patterns and identify growth opportunities.',
      highlights: ['Revenue trend visualization', 'Transaction volume metrics', 'Average ticket size tracking', 'Card brand breakdown']
    },
    {
      icon: Package,
      title: 'AI Inventory Intelligence',
      description: 'Never run out of stock again. AI analyzes your transaction patterns to predict when items will run low and recommend optimal reorder timing.',
      highlights: ['Transaction-derived stock levels', 'Runout date predictions', 'Peak hour identification', 'Automated reorder alerts']
    },
    {
      icon: MessageSquare,
      title: 'AI Data Chat',
      description: 'Ask natural language questions about your business data. "How many medium coffees did I sell last Tuesday?" Get instant, accurate answers.',
      highlights: ['Natural language queries', 'Historical data analysis', 'Trend explanations', 'Forecast generation']
    },
    {
      icon: BarChart3,
      title: 'Live Volume Tracking',
      description: 'Real-time credit card processing metrics. Monitor today\'s sales, compare against targets, and track performance throughout the day.',
      highlights: ['Real-time transaction feed', 'Daily target tracking', 'Hour-by-hour breakdown', 'Processing method analysis']
    },
    {
      icon: Clock,
      title: 'Customer Insights',
      description: 'Understand who your customers are and when they shop. Identify your most valuable customers and optimize staffing for peak times.',
      highlights: ['Customer segmentation', 'Peak hour analysis', 'Repeat customer tracking', 'Purchase frequency patterns']
    },
    {
      icon: TrendingUp,
      title: 'Revenue Forecasting',
      description: 'AI-powered revenue predictions based on historical trends, seasonality, and growth patterns. Plan inventory and staffing with confidence.',
      highlights: ['7/30/90 day forecasts', 'Seasonal trend analysis', 'Growth rate calculations', 'Scenario modeling']
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Features Built for Results
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful tools for ISOs managing portfolios and merchants running operations.
            Every feature designed to turn data into action.
          </p>
        </div>
      </section>

      {/* ISO Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-full mb-4">
              <Briefcase className="w-4 h-4" />
              For ISOs & Processors
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Portfolio Intelligence Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage, grow, and protect your merchant portfolio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isoFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-gray-900 hover:shadow-lg transition-all">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Merchant Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 text-sm font-semibold rounded-full mb-4">
              <Package className="w-4 h-4" />
              For Merchants
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Operational Intelligence Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Turn your transaction data into insights that improve daily operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {merchantFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-gray-900 hover:shadow-lg transition-all">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-xl mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Seamless Integration, Zero Disruption
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Connect your existing payment processor in minutes. No code changes, no gateway switches,
              no merchant disruption. Just instant intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('trial')}
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors"
              >
                Use Auth Login
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white border-2 border-white hover:bg-white/10 rounded-lg transition-colors"
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities Highlight */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-xl mb-6 mx-auto">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Machine learning models trained on millions of transactions to deliver
              accurate predictions, early warnings, and actionable recommendations.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">98.5%</div>
                <div className="text-sm text-gray-600">Churn prediction accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">10+ hrs</div>
                <div className="text-sm text-gray-600">Saved per week on analysis</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">&lt;100ms</div>
                <div className="text-sm text-gray-600">Real-time data processing</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
