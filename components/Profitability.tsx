import React, { useMemo } from 'react';
import { BarChart2, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { StorageService } from '../services/storage';
import { Transaction } from '../types';

type MerchantProfitRow = {
  name: string;
  volume: number;
  transactions: number;
  avgTicket: number;
  estimatedMargin: number;
  trend: 'up' | 'down' | 'flat';
};

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const getMerchantRows = (transactions: Transaction[]): MerchantProfitRow[] => {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const merchant = transaction.customer || 'Imported Merchant';
    const current = grouped.get(merchant) || [];
    current.push(transaction);
    grouped.set(merchant, current);
  });

  return Array.from(grouped.entries())
    .map(([name, records]) => {
      const volume = records.reduce((sum, record) => sum + record.amount, 0);
      const transactionsCount = records.length;
      const avgTicket = transactionsCount > 0 ? volume / transactionsCount : 0;
      const estimatedMargin = volume * 0.018;

      const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const midpoint = Math.max(1, Math.floor(sorted.length / 2));
      const firstHalf = sorted.slice(0, midpoint).reduce((sum, record) => sum + record.amount, 0);
      const secondHalf = sorted.slice(midpoint).reduce((sum, record) => sum + record.amount, 0);
      const trend: MerchantProfitRow['trend'] = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'flat';

      return {
        name,
        volume,
        transactions: transactionsCount,
        avgTicket,
        estimatedMargin,
        trend
      };
    })
    .sort((a, b) => b.volume - a.volume);
};

const Profitability: React.FC = () => {
  const isDemoMode = StorageService.getDataMode() === 'demo';
  const transactions = useMemo(() => StorageService.getTransactions(), []);
  const merchantRows = useMemo(() => getMerchantRows(transactions), [transactions]);

  const totals = useMemo(() => {
    const totalVolume = merchantRows.reduce((sum, row) => sum + row.volume, 0);
    const totalMargin = merchantRows.reduce((sum, row) => sum + row.estimatedMargin, 0);
    const totalTransactions = merchantRows.reduce((sum, row) => sum + row.transactions, 0);
    return {
      totalVolume,
      totalMargin,
      totalTransactions,
      activeMerchants: merchantRows.length
    };
  }, [merchantRows]);

  if (!isDemoMode && merchantRows.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-indigo-600" />
            Profitability
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Merchant-centric profitability analytics based on imported or connected transaction data.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-8 text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-white">No merchant profitability data yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Auth/Trial mode does not use simulated records. Import transactions or connect live integrations to populate merchant profitability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-indigo-600" />
          Profitability
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Merchant-level volume, margin, and trend analysis.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border bg-indigo-600 border-indigo-700 text-white">
          <div className="flex items-center gap-2 mb-1 text-indigo-200">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Estimated Margin</span>
          </div>
          <p className="text-2xl font-bold font-mono">{formatCurrency(totals.totalMargin)}</p>
        </div>

        <div className="p-5 rounded-xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Transactions</span>
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{totals.totalTransactions.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Total Volume</span>
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{formatCurrency(totals.totalVolume)}</p>
        </div>

        <div className="p-5 rounded-xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
            <BarChart2 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Active Merchants</span>
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{totals.activeMerchants}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Top Merchant Volume</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={merchantRows.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Top Merchant Margin</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={merchantRows.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="estimatedMargin" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Merchant Profitability Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {['Merchant', 'Volume', 'Transactions', 'Avg Ticket', 'Est. Margin', 'Trend'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {merchantRows.map((row) => (
                <tr key={row.name} className="hover:bg-indigo-50/30 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(row.volume)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.transactions}</td>
                  <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(row.avgTicket)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-green-600 dark:text-green-400">{formatCurrency(row.estimatedMargin)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      row.trend === 'up'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : row.trend === 'down'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {row.trend === 'up' ? 'Up' : row.trend === 'down' ? 'Down' : 'Flat'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Profitability;
