import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Sparkles, TrendingUp, DollarSign, Activity, Award, X, RotateCw } from 'lucide-react';
import { streamDashboardInsights, explainDataPoint } from '../services/geminiService';
import { BusinessType, DailyMetric } from '../types';
import { StorageService } from '../services/storage';
import TodoList from './TodoList';

interface DashboardProps {
  businessType: BusinessType;
}

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ businessType }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('Last 7 Days');
  const [displayMetrics, setDisplayMetrics] = useState<DailyMetric[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [hasCredits, setHasCredits] = useState(true);
  const [explanation, setExplanation] = useState<{ point: any, text: string } | null>(null);

  const settings = StorageService.getSettings();

  // Memoize cache key components to ensure stability
  const cacheKey = useMemo(() =>
    `dashboard_insight_${businessType}_${timeRange}_${settings.aiResponseStyle}`,
    [businessType, timeRange, settings.aiResponseStyle]
  );

  const fetchInsights = useCallback(async (force: boolean = false) => {
    const allMetrics = StorageService.getMetrics();
    const transactions = StorageService.getTransactions();

    let filtered = [...allMetrics];
    if (timeRange === 'Last 30 Days') filtered = filtered.map(m => ({ ...m, revenue: m.revenue * 1.2 }));
    setDisplayMetrics(filtered);

    const catCounts: Record<string, number> = {};
    transactions.forEach(t => {
      const cat = t.category || 'Uncategorized';
      catCounts[cat] = (catCounts[cat] || 0) + t.amount;
    });
    setCategoryData(Object.keys(catCounts).map(k => ({ name: k, value: catCounts[k] })));

    // Check Cache
    const cached = StorageService.getCachedInsight(cacheKey);
    if (cached && !force) {
      setInsight(cached);
      setLoading(false);
      return;
    }

    // AI Analysis
    if (StorageService.hasCredits(1)) {
      setHasCredits(true);
      setLoading(true);
      setInsight('');
      StorageService.updateCredits(1, 'Dashboard Insights');
      let fullText = '';
      await streamDashboardInsights(filtered, businessType, timeRange, (text) => {
        fullText += text;
        setInsight(fullText);
      });
      const finalInsight = fullText.trim();
      if (finalInsight) {
        StorageService.setCachedInsight(cacheKey, finalInsight);
      }
      setLoading(false);
    } else {
      setHasCredits(false);
      setInsight("Insufficient credits.");
      setLoading(false);
    }
  }, [businessType, timeRange, cacheKey]); // Removed 'transactions' and 'settings' to prevent loop

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const onChartClick = async (point: any) => {
    if (!point || !point.activePayload) return;
    const data = point.activePayload[0].payload;
    setExplanation({ point: data, text: "Analyzing data point..." });
    const text = await explainDataPoint(data, businessType);
    setExplanation({ point: data, text });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {explanation && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 border border-primary-200 dark:border-primary-800 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-primary-600 uppercase">Analysis: {explanation.point.date}</h4>
            <button onClick={() => setExplanation(null)}><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{explanation.text}"</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{businessType} Intelligence Overview</p>
        </div>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2.5 outline-none">
          <option>Last 7 Days</option><option>Last 30 Days</option>
        </select>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-5 border border-primary-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-primary-900 dark:text-primary-200">Real-time Analysis</h3>
          </div>
          <button
            onClick={() => fetchInsights(true)}
            disabled={loading}
            className="p-1.5 hover:bg-white/50 dark:hover:bg-slate-700 rounded-lg text-primary-600 dark:text-primary-400 transition-colors disabled:opacity-50"
            title="Refresh AI Insights"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className={`text-lg leading-relaxed font-medium ${hasCredits ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
          {loading && !insight ? "One82 is thinking..." : insight}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <DollarSign className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Revenue</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">${displayMetrics.reduce((a, b) => a + b.revenue, 0).toLocaleString()}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <Activity className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Volume</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{displayMetrics.reduce((a, b) => a + b.transactions, 0)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Growth</p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">+14.2%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 h-96">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Revenue Activity <span className="text-[10px] bg-primary-100 text-primary-700 px-2 rounded">Interactive</span>
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={displayMetrics} onClick={onChartClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip cursor={{ stroke: 'rgb(var(--color-primary-600))', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="revenue" stroke="rgb(var(--color-primary-600))" fill="rgb(var(--color-primary-600))" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 h-[220px]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Expense Distribution</h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Smart To-Do List */}
          <TodoList role="merchant" className="h flex-1" />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;