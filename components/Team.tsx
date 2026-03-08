import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Calculator, CheckCircle2, Link2, TrendingDown, TrendingUp, Users, SlidersHorizontal, X } from 'lucide-react';
import { generateSalesReps, SalesRep, SimulationService, PortfolioMerchant } from '../services/simulationService';
import { StorageService } from '../services/storage';
import { CommissionLineItem, CommissionRun, Transaction } from '../types';

type RepAssignment = {
  rep: SalesRep;
  assignedMerchants: PortfolioMerchant[];
};

interface TeamProps {
  onNavigate?: (view: string) => void;
}

type CommissionRules = {
  baseRate: number;
  highVolumeThreshold: number;
  highVolumeRate: number;
  lowVolumeThreshold: number;
  lowVolumeRate: number;
  merchantOverrides: Record<string, number>;
};

const COMMISSION_RULES_KEY = 'one82_commission_rules';

const parseMerchantOverrides = (value: string): Record<string, number> => {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, line) => {
      const [merchant, rate] = line.split('=');
      if (!merchant || !rate) return acc;
      const parsedRate = Number(rate.trim());
      if (!Number.isFinite(parsedRate)) return acc;
      acc[merchant.trim().toLowerCase()] = Math.max(0, Math.min(100, parsedRate)) / 100;
      return acc;
    }, {});
};

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const buildPortfolioFromTransactions = (transactions: Transaction[]): PortfolioMerchant[] => {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const merchant = transaction.customer || 'Imported Merchant';
    const current = grouped.get(merchant) || [];
    current.push(transaction);
    grouped.set(merchant, current);
  });

  return Array.from(grouped.entries()).map(([name, records], index) => {
    const monthlyVolume = records.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
    const trend: PortfolioMerchant['trend'] = records.length > 1 && records[records.length - 1].amount >= records[0].amount ? 'up' : 'flat';

    return {
      id: `team_imported_${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      name,
      businessType: 'Service',
      monthlyVolume: Math.round(monthlyVolume),
      churnRisk: 'Low',
      trend,
      lastTransaction: Date.now(),
      bps: 35,
      perTxFee: 0.1,
      status: 'Active',
      mccCode: '0000',
      mccDescription: 'Imported Merchant',
      riskLevel: 'Low',
      volumeHistory: [monthlyVolume, monthlyVolume, monthlyVolume, monthlyVolume, monthlyVolume, monthlyVolume].map((value) => Math.round(value / 6)),
      ownerName: `${name} Owner`,
      email: `owner+${index}@imported.one82`,
      phone: '(000) 000-0000',
      address: 'Imported via CSV',
      since: new Date().toISOString().slice(0, 10),
      notes: [],
      healthScore: 75
    };
  });
};

const Team: React.FC<TeamProps> = ({ onNavigate }) => {
  const isDemoMode = StorageService.getDataMode() === 'demo';
  const [selectedPeriod, setSelectedPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [commissionRuns, setCommissionRuns] = useState<CommissionRun[]>(() => StorageService.getCommissionRuns());
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [commissionRules, setCommissionRules] = useState<CommissionRules>(() => {
    const userKey = StorageService.getUser()?.email || 'default';
    const raw = localStorage.getItem(COMMISSION_RULES_KEY);
    const allRules = raw ? (JSON.parse(raw) as Record<string, CommissionRules>) : {};
    return allRules[userKey] || {
      baseRate: 0.2,
      highVolumeThreshold: 100000,
      highVolumeRate: 0.24,
      lowVolumeThreshold: 10000,
      lowVolumeRate: 0.15,
      merchantOverrides: {}
    };
  });
  const [rulesDraft, setRulesDraft] = useState({
    baseRatePercent: '',
    highVolumeThreshold: '',
    highVolumeRatePercent: '',
    lowVolumeThreshold: '',
    lowVolumeRatePercent: '',
    merchantOverridesText: ''
  });

  const reps = useMemo(() => {
    if (isDemoMode) return generateSalesReps();

    const importedTeam = StorageService.getImportedTeam();
    const names = importedTeam
      .map((row) => (row.name || row.repName || row.rep || '').trim())
      .filter((name) => name.length > 0);

    if (names.length === 0) return generateSalesReps();

    return names.map((name, index) => ({
      id: `rep_imported_${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      name,
      merchantCount: 0,
      totalPortfolioVolume: 0,
      grossResidual: 0,
      supportCost: 0,
      netProfit: 0,
      subscriptionFee: 100,
      trend: 'flat' as const,
      volumeHistory: [0, 0, 0, 0, 0, 0],
      topMerchant: 'Imported Merchant'
    }));
  }, [isDemoMode]);

  const merchants = useMemo(() => {
    if (isDemoMode) return SimulationService.generatePortfolio();
    return buildPortfolioFromTransactions(StorageService.getTransactions());
  }, [isDemoMode]);

  useEffect(() => {
    const updateRuns = () => setCommissionRuns(StorageService.getCommissionRuns());
    window.addEventListener('user-update', updateRuns);
    void StorageService.getCommissionRunsResolved().then((runs) => setCommissionRuns(runs));
    return () => window.removeEventListener('user-update', updateRuns);
  }, []);

  const assignments = useMemo<RepAssignment[]>(() => {
    if (merchants.length === 0) {
      return reps.map((rep) => ({ rep, assignedMerchants: [] }));
    }

    return reps.map((rep, repIndex) => {
      const uniqueMerchants = new Map<string, PortfolioMerchant>();
      const topMerchant = merchants.find((merchant) => merchant.name === rep.topMerchant);

      if (topMerchant) {
        uniqueMerchants.set(topMerchant.id, topMerchant);
      }

      const additionalCount = (repIndex % 2) + 1;
      const startIndex = repIndex % merchants.length;
      let offset = 0;

      while (uniqueMerchants.size < additionalCount + (topMerchant ? 1 : 0) && offset < merchants.length * 2) {
        const merchant = merchants[(startIndex + offset) % merchants.length];
        uniqueMerchants.set(merchant.id, merchant);
        offset += 1;
      }

      return {
        rep,
        assignedMerchants: Array.from(uniqueMerchants.values()),
      };
    });
  }, [merchants, reps]);

  const summary = useMemo(() => {
    const allAssignedIds = assignments.flatMap(({ assignedMerchants }) => assignedMerchants.map((merchant) => merchant.id));
    return {
      activeReps: reps.length,
      merchantAssignments: allAssignedIds.length,
      trackedMerchants: new Set(allAssignedIds).size,
    };
  }, [assignments, reps.length]);

  const draftLineItems = useMemo<CommissionLineItem[]>(() => {
    return assignments.flatMap(({ rep, assignedMerchants }) => {
      if (assignedMerchants.length === 0) {
        return [{
          id: `${rep.id}_no_data`,
          repName: rep.name,
          merchantName: 'No assigned merchant data',
          volume: 0,
          residualRevenue: 0,
          commissionRate: commissionRules.baseRate,
          payout: 0,
          exception: 'Missing merchant assignment or transaction data'
        }];
      }

      return assignedMerchants.map((merchant) => {
        const volume = merchant.monthlyVolume;
        const residualRevenue = volume * 0.018;
        const merchantOverride = commissionRules.merchantOverrides[merchant.name.trim().toLowerCase()];
        const effectiveRate = Number.isFinite(merchantOverride)
          ? merchantOverride
          : volume >= commissionRules.highVolumeThreshold
            ? commissionRules.highVolumeRate
            : volume <= commissionRules.lowVolumeThreshold
              ? commissionRules.lowVolumeRate
              : commissionRules.baseRate;
        const payout = residualRevenue * effectiveRate;
        return {
          id: `${rep.id}_${merchant.id}`,
          repName: rep.name,
          merchantName: merchant.name,
          volume,
          residualRevenue,
          commissionRate: effectiveRate,
          payout,
          exception: volume <= 0 ? 'No volume for selected period' : undefined
        };
      });
    });
  }, [assignments, commissionRules]);

  const draftTotals = useMemo(() => {
    const totalPayout = draftLineItems.reduce((sum, lineItem) => sum + lineItem.payout, 0);
    const exceptions = draftLineItems.filter((lineItem) => Boolean(lineItem.exception)).length;
    return { totalPayout, exceptions, lineCount: draftLineItems.length };
  }, [draftLineItems]);

  const createCommissionRun = async (status: CommissionRun['status']) => {
    const now = Date.now();
    const run: CommissionRun = {
      id: `commission_run_${now}_${Math.random().toString(36).slice(2, 8)}`,
      period: selectedPeriod,
      status,
      createdAt: now,
      finalizedAt: status === 'finalized' ? now : undefined,
      totalPayout: draftTotals.totalPayout,
      lineItems: draftLineItems
    };

    StorageService.upsertCommissionRun(run);
    const latestRuns = StorageService.getCommissionRuns();
    await StorageService.saveCommissionRunsResolved(latestRuns);
    setCommissionRuns(StorageService.getCommissionRuns());
  };

  const openRulesModal = () => {
    const overridesText = Object.entries(commissionRules.merchantOverrides as Record<string, number>)
      .map(([merchant, rate]) => `${merchant}=${Math.round(rate * 100)}`)
      .join('\n');

    setRulesDraft({
      baseRatePercent: String(Math.round(commissionRules.baseRate * 100)),
      highVolumeThreshold: String(commissionRules.highVolumeThreshold),
      highVolumeRatePercent: String(Math.round(commissionRules.highVolumeRate * 100)),
      lowVolumeThreshold: String(commissionRules.lowVolumeThreshold),
      lowVolumeRatePercent: String(Math.round(commissionRules.lowVolumeRate * 100)),
      merchantOverridesText: overridesText
    });
    setShowRulesModal(true);
  };

  const saveRules = () => {
    const nextRules: CommissionRules = {
      baseRate: Math.max(0, Math.min(1, Number(rulesDraft.baseRatePercent || '20') / 100)),
      highVolumeThreshold: Math.max(0, Number(rulesDraft.highVolumeThreshold || '0')),
      highVolumeRate: Math.max(0, Math.min(1, Number(rulesDraft.highVolumeRatePercent || '24') / 100)),
      lowVolumeThreshold: Math.max(0, Number(rulesDraft.lowVolumeThreshold || '0')),
      lowVolumeRate: Math.max(0, Math.min(1, Number(rulesDraft.lowVolumeRatePercent || '15') / 100)),
      merchantOverrides: parseMerchantOverrides(rulesDraft.merchantOverridesText)
    };

    setCommissionRules(nextRules);
    const userKey = StorageService.getUser()?.email || 'default';
    const raw = localStorage.getItem(COMMISSION_RULES_KEY);
    const allRules = raw ? (JSON.parse(raw) as Record<string, CommissionRules>) : {};
    allRules[userKey] = nextRules;
    localStorage.setItem(COMMISSION_RULES_KEY, JSON.stringify(allRules));
    setShowRulesModal(false);
  };

  const trendBadge = (trend: SalesRep['trend']) => {
    if (trend === 'up') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
          <TrendingUp className="h-3.5 w-3.5" /> Up
        </span>
      );
    }

    if (trend === 'down') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
          <TrendingDown className="h-3.5 w-3.5" /> Down
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
        <span className="h-2 w-2 rounded-full bg-gray-400" /> Flat
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Commission Rules</h3>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">
                Base Commission %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesDraft.baseRatePercent}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, baseRatePercent: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                High-Volume Threshold ($)
                <input
                  type="number"
                  min={0}
                  value={rulesDraft.highVolumeThreshold}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, highVolumeThreshold: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                High-Volume Commission %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesDraft.highVolumeRatePercent}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, highVolumeRatePercent: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                Low-Volume Threshold ($)
                <input
                  type="number"
                  min={0}
                  value={rulesDraft.lowVolumeThreshold}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, lowVolumeThreshold: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600 md:col-span-2">
                Low-Volume Commission %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesDraft.lowVolumeRatePercent}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, lowVolumeRatePercent: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>

              <label className="text-xs text-gray-600 md:col-span-2">
                Merchant Overrides (one per line: merchant=rate%)
                <textarea
                  rows={5}
                  value={rulesDraft.merchantOverridesText}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, merchantOverridesText: event.target.value }))}
                  placeholder="alpha grocery=30\ncity salon=18"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRules}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="mt-1 text-sm text-gray-500">
          ISO-only view of sales reps and the merchants currently assigned to each portfolio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Active Reps</p>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.activeReps}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Merchant Assignments</p>
            <Link2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.merchantAssignments}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Tracked Merchants</p>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{summary.trackedMerchants}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Calculator className="w-4 h-4 text-indigo-600" /> Commission Automation</h2>
            <p className="text-xs text-gray-500 mt-1">Generate monthly rep payouts from portfolio residual inputs with line-item traceability and exception flags.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
            <span className="text-xs text-gray-600">Base rate: {Math.round(commissionRules.baseRate * 100)}%</span>
            <button
              type="button"
              onClick={openRulesModal}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Set Rules
            </button>
            <button
              type="button"
              onClick={() => { void createCommissionRun('draft'); }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Save Draft Run
            </button>
            <button
              type="button"
              onClick={() => { void createCommissionRun('finalized'); }}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              Finalize Run
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Draft Line Items</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{draftTotals.lineCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Draft Total Payout</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(draftTotals.totalPayout)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Exceptions</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{draftTotals.exceptions}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                {['Rep', 'Merchant', 'Volume', 'Residual', 'Rate', 'Payout', 'Exception'].map((header) => (
                  <th key={header} className="px-3 py-2 text-xs uppercase tracking-wide text-gray-500 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {draftLineItems.slice(0, 14).map((lineItem) => (
                <tr key={lineItem.id}>
                  <td className="px-3 py-2 text-gray-800">{lineItem.repName}</td>
                  <td className="px-3 py-2 text-gray-800">{lineItem.merchantName}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{formatCurrency(lineItem.volume)}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">{formatCurrency(lineItem.residualRevenue)}</td>
                  <td className="px-3 py-2 text-gray-700">{Math.round(lineItem.commissionRate * 100)}%</td>
                  <td className="px-3 py-2 font-mono font-semibold text-indigo-700">{formatCurrency(lineItem.payout)}</td>
                  <td className="px-3 py-2 text-xs text-amber-600">{lineItem.exception || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Recent Commission Runs</h3>
          <div className="mt-2 space-y-2">
            {commissionRuns.slice(0, 6).map((run) => (
              <div key={run.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs border border-gray-200 bg-white rounded-lg px-3 py-2">
                <span className="text-gray-700">{run.period} · {run.lineItems.length} items · {run.status}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(run.totalPayout)}</span>
              </div>
            ))}
            {commissionRuns.length === 0 && <p className="text-xs text-gray-500">No runs yet. Save draft or finalize the first monthly run.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Rep Assignments</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {assignments.map(({ rep, assignedMerchants }) => (
            <div key={rep.id} className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{rep.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Portfolio Volume {formatCurrency(rep.totalPortfolioVolume)} · Net Profit {formatCurrency(rep.netProfit)}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => onNavigate?.('profitability')}
                    className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View Merchant Profitability
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('portfolio')}
                    className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View Merchants
                  </button>
                  {trendBadge(rep.trend)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {assignedMerchants.map((merchant) => (
                  <article key={`${rep.id}_${merchant.id}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1.5">
                    <p className="font-semibold text-gray-900">{merchant.name}</p>
                    <p className="text-xs text-gray-600">{merchant.businessType}</p>
                    <p className="text-xs text-gray-700">Monthly Volume: {formatCurrency(merchant.monthlyVolume)}</p>
                    <p className="text-xs text-gray-700">Churn Risk: {merchant.churnRisk}</p>
                    <p className="text-xs text-gray-700">Status: {merchant.status}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
