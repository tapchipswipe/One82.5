import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Calculator, CheckCircle2, Link2, TrendingDown, TrendingUp, Users, SlidersHorizontal, X } from 'lucide-react';
import { generateSalesReps, SalesRep, SimulationService, PortfolioMerchant } from '@/services/simulationService';
import { StorageService } from '@/services/storage';
import { BuyRateProfile, CommissionLineItem, CommissionRun, Transaction } from '@/types';

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
  repOverrides: Record<string, number>;
  dealOverrides: Record<string, number>;
  excessMarkupThresholdBps: number;
  excessMarkupShare: number;
  excessServiceFeeThreshold: number;
  excessServiceFeeShare: number;
};

const COMMISSION_RULES_KEY = 'one82_commission_rules';

const clampPercentToDecimal = (value: number, fallback = 0): number => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
};

const parsePercentOverrides = (
  value: string,
  mapKey: (rawKey: string) => string
): Record<string, number> => {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, line) => {
      const [rawKey, rawRate] = line.split('=');
      if (!rawKey || !rawRate) return acc;
      const parsedRate = Number(rawRate.trim());
      if (!Number.isFinite(parsedRate)) return acc;
      const nextKey = mapKey(rawKey.trim());
      if (!nextKey) return acc;
      acc[nextKey] = clampPercentToDecimal(parsedRate / 100);
      return acc;
    }, {});
};

const parseMerchantOverrides = (value: string): Record<string, number> =>
  parsePercentOverrides(value, (key) => normalizeName(key));

const parseRepOverrides = (value: string): Record<string, number> =>
  parsePercentOverrides(value, (key) => normalizeName(key));

const parseDealOverrides = (value: string): Record<string, number> =>
  parsePercentOverrides(value, (key) => {
    const [repName, merchantName] = key.split('|').map((part) => normalizeName(part || ''));
    if (!repName || !merchantName) return '';
    return `${repName}|${merchantName}`;
  });

const DEFAULT_COMMISSION_RULES: CommissionRules = {
  baseRate: 0.2,
  highVolumeThreshold: 100000,
  highVolumeRate: 0.24,
  lowVolumeThreshold: 10000,
  lowVolumeRate: 0.15,
  merchantOverrides: {},
  repOverrides: {},
  dealOverrides: {},
  excessMarkupThresholdBps: 35,
  excessMarkupShare: 0.5,
  excessServiceFeeThreshold: 10,
  excessServiceFeeShare: 0.5
};

const normalizeCommissionRules = (input?: Partial<CommissionRules>): CommissionRules => {
  const source = input || {};
  return {
    baseRate: clampPercentToDecimal(source.baseRate ?? DEFAULT_COMMISSION_RULES.baseRate, DEFAULT_COMMISSION_RULES.baseRate),
    highVolumeThreshold: Math.max(0, Number(source.highVolumeThreshold ?? DEFAULT_COMMISSION_RULES.highVolumeThreshold)),
    highVolumeRate: clampPercentToDecimal(source.highVolumeRate ?? DEFAULT_COMMISSION_RULES.highVolumeRate, DEFAULT_COMMISSION_RULES.highVolumeRate),
    lowVolumeThreshold: Math.max(0, Number(source.lowVolumeThreshold ?? DEFAULT_COMMISSION_RULES.lowVolumeThreshold)),
    lowVolumeRate: clampPercentToDecimal(source.lowVolumeRate ?? DEFAULT_COMMISSION_RULES.lowVolumeRate, DEFAULT_COMMISSION_RULES.lowVolumeRate),
    merchantOverrides: source.merchantOverrides || {},
    repOverrides: source.repOverrides || {},
    dealOverrides: source.dealOverrides || {},
    excessMarkupThresholdBps: Math.max(0, Number(source.excessMarkupThresholdBps ?? DEFAULT_COMMISSION_RULES.excessMarkupThresholdBps)),
    excessMarkupShare: clampPercentToDecimal(source.excessMarkupShare ?? DEFAULT_COMMISSION_RULES.excessMarkupShare, DEFAULT_COMMISSION_RULES.excessMarkupShare),
    excessServiceFeeThreshold: Math.max(0, Number(source.excessServiceFeeThreshold ?? DEFAULT_COMMISSION_RULES.excessServiceFeeThreshold)),
    excessServiceFeeShare: clampPercentToDecimal(source.excessServiceFeeShare ?? DEFAULT_COMMISSION_RULES.excessServiceFeeShare, DEFAULT_COMMISSION_RULES.excessServiceFeeShare)
  };
};

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const normalizeName = (value: string): string => value.trim().toLowerCase();

