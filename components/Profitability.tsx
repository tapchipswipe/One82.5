import React, { useEffect, useMemo, useState } from 'react';
import { BarChart2, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { StorageService } from '@/services/storage';
import { BuyRateProfile, Transaction } from '@/types';
import { SourceStatusText } from './ProvenanceIndicators';

const MIN_MARKUP_FLOOR_BPS = 22;

type MerchantProfitRow = {
  name: string;
  processorTarget: BuyRateProfile['processorTarget'];
  volume: number;
  transactions: number;
  avgTicket: number;
  buyRateBps: number;
  markupBps: number;
  serviceFeeMonthly: number;
  processorCost: number;
  estimatedRevenue: number;
  estimatedMargin: number;
  trend: 'up' | 'down' | 'flat';
};

type RepRollup = {
  repName: string;
  merchants: number;
  volume: number;
  processorCost: number;
  estimatedMargin: number;
};

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const normalizeName = (value: string): string => value.trim().toLowerCase();

const inferMerchantNameFromMerchantRow = (row: Record<string, string>): string => {
  const candidates = [row.merchantName, row.name, row.businessName, row.company, row.customer]
    .map((value) => (value || '').trim())
    .filter((value) => value.length > 0);
  return candidates[0] || '';
};

const inferRepNameFromMerchantRow = (row: Record<string, string>): string => {
  const candidates = [row.ownerRepName, row.repName, row.rep, row.owner, row.accountManager, row.assignedRep]
    .map((value) => (value || '').trim())
    .filter((value) => value.length > 0);
  return candidates[0] || '';
};

const getMerchantRows = (transactions: Transaction[], profiles: BuyRateProfile[]): MerchantProfitRow[] => {
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
      const profile = profiles.find((entry) => entry.merchantName === name);
      const buyRateBps = profile?.buyRateBps ?? 160;
      const markupBps = profile?.markupBps ?? 35;
      const serviceFeeMonthly = profile?.serviceFeeMonthly ?? 10;
      const processorTarget = profile?.processorTarget ?? 'stripe';
      const processorCost = volume * (buyRateBps / 10000) + serviceFeeMonthly;
      const estimatedRevenue = volume * ((buyRateBps + markupBps) / 10000) + serviceFeeMonthly;
      const estimatedMargin = estimatedRevenue - processorCost;

      const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const midpoint = Math.max(1, Math.floor(sorted.length / 2));

      let firstHalf = 0;
      let secondHalf = 0;
      for (let i = 0; i < sorted.length; i++) {
        if (i < midpoint) {
          firstHalf += sorted[i].amount;
        } else {
          secondHalf += sorted[i].amount;
        }
      }

      const trend: MerchantProfitRow['trend'] = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'flat';

      return {
        name,
        processorTarget,
        volume,
        transactions: transactionsCount,
        avgTicket,
        buyRateBps,
        markupBps,
        serviceFeeMonthly,
        processorCost,
        estimatedRevenue,
        estimatedMargin,
        trend
      };
    })
    .sort((a, b) => b.volume - a.volume);
};

