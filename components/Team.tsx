import React, { useMemo } from 'react';
import { Building2, Link2, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { generateSalesReps, SalesRep, SimulationService, PortfolioMerchant } from '../services/simulationService';
import { StorageService } from '../services/storage';

type RepAssignment = {
  rep: SalesRep;
  assignedMerchants: PortfolioMerchant[];
};

interface TeamProps {
  onNavigate?: (view: string) => void;
}

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const Team: React.FC<TeamProps> = ({ onNavigate }) => {
  const reps = useMemo(() => generateSalesReps(), []);
  const merchants = useMemo(() => StorageService.getDataMode() === 'demo' ? SimulationService.generatePortfolio() : [], []);

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