const csvEscape = (value: unknown): string => {
  const raw = value === null || value === undefined ? '' : String(value);
  const needsQuotes = /[",\n\r]/.test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const toCsv = (headers: string[], rows: Array<Record<string, unknown>>): string => {
  const lines: string[] = [];
  lines.push(headers.map((h) => csvEscape(h)).join(','));
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
};

const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const inferRepNameFromTeamRow = (row: Record<string, string>): string => {
  const candidates = [row.name, row.repName, row.rep, row.owner, row.ownerRepName, row.fullName]
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

const inferMerchantNameFromMerchantRow = (row: Record<string, string>): string => {
  const candidates = [row.merchantName, row.name, row.businessName, row.company, row.customer]
    .map((value) => (value || '').trim())
    .filter((value) => value.length > 0);
  return candidates[0] || '';
};

const stableHash = (value: string): number => {
  const normalized = normalizeName(value);
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
};

const buildPortfolioFromTransactions = (transactions: Transaction[]): PortfolioMerchant[] => {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const merchant = transaction.customer || 'Imported Merchant';
    const current = grouped.get(merchant) || [];
    current.push(transaction);
    grouped.set(merchant, current);
  });

  return Array.from(grouped.entries()).map(([name, records], index) => {
    // ⚡ Bolt: Consolidated chained map/reduce operations into a single for loop. Impact: Reduces redundant array allocations and simplifies single-pass accumulation.
    let monthlyVolume = 0;
    for (let i = 0; i < records.length; i++) {
      monthlyVolume += (Number(records[i].amount) || 0);
    }
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
  const [isPayoutWizardOpen, setIsPayoutWizardOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [commissionRuns, setCommissionRuns] = useState<CommissionRun[]>(() => StorageService.getCommissionRuns());
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>(() => StorageService.getTransactions());
  const [buyRateProfiles, setBuyRateProfiles] = useState<BuyRateProfile[]>(() => StorageService.getBuyRateProfiles());
  const [importedMerchants, setImportedMerchants] = useState<Array<Record<string, string>>>(() => StorageService.getImportedMerchants());
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [commissionRules, setCommissionRules] = useState<CommissionRules>(() => {
    const userKey = StorageService.getUser()?.email || 'default';
    const raw = localStorage.getItem(COMMISSION_RULES_KEY);
    const allRules = raw ? (JSON.parse(raw) as Record<string, CommissionRules>) : {};
    return normalizeCommissionRules(allRules[userKey]);
  });
  const [rulesDraft, setRulesDraft] = useState({
    baseRatePercent: '',
    highVolumeThreshold: '',
    highVolumeRatePercent: '',
    lowVolumeThreshold: '',
    lowVolumeRatePercent: '',
    merchantOverridesText: '',
    repOverridesText: '',
    dealOverridesText: '',
    excessMarkupThresholdBps: '',
    excessMarkupSharePercent: '',
    excessServiceFeeThreshold: '',
    excessServiceFeeSharePercent: ''
  });
  const [repMerchantSearch, setRepMerchantSearch] = useState<Record<string, string>>({});
  const [expandedRepIds, setExpandedRepIds] = useState<Set<string>>(new Set());

  const reps = useMemo(() => {
    if (isDemoMode) return generateSalesReps();

    const importedTeam = StorageService.getImportedTeam();
    const names = importedTeam
      .map((row) => inferRepNameFromTeamRow(row))
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
    return buildPortfolioFromTransactions(transactions);
  }, [isDemoMode, transactions]);

  const merchantRepMap = useMemo(() => {
    const map = new Map<string, string>();
    importedMerchants.forEach((row) => {
      const merchantName = inferMerchantNameFromMerchantRow(row);
      const repName = inferRepNameFromMerchantRow(row);
      if (!merchantName || !repName) return;
      map.set(normalizeName(merchantName), repName);
    });
    return map;
  }, [importedMerchants]);

  useEffect(() => {
    const updateRuns = () => {
      setCommissionRuns(StorageService.getCommissionRuns());
      setTransactions(StorageService.getTransactions());
      setBuyRateProfiles(StorageService.getBuyRateProfiles());
      setImportedMerchants(StorageService.getImportedMerchants());
    };
    window.addEventListener('user-update', updateRuns);
    void StorageService.getCommissionRunsResolved().then((runs) => setCommissionRuns(runs));
    void StorageService.getTransactionsResolved().then((rows) => setTransactions(rows));
    void StorageService.getBuyRateProfilesResolved().then((profiles) => setBuyRateProfiles(profiles));
    void StorageService.getImportedDataResolved().then((payload) => setImportedMerchants(payload.merchants));
    return () => window.removeEventListener('user-update', updateRuns);
  }, []);

  useEffect(() => {
    if (selectedRunId && commissionRuns.some((run) => run.id === selectedRunId)) return;
    setSelectedRunId(commissionRuns[0]?.id || '');
  }, [commissionRuns, selectedRunId]);

  const assignments = useMemo<RepAssignment[]>(() => {
    if (merchants.length === 0) {
      return reps.map((rep) => ({ rep, assignedMerchants: [] }));
    }

    const repNames = reps.map((rep) => rep.name);
    const groupedByRep = new Map<string, PortfolioMerchant[]>();
    repNames.forEach((name) => groupedByRep.set(name, []));

    merchants.forEach((merchant) => {
      const mappedRep = merchantRepMap.get(normalizeName(merchant.name));
      const fallbackRep = repNames.length > 0 ? repNames[stableHash(merchant.name) % repNames.length] : undefined;
      const targetRep = mappedRep || fallbackRep;
      if (!targetRep) return;
      const current = groupedByRep.get(targetRep) || [];
      current.push(merchant);
      groupedByRep.set(targetRep, current);
    });

    return reps.map((rep) => ({
      rep,
      assignedMerchants: (groupedByRep.get(rep.name) || []).sort((left, right) => right.monthlyVolume - left.monthlyVolume)
    }));
  }, [merchantRepMap, merchants, reps]);

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
        const profile = buyRateProfiles.find((entry) => normalizeName(entry.merchantName) === normalizeName(merchant.name));
        const markupBps = profile?.markupBps ?? 35;
        const serviceFeeMonthly = profile?.serviceFeeMonthly ?? 10;
        const residualRevenue = volume * (markupBps / 10000) + serviceFeeMonthly;

        const repKey = normalizeName(rep.name);
        const merchantKey = normalizeName(merchant.name);
        const dealKey = `${repKey}|${merchantKey}`;

        const merchantOverride = commissionRules.merchantOverrides[merchantKey];
        const repOverride = commissionRules.repOverrides[repKey];
        const dealOverride = commissionRules.dealOverrides[dealKey];

        const thresholdRate = volume >= commissionRules.highVolumeThreshold
          ? commissionRules.highVolumeRate
          : volume <= commissionRules.lowVolumeThreshold
            ? commissionRules.lowVolumeRate
            : commissionRules.baseRate;

        const baseRate = Number.isFinite(dealOverride)
          ? dealOverride
          : Number.isFinite(repOverride)
            ? repOverride
            : Number.isFinite(merchantOverride)
              ? merchantOverride
              : thresholdRate;

        const appliedRule = Number.isFinite(dealOverride)
          ? 'Deal Override'
          : Number.isFinite(repOverride)
            ? 'Rep Override'
            : Number.isFinite(merchantOverride)
              ? 'Merchant Override'
              : volume >= commissionRules.highVolumeThreshold
                ? 'High Volume Tier'
                : volume <= commissionRules.lowVolumeThreshold
                  ? 'Low Volume Tier'
                  : 'Base Tier';

        const excessMarkupRevenue = volume * (Math.max(0, markupBps - commissionRules.excessMarkupThresholdBps) / 10000);
        const excessServiceFeeRevenue = Math.max(0, serviceFeeMonthly - commissionRules.excessServiceFeeThreshold);
        const basePayout = residualRevenue * baseRate;
        const excessPayout =
          excessMarkupRevenue * commissionRules.excessMarkupShare +
          excessServiceFeeRevenue * commissionRules.excessServiceFeeShare;
        const payout = basePayout + excessPayout;

        return {
          id: `${rep.id}_${merchant.id}`,
          repName: rep.name,
          merchantName: merchant.name,
          volume,
          residualRevenue,
          commissionRate: baseRate,
          payout,
          basePayout,
          excessPayout,
          excessMarkupRevenue,
          excessServiceFeeRevenue,
          appliedRule,
          exception: volume <= 0
            ? 'No volume for selected period'
            : profile
              ? undefined
              : 'Using default buy-rate assumptions'
        };
      });
    });
  }, [assignments, buyRateProfiles, commissionRules]);

  const draftTotals = useMemo(() => {
    const totalPayout = draftLineItems.reduce((sum, lineItem) => sum + lineItem.payout, 0);
    const exceptions = draftLineItems.filter((lineItem) => Boolean(lineItem.exception)).length;
    return { totalPayout, exceptions, lineCount: draftLineItems.length };
  }, [draftLineItems]);

  const repRollups = useMemo(() => {
    const grouped = new Map<string, { volume: number; residual: number; payout: number; basePayout: number; excessPayout: number; lineCount: number; exceptions: number }>();
    draftLineItems.forEach((lineItem) => {
      const current = grouped.get(lineItem.repName) || { volume: 0, residual: 0, payout: 0, basePayout: 0, excessPayout: 0, lineCount: 0, exceptions: 0 };
      current.volume += lineItem.volume;
      current.residual += lineItem.residualRevenue;
      current.payout += lineItem.payout;
      current.basePayout += lineItem.basePayout || lineItem.payout;
      current.excessPayout += lineItem.excessPayout || 0;
      current.lineCount += 1;
      if (lineItem.exception) current.exceptions += 1;
      grouped.set(lineItem.repName, current);
    });

    return Array.from(grouped.entries())
      .map(([repName, values]) => ({ repName, ...values }))
      .sort((left, right) => right.payout - left.payout);
  }, [draftLineItems]);

  const selectedRun = useMemo(() => {
    if (!selectedRunId) return null;
    return commissionRuns.find((run) => run.id === selectedRunId) || null;
  }, [commissionRuns, selectedRunId]);

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
    setSelectedRunId(run.id);
  };

  const exportSelectedRunLineItemsCsv = () => {
    if (!selectedRun) return;
    const headers = [
      'period',
      'runId',
      'status',
      'repName',
      'merchantName',
      'volume',
      'residualRevenue',
      'commissionRate',
      'basePayout',
      'excessPayout',
      'payout',
      'appliedRule',
      'exception'
    ];
    const rows = selectedRun.lineItems.map((line) => ({
      period: selectedRun.period,
      runId: selectedRun.id,
      status: selectedRun.status,
      repName: line.repName,
      merchantName: line.merchantName,
      volume: line.volume,
      residualRevenue: line.residualRevenue,
      commissionRate: line.commissionRate,
      basePayout: line.basePayout ?? '',
      excessPayout: line.excessPayout ?? '',
      payout: line.payout,
      appliedRule: line.appliedRule ?? '',
      exception: line.exception ?? ''
    }));
    const csv = toCsv(headers, rows);
    downloadCsv(`commission-line-items_${selectedRun.period}_${selectedRun.status}.csv`, csv);
  };

  const exportSelectedRunRepRollupsCsv = () => {
    if (!selectedRun) return;
    const repMap = new Map<string, { volume: number; residual: number; payout: number; basePayout: number; excessPayout: number; lineCount: number; exceptions: number }>();
    selectedRun.lineItems.forEach((line) => {
      const current = repMap.get(line.repName) || { volume: 0, residual: 0, payout: 0, basePayout: 0, excessPayout: 0, lineCount: 0, exceptions: 0 };
      current.volume += Number(line.volume) || 0;
      current.residual += Number(line.residualRevenue) || 0;
      current.payout += Number(line.payout) || 0;
      current.basePayout += Number(line.basePayout ?? line.payout) || 0;
      current.excessPayout += Number(line.excessPayout ?? 0) || 0;
      current.lineCount += 1;
      if (line.exception) current.exceptions += 1;
      repMap.set(line.repName, current);
    });

    const headers = [
      'period',
      'runId',
      'status',
      'repName',
      'volume',
      'residualBase',
      'basePayout',
      'excessPayout',
      'payout',
      'lineCount',
      'exceptions'
    ];
    const rows = Array.from(repMap.entries())
      .map(([repName, totals]) => ({
        period: selectedRun.period,
        runId: selectedRun.id,
        status: selectedRun.status,
        repName,
        volume: totals.volume,
        residualBase: totals.residual,
        basePayout: totals.basePayout,
        excessPayout: totals.excessPayout,
        payout: totals.payout,
        lineCount: totals.lineCount,
        exceptions: totals.exceptions
      }))
      .sort((a, b) => Number(b.payout) - Number(a.payout));

    const csv = toCsv(headers, rows);
    downloadCsv(`commission-rep-rollups_${selectedRun.period}_${selectedRun.status}.csv`, csv);
  };

  const openRulesModal = () => {
    const merchantOverridesText = Object.entries(commissionRules.merchantOverrides as Record<string, number>)
      .map(([merchant, rate]) => `${merchant}=${Math.round(rate * 100)}`)
      .join('\n');
    const repOverridesText = Object.entries(commissionRules.repOverrides as Record<string, number>)
      .map(([repName, rate]) => `${repName}=${Math.round(rate * 100)}`)
      .join('\n');
    const dealOverridesText = Object.entries(commissionRules.dealOverrides as Record<string, number>)
      .map(([dealKey, rate]) => `${dealKey}=${Math.round(rate * 100)}`)
      .join('\n');

    setRulesDraft({
      baseRatePercent: String(Math.round(commissionRules.baseRate * 100)),
      highVolumeThreshold: String(commissionRules.highVolumeThreshold),
      highVolumeRatePercent: String(Math.round(commissionRules.highVolumeRate * 100)),
      lowVolumeThreshold: String(commissionRules.lowVolumeThreshold),
      lowVolumeRatePercent: String(Math.round(commissionRules.lowVolumeRate * 100)),
      merchantOverridesText,
      repOverridesText,
      dealOverridesText,
      excessMarkupThresholdBps: String(commissionRules.excessMarkupThresholdBps),
      excessMarkupSharePercent: String(Math.round(commissionRules.excessMarkupShare * 100)),
      excessServiceFeeThreshold: String(commissionRules.excessServiceFeeThreshold),
      excessServiceFeeSharePercent: String(Math.round(commissionRules.excessServiceFeeShare * 100))
    });
    setShowRulesModal(true);
  };

  const saveRules = () => {
    const nextRules = normalizeCommissionRules({
      baseRate: Number(rulesDraft.baseRatePercent || '20') / 100,
      highVolumeThreshold: Number(rulesDraft.highVolumeThreshold || '0'),
      highVolumeRate: Number(rulesDraft.highVolumeRatePercent || '24') / 100,
      lowVolumeThreshold: Number(rulesDraft.lowVolumeThreshold || '0'),
      lowVolumeRate: Number(rulesDraft.lowVolumeRatePercent || '15') / 100,
      merchantOverrides: parseMerchantOverrides(rulesDraft.merchantOverridesText),
      repOverrides: parseRepOverrides(rulesDraft.repOverridesText),
      dealOverrides: parseDealOverrides(rulesDraft.dealOverridesText),
      excessMarkupThresholdBps: Number(rulesDraft.excessMarkupThresholdBps || '35'),
      excessMarkupShare: Number(rulesDraft.excessMarkupSharePercent || '50') / 100,
      excessServiceFeeThreshold: Number(rulesDraft.excessServiceFeeThreshold || '10'),
      excessServiceFeeShare: Number(rulesDraft.excessServiceFeeSharePercent || '50') / 100
    });

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
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
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

            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-800">Rule precedence</p>
              <p className="mt-1">Deal override → Rep override → Merchant override → Volume tier. Excess payout is added on top of base payout.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-xs text-gray-600">
                Default Base Commission %
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
                High-Volume Threshold ($ / month)
                <input
                  type="number"
                  min={0}
                  value={rulesDraft.highVolumeThreshold}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, highVolumeThreshold: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600">
                High-Volume Base %
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
                Low-Volume Threshold ($ / month)
                <input
                  type="number"
                  min={0}
                  value={rulesDraft.lowVolumeThreshold}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, lowVolumeThreshold: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>
              <label className="text-xs text-gray-600 md:col-span-2">
                Low-Volume Base %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesDraft.lowVolumeRatePercent}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, lowVolumeRatePercent: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>

              <div className="md:col-span-2 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Overrides</p>
              </div>

              <label className="text-xs text-gray-600 md:col-span-2">
                Merchant Overrides (one per line: merchant=base%)
                <textarea
                  rows={4}
                  value={rulesDraft.merchantOverridesText}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, merchantOverridesText: event.target.value }))}
                  placeholder="Northside Market=30\nCity Salon=18"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>

              <label className="text-xs text-gray-600 md:col-span-2">
                Rep Overrides (one per line: rep=base%)
                <textarea
                  rows={3}
                  value={rulesDraft.repOverridesText}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, repOverridesText: event.target.value }))}
                  placeholder="Alex Torres=32\nJordan Lee=28"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>

              <label className="text-xs text-gray-600 md:col-span-2">
                Deal Overrides (one per line: rep|merchant=base%)
                <textarea
                  rows={3}
                  value={rulesDraft.dealOverridesText}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, dealOverridesText: event.target.value }))}
                  placeholder="Alex Torres|Northside Market=35"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
                <p className="mt-1 text-[11px] text-gray-500">Use exact names from Team and Merchant List for best matching.</p>
              </label>

              <div className="md:col-span-2 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Excess Fee Split</p>
              </div>

              <label className="text-xs text-gray-600">
                Excess Markup Threshold (bps)
                <input
                  type="number"
                  min={0}
                  value={rulesDraft.excessMarkupThresholdBps}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, excessMarkupThresholdBps: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>

              <label className="text-xs text-gray-600">
                Excess Markup Rep Share %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesDraft.excessMarkupSharePercent}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, excessMarkupSharePercent: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>

              <label className="text-xs text-gray-600">
                Excess Service Fee Threshold ($)
                <input
                  type="number"
                  min={0}
                  value={rulesDraft.excessServiceFeeThreshold}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, excessServiceFeeThreshold: event.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </label>

              <label className="text-xs text-gray-600">
                Excess Service Fee Rep Share %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesDraft.excessServiceFeeSharePercent}
                  onChange={(event) => setRulesDraft((current) => ({ ...current, excessServiceFeeSharePercent: event.target.value }))}
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
                Apply Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {isPayoutWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[88vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payout Wizard</p>
                <h2 className="text-lg font-bold text-gray-900">Commission Automation</h2>
                <p className="text-xs text-gray-500 mt-1">Step through rules → preview → save run → export CSV.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutWizardOpen(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Period</p>
                  <p className="text-xs text-gray-600 mt-1">Base rate: {Math.round(commissionRules.baseRate * 100)}% · Excess share: {Math.round(commissionRules.excessMarkupShare * 100)}% markup / {Math.round(commissionRules.excessServiceFeeShare * 100)}% fee</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="month"
                    value={selectedPeriod}
                    onChange={(event) => setSelectedPeriod(event.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
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

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Export</p>
                <p className="mt-1 text-xs text-gray-600">
                  Exports are generated from a <span className="font-semibold">saved run</span> (draft or finalized) to prevent payout mismatches.
                </p>
                <div className="mt-3 flex flex-col lg:flex-row lg:items-center gap-2">
                  <select
                    value={selectedRunId}
                    onChange={(event) => setSelectedRunId(event.target.value)}
                    className="w-full lg:max-w-md px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    {commissionRuns.length === 0 && <option value="">No saved runs yet</option>}
                    {commissionRuns.map((run) => (
                      <option key={run.id} value={run.id}>
                        {run.period} · {run.status} · {run.lineItems.length} items · {formatCurrency(run.totalPayout)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={exportSelectedRunLineItemsCsv}
                    disabled={!selectedRun}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-40"
                  >
                    Export line items CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportSelectedRunRepRollupsCsv}
                    disabled={!selectedRun}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-40"
                  >
                    Export rep rollups CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Draft Line Items</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{draftTotals.lineCount}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Draft Total Payout</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(draftTotals.totalPayout)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Exceptions</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{draftTotals.exceptions}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[980px] text-sm text-left bg-white">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Rep', 'Merchant', 'Volume', 'Residual', 'Rate', 'Model', 'Payout', 'Exception'].map((header) => (
                        <th key={header} className="px-3 py-2 text-xs uppercase tracking-wide text-gray-500 font-semibold whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {draftLineItems.slice(0, 18).map((lineItem) => (
                      <tr key={lineItem.id}>
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{lineItem.repName}</td>
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{lineItem.merchantName}</td>
                        <td className="px-3 py-2 font-mono text-gray-700 whitespace-nowrap">{formatCurrency(lineItem.volume)}</td>
                        <td className="px-3 py-2 font-mono text-gray-700 whitespace-nowrap">{formatCurrency(lineItem.residualRevenue)}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{Math.round(lineItem.commissionRate * 100)}%</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{lineItem.appliedRule || 'Base Tier'}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                          <span>{formatCurrency(lineItem.payout)}</span>
                          <span className="ml-2 text-[11px] font-normal text-gray-500 whitespace-nowrap">
                            ({formatCurrency(lineItem.basePayout || lineItem.payout)} + {formatCurrency(lineItem.excessPayout || 0)})
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-amber-600 max-w-[260px] truncate">{lineItem.exception || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="mt-1 text-sm text-gray-500">
          ISO-only view of sales reps and the merchants currently assigned to each portfolio.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setIsPayoutWizardOpen(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
          >
            Open Payout Wizard
          </button>
        </div>
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

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Payouts</h2>
            <p className="text-xs text-gray-600 mt-1">Use the payout wizard to save runs and export CSVs.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPayoutWizardOpen(true)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Open Payout Wizard
          </button>
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
                {(() => {
                  const query = (repMerchantSearch[rep.id] || '').trim().toLowerCase();
                  const filteredMerchants = query
                    ? assignedMerchants.filter((merchant) => {
                      const haystack = [merchant.name, merchant.businessType, merchant.status, merchant.churnRisk]
                        .join(' ')
                        .toLowerCase();
                      return haystack.includes(query);
                    })
                    : assignedMerchants;
                  const isExpanded = expandedRepIds.has(rep.id);
                  const visibleMerchants = isExpanded ? filteredMerchants : filteredMerchants.slice(0, 5);

                  return (
                    <>
                      <div className="md:col-span-2 xl:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <input
                          type="text"
                          value={repMerchantSearch[rep.id] || ''}
                          onChange={(event) => setRepMerchantSearch((current) => ({ ...current, [rep.id]: event.target.value }))}
                          placeholder={`Search ${rep.name}'s merchants...`}
                          className="w-full sm:max-w-xs px-3 py-2 rounded-lg border border-gray-300 text-sm"
                        />
                        {filteredMerchants.length > 5 && (
                          <button
                            type="button"
                            onClick={() => setExpandedRepIds((current) => {
                              const next = new Set(current);
                              if (next.has(rep.id)) next.delete(rep.id);
                              else next.add(rep.id);
                              return next;
                            })}
                            className="inline-flex items-center rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {isExpanded ? 'Show Top 5' : 'View All'}
                          </button>
                        )}
                      </div>

                      {visibleMerchants.map((merchant) => (
                  <article key={`${rep.id}_${merchant.id}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1.5">
                    <p className="font-semibold text-gray-900">{merchant.name}</p>
                    <p className="text-xs text-gray-600">{merchant.businessType}</p>
                    <p className="text-xs text-gray-700">Monthly Volume: {formatCurrency(merchant.monthlyVolume)}</p>
                    <p className="text-xs text-gray-700">Churn Risk: {merchant.churnRisk}</p>
                    <p className="text-xs text-gray-700">Status: {merchant.status}</p>
                  </article>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