const Profitability: React.FC = () => {
  const isDemoMode = StorageService.getDataMode() === 'demo';
  const [processorFilter, setProcessorFilter] = useState<'all' | BuyRateProfile['processorTarget']>('all');
  const [buyRateProfiles, setBuyRateProfiles] = useState<BuyRateProfile[]>(() => StorageService.getBuyRateProfiles());
  const [transactions, setTransactions] = useState(() => StorageService.getTransactions());
  const [importedMerchants, setImportedMerchants] = useState(() => StorageService.getImportedMerchants());
  const merchantRows = useMemo(() => getMerchantRows(transactions, buyRateProfiles), [transactions, buyRateProfiles]);
  const filteredRows = useMemo(() => {
    if (processorFilter === 'all') return merchantRows;
    return merchantRows.filter((row) => row.processorTarget === processorFilter);
  }, [merchantRows, processorFilter]);

  const repRollups = useMemo<RepRollup[]>(() => {
    const merchantToRep = new Map<string, string>();
    importedMerchants.forEach((row) => {
      const merchantName = inferMerchantNameFromMerchantRow(row);
      const repName = inferRepNameFromMerchantRow(row);
      if (!merchantName || !repName) return;
      merchantToRep.set(normalizeName(merchantName), repName);
    });

    const grouped = new Map<string, RepRollup>();
    filteredRows.forEach((row) => {
      const repName = merchantToRep.get(normalizeName(row.name)) || 'Unassigned Rep';
      const current = grouped.get(repName) || {
        repName,
        merchants: 0,
        volume: 0,
        processorCost: 0,
        estimatedMargin: 0
      };
      current.merchants += 1;
      current.volume += row.volume;
      current.processorCost += row.processorCost;
      current.estimatedMargin += row.estimatedMargin;
      grouped.set(repName, current);
    });

    return Array.from(grouped.values()).sort((left, right) => right.estimatedMargin - left.estimatedMargin);
  }, [filteredRows, importedMerchants]);

  const upsertProfile = (row: MerchantProfitRow, updates: Partial<Pick<MerchantProfitRow, 'buyRateBps' | 'markupBps' | 'serviceFeeMonthly' | 'processorTarget'>>) => {
    const nextMarkup = updates.markupBps ?? row.markupBps;
    const enforcedMarkup = Math.max(MIN_MARKUP_FLOOR_BPS, nextMarkup);
    StorageService.upsertBuyRateProfile({
      merchantName: row.name,
      processorTarget: updates.processorTarget || row.processorTarget,
      buyRateBps: updates.buyRateBps ?? row.buyRateBps,
      markupBps: enforcedMarkup,
      serviceFeeMonthly: updates.serviceFeeMonthly ?? row.serviceFeeMonthly
    });
    const latestProfiles = StorageService.getBuyRateProfiles();
    void StorageService.saveBuyRateProfilesResolved(latestProfiles);
    setBuyRateProfiles(latestProfiles);
  };

  useEffect(() => {
    void StorageService.getBuyRateProfilesResolved().then((profiles) => setBuyRateProfiles(profiles));
    void StorageService.getTransactionsResolved().then((txns) => setTransactions(txns));
    void StorageService.getImportedDataResolved().then(({ merchants }) => setImportedMerchants(merchants));
  }, []);

  const totals = useMemo(() => {
    const totalVolume = filteredRows.reduce((sum, row) => sum + row.volume, 0);
    const totalMargin = filteredRows.reduce((sum, row) => sum + row.estimatedMargin, 0);
    const totalProcessorCost = filteredRows.reduce((sum, row) => sum + row.processorCost, 0);
    const totalRevenue = filteredRows.reduce((sum, row) => sum + row.estimatedRevenue, 0);
    const totalTransactions = filteredRows.reduce((sum, row) => sum + row.transactions, 0);
    return {
      totalVolume,
      totalMargin,
      totalProcessorCost,
      totalRevenue,
      totalTransactions,
      activeMerchants: filteredRows.length
    };
  }, [filteredRows]);

  const profitabilityFreshness = useMemo(() => {
    if (isDemoMode) return 'Simulated freshness';
    const latest = transactions
      .map((transaction) => new Date(transaction.date).getTime())
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)[0] || null;
    if (!latest) return 'No recent trusted transaction data';
    const hours = Math.floor((Date.now() - latest) / 3600000);
    return hours >= 24 ? `Stale (${hours}h since latest transaction)` : `Fresh (${hours}h since latest transaction)`;
  }, [isDemoMode, transactions]);

  if (!isDemoMode && filteredRows.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-indigo-600" />
          Profitability
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Merchant-level buy-rate cost, markup, and margin analysis.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Markup floor enforced at {MIN_MARKUP_FLOOR_BPS} bps for v1 guardrails.</p>
        <SourceStatusText className="text-xs text-gray-500 dark:text-gray-400 mt-2" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Data freshness: {profitabilityFreshness}</p>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Processor</label>
          <select
            value={processorFilter}
            onChange={(event) => setProcessorFilter(event.target.value as 'all' | BuyRateProfile['processorTarget'])}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
          >
            <option value="all">All</option>
            <option value="stripe">Stripe</option>
            <option value="tsys">TSYS</option>
            <option value="fiserv">Fiserv</option>
            <option value="worldpay">Worldpay</option>
            <option value="global">Global Payments</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border bg-indigo-600 border-indigo-700 text-white">
          <div className="flex items-center gap-2 mb-1 text-indigo-200">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Net Margin (Markup)</span>
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
            <span className="text-xs uppercase tracking-wide font-medium">Processor Cost</span>
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{formatCurrency(totals.totalProcessorCost)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Estimated Revenue</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totals.totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Service Fee Model</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Default assumes monthly service fee pass-through; margin primarily comes from markup bps.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Portfolio Rollup</p>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Gross Volume</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totals.totalVolume)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Processor Cost</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totals.totalProcessorCost)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Net Margin</p>
            <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(totals.totalMargin)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Rep Margin Rollup</h3>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="py-2 pr-3 text-left font-semibold">Rep</th>
                <th className="py-2 pr-3 text-left font-semibold">Merchants</th>
                <th className="py-2 pr-3 text-left font-semibold">Volume</th>
                <th className="py-2 pr-3 text-left font-semibold">Processor Cost</th>
                <th className="py-2 text-left font-semibold">Est. Margin</th>
              </tr>
            </thead>
            <tbody>
              {repRollups.map((rollup) => (
                <tr key={rollup.repName} className="border-b border-gray-200/60 dark:border-gray-700/40">
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{rollup.repName}</td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{rollup.merchants}</td>
                  <td className="py-2 pr-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(rollup.volume)}</td>
                  <td className="py-2 pr-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(rollup.processorCost)}</td>
                  <td className="py-2 font-mono font-semibold text-green-600 dark:text-green-400">{formatCurrency(rollup.estimatedMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Top Merchant Volume</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filteredRows.slice(0, 8)}>
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
            <BarChart data={filteredRows.slice(0, 8)}>
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
                {['Merchant', 'Processor', 'Volume', 'Buy Rate', 'Markup', 'Service Fee', 'Proc. Cost', 'Est. Margin', 'Trend'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {filteredRows.map((row) => (
                <tr key={row.name} className="hover:bg-indigo-50/30 dark:hover:bg-gray-700/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.processorTarget}
                      onChange={(event) => upsertProfile(row, { processorTarget: event.target.value as BuyRateProfile['processorTarget'] })}
                      className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                    >
                      <option value="stripe">Stripe</option>
                      <option value="tsys">TSYS</option>
                      <option value="fiserv">Fiserv</option>
                      <option value="worldpay">Worldpay</option>
                      <option value="global">Global Payments</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(row.volume)}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.buyRateBps}
                      onChange={(event) => upsertProfile(row, { buyRateBps: Number(event.target.value || 0) })}
                      className="w-20 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                    />
                    <span className="ml-1 text-xs text-gray-500">bps</span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.markupBps}
                      onChange={(event) => upsertProfile(row, { markupBps: Number(event.target.value || 0) })}
                      min={MIN_MARKUP_FLOOR_BPS}
                      className="w-20 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                    />
                    <span className="ml-1 text-xs text-gray-500">bps</span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.serviceFeeMonthly}
                      onChange={(event) => upsertProfile(row, { serviceFeeMonthly: Number(event.target.value || 0) })}
                      className="w-20 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(row.processorCost)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-green-600 dark:text-green-400">{formatCurrency(row.estimatedMargin)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${row.trend === 'up'
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
