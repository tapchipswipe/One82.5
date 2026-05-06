import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    Activity, Sparkles, CreditCard, CalendarDays,
    ArrowDownRight, ArrowUpRight, Users
} from 'lucide-react';
import { SimulationService, PortfolioMerchant } from '@/services/simulationService';
import { analyzePortfolio } from '@/services/geminiService';
import TodoList from './TodoList';
import MerchantLedger from './MerchantLedger';
import { StorageService } from '@/services/storage';
import { Transaction } from '@/types';
import { DISABLE_AI_UI } from '@/constants';
import { SourceStatusText } from './ProvenanceIndicators';

const cleanAiOpportunityText = (value: string): string[] => {
    return value
        .split('\n')
        .map((line) => line.replace(/[*`#>-]/g, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
};

const buildPortfolioFromTransactions = (transactions: Transaction[]): PortfolioMerchant[] => {
    const grouped = new Map<string, Transaction[]>();

    transactions.forEach((transaction) => {
        const customer = transaction.customer || 'Imported Merchant';
        const current = grouped.get(customer) || [];
        current.push(transaction);
        grouped.set(customer, current);
    });

    return Array.from(grouped.entries()).map(([name, records], index) => {
        const monthlyVolume = records.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
        const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const lastTransaction = sorted.length > 0 ? new Date(sorted[sorted.length - 1].date).getTime() : Date.now();
        const midpoint = Math.max(1, Math.floor(sorted.length / 2));
        let firstHalf = 0;
        let secondHalf = 0;
        // Performance: Replaced multiple O(N) slice().reduce() operations with a single pass
        for (let i = 0; i < sorted.length; i++) {
            if (i < midpoint) {
                firstHalf += sorted[i].amount;
            } else {
                secondHalf += sorted[i].amount;
            }
        }
        const trend: PortfolioMerchant['trend'] = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'flat';
        const riskLevel: PortfolioMerchant['riskLevel'] = trend === 'down' ? 'Medium' : 'Low';
        const churnRisk: PortfolioMerchant['churnRisk'] = trend === 'down' ? 'Medium' : 'Low';
        const volumeHistory = Array.from({ length: 6 }, (_, offset) => {
            const start = Math.floor((offset * records.length) / 6);
            const end = Math.floor(((offset + 1) * records.length) / 6);
            const slice = records.slice(start, Math.max(end, start + 1));
            return Math.round(slice.reduce((sum, record) => sum + record.amount, 0));
        });

        return {
            id: `imported_${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            name,
            businessType: 'Service',
            monthlyVolume: Math.round(monthlyVolume),
            churnRisk,
            trend,
            lastTransaction,
            bps: 35,
            perTxFee: 0.1,
            status: 'Active',
            mccCode: '0000',
            mccDescription: 'Imported Merchant',
            riskLevel,
            volumeHistory,
            ownerName: `${name} Owner`,
            email: `owner+${index}@imported.one82`,
            phone: '(000) 000-0000',
            address: 'Imported via CSV',
            since: new Date().toISOString().slice(0, 10),
            notes: [
                {
                    id: `note_${index}`,
                    date: new Date().toISOString().slice(0, 10),
                    author: 'Import Hub',
                    text: 'Generated from imported transactions.'
                }
            ],
            healthScore: trend === 'down' ? 58 : 78
        };
    });
};

interface ISODashboardProps {
    onNavigate?: (view: string) => void;
}

type HeroMetricKey =
    | 'portfolioVolume'
    | 'merchantCount'
    | 'ccVolume'
    | 'estResidual'
    | 'churnRisk'
    | 'atRiskRate'
    | 'decliningMerchants'
    | 'avgMerchantVolume'
    | 'avgBps'
    | 'topMerchantVolume'
    | 'activeMerchants'
    | 'dataFreshness';

const HERO_METRIC_STORAGE_KEY = 'one82_iso_hero_metric_slots';
const DEFAULT_HERO_METRIC_SLOTS: HeroMetricKey[] = ['portfolioVolume', 'ccVolume', 'estResidual', 'churnRisk'];
const HERO_METRIC_OPTIONS: Array<{ key: HeroMetricKey; label: string }> = [
    { key: 'portfolioVolume', label: 'Portfolio Vol.' },
    { key: 'merchantCount', label: 'Merchant Count' },
    { key: 'ccVolume', label: 'CC Volume (Live)' },
    { key: 'estResidual', label: 'Est. Residual' },
    { key: 'churnRisk', label: 'Churn Risk' },
    { key: 'atRiskRate', label: 'At-Risk Rate' },
    { key: 'decliningMerchants', label: 'Declining Merchants' },
    { key: 'avgMerchantVolume', label: 'Avg Merchant Vol.' },
    { key: 'avgBps', label: 'Avg BPS' },
    { key: 'topMerchantVolume', label: 'Top Merchant Vol.' },
    { key: 'activeMerchants', label: 'Active Merchants' },
    { key: 'dataFreshness', label: 'Data Freshness' }
];

const sanitizeHeroMetricSlots = (input: unknown): HeroMetricKey[] => {
    if (!Array.isArray(input)) return DEFAULT_HERO_METRIC_SLOTS;
    const allowed = new Set(HERO_METRIC_OPTIONS.map((option) => option.key));
    const unique = input.filter((item): item is HeroMetricKey => typeof item === 'string' && allowed.has(item as HeroMetricKey));
    const deduped = Array.from(new Set(unique));
    const filled = [...deduped, ...DEFAULT_HERO_METRIC_SLOTS.filter((slot) => !deduped.includes(slot))];
    return filled.slice(0, 4);
};

const ISODashboard: React.FC<ISODashboardProps> = ({ onNavigate }) => {
    const isDemoMode = StorageService.getDataMode() === 'demo';
    const isAuthMode = StorageService.getDataMode() === 'backend';
    const [merchants, setMerchants] = useState<PortfolioMerchant[]>([]);
    const [totalVolume, setTotalVolume] = useState(0);
    const [ccVolume, setCcVolume] = useState(243817.50);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [heroMetricSlots, setHeroMetricSlots] = useState<HeroMetricKey[]>(() => {
        try {
            const raw = localStorage.getItem(HERO_METRIC_STORAGE_KEY);
            return raw ? sanitizeHeroMetricSlots(JSON.parse(raw)) : DEFAULT_HERO_METRIC_SLOTS;
        } catch {
            return DEFAULT_HERO_METRIC_SLOTS;
        }
    });
    const [editingMetricSlot, setEditingMetricSlot] = useState<number | null>(null);
    const [lastAiRunAt, setLastAiRunAt] = useState<number | null>(() => StorageService.getAiLastRunAt('iso-portfolio'));
    const [lastHolidayDraftAt, setLastHolidayDraftAt] = useState<number | null>(null);

    const markAiRun = () => {
        const timestamp = Date.now();
        StorageService.setAiLastRunAt('iso-portfolio', timestamp);
        setLastAiRunAt(timestamp);
    };

    useEffect(() => {
        const load = async () => {
            const data = isDemoMode
                ? SimulationService.generatePortfolio()
                : buildPortfolioFromTransactions(await StorageService.getTransactionsResolved());

            setMerchants(data);
            setTotalVolume(data.reduce((acc, m) => acc + m.monthlyVolume, 0));
            if (!isDemoMode) {
                setCcVolume(data.reduce((acc, m) => acc + m.monthlyVolume, 0));
            }
        };

        void load();

        if (!isDemoMode) {
            const onUpdate = () => {
                void load();
            };
            window.addEventListener('user-update', onUpdate);
            return () => window.removeEventListener('user-update', onUpdate);
        }

        const portfolioTicker = setInterval(() => setTotalVolume(p => p + Math.random() * 100), 3000);
        const ccTicker = setInterval(() => setCcVolume(p => p + Math.random() * 250 + 50), 1500);

        return () => { clearInterval(portfolioTicker); clearInterval(ccTicker); };
    }, [isDemoMode]);

    const runAnalysis = async () => {
        if (DISABLE_AI_UI) {
            setAiAnalysis('AI features are temporarily disabled by admin. Use non-AI workflows until the incident toggle is lifted.');
            markAiRun();
            return;
        }

        if (isAuthMode && merchants.length === 0) {
            setAiAnalysis('Portfolio AI analysis is blocked in Auth Login until trusted merchant and transaction data is available. Import data to continue.');
            markAiRun();
            return;
        }

        setIsAnalyzing(true);
        try { setAiAnalysis(await analyzePortfolio(merchants)); }
        catch { setAiAnalysis('Portfolio analysis currently unavailable.'); }
        markAiRun();
        setIsAnalyzing(false);
    };

    const createHolidayHubspotDraft = () => {
        StorageService.addNotification({
            title: 'Holiday Campaign Draft',
            message: 'HubSpot holiday email draft queued for merchant outreach. Review in CRM before sending.',
            type: 'info'
        });
        setLastHolidayDraftAt(Date.now());
    };

    const atRiskCount = merchants.filter(m => m.churnRisk === 'High').length;
    const decliningCount = merchants.filter(m => m.trend === 'down').length;
    const activeMerchantCount = merchants.filter((merchant) => merchant.status === 'Active').length;
    const estMonthlyResidual = merchants.reduce((a, m) => a + m.monthlyVolume * (m.bps / 10000), 0);
    const avgMerchantVolume = merchants.length > 0 ? totalVolume / merchants.length : 0;
    const avgBps = merchants.length > 0 ? merchants.reduce((sum, merchant) => sum + (merchant.bps || 0), 0) / merchants.length : 0;
    const topMerchantVolume = merchants.length > 0 ? Math.max(...merchants.map((merchant) => merchant.monthlyVolume || 0)) : 0;
    const atRiskRate = merchants.length > 0 ? (atRiskCount / merchants.length) * 100 : 0;
    const uniqueIndustries = [...new Set(merchants.map(m => m.businessType))].length;
    const latestPortfolioTransactionAt = merchants
        .map((merchant) => merchant.lastTransaction)
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0] || null;
    const portfolioFreshness = isDemoMode
        ? 'Simulated freshness'
        : latestPortfolioTransactionAt
            ? (() => {
                const hours = Math.floor((Date.now() - latestPortfolioTransactionAt) / 3600000);
                return hours >= 24 ? `Stale (${hours}h since latest transaction)` : `Fresh (${hours}h since latest transaction)`;
            })()
            : 'No recent trusted transaction data';
    const freshnessHours = latestPortfolioTransactionAt
        ? Math.max(0, Math.floor((Date.now() - latestPortfolioTransactionAt) / 3600000))
        : null;

    useEffect(() => {
        localStorage.setItem(HERO_METRIC_STORAGE_KEY, JSON.stringify(heroMetricSlots));
    }, [heroMetricSlots]);

    const updateHeroMetricSlot = (slotIndex: number, nextMetric: HeroMetricKey) => {
        setHeroMetricSlots((current) => {
            if (current[slotIndex] === nextMetric) return current;
            const next = [...current];
            const existingIndex = next.indexOf(nextMetric);
            if (existingIndex >= 0) {
                [next[slotIndex], next[existingIndex]] = [next[existingIndex], next[slotIndex]];
                return next;
            }
            next[slotIndex] = nextMetric;
            return next;
        });
    };

    const heroMetricData: Record<HeroMetricKey, {
        title: string;
        value: string;
        hint: string;
        hintClassName: string;
        route: string;
        icon: React.ReactNode;
        cardClassName: string;
    }> = {
        portfolioVolume: {
            title: 'Portfolio Vol.',
            value: `$${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
            hint: 'live · ticking',
            hintClassName: 'text-green-600',
            route: 'portfolio',
            icon: <Activity className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        },
        merchantCount: {
            title: 'Merchant Count',
            value: merchants.length.toLocaleString(),
            hint: `${uniqueIndustries} industries`,
            hintClassName: 'text-gray-500',
            route: 'portfolio',
            icon: <Users className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        },
        ccVolume: {
            title: 'CC Volume (Live)',
            value: `$${ccVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
            hint: 'processing now',
            hintClassName: 'text-gray-500',
            route: 'statements',
            icon: <CreditCard className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        },
        estResidual: {
            title: 'Est. Residual',
            value: `$${Math.round(estMonthlyResidual).toLocaleString()}/mo`,
            hint: 'across all merchants',
            hintClassName: 'text-green-600',
            route: 'profitability',
            icon: <ArrowUpRight className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        },
        churnRisk: {
            title: 'Churn Risk',
            value: `${atRiskCount} merchants`,
            hint: atRiskCount > 0 ? 'need attention' : 'portfolio healthy',
            hintClassName: atRiskCount > 0 ? 'text-red-500' : 'text-green-600',
            route: 'team',
            icon: <AlertTriangle className="w-3 h-3" />,
            cardClassName: atRiskCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
        },
        atRiskRate: {
            title: 'At-Risk Rate',
            value: `${atRiskRate.toFixed(1)}%`,
            hint: `${atRiskCount} high-risk merchants`,
            hintClassName: atRiskRate > 0 ? 'text-red-500' : 'text-green-600',
            route: 'team',
            icon: <AlertTriangle className="w-3 h-3" />,
            cardClassName: atRiskRate > 0 ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
        },
        decliningMerchants: {
            title: 'Declining Merchants',
            value: decliningCount.toLocaleString(),
            hint: `${merchants.length} merchants tracked`,
            hintClassName: decliningCount > 0 ? 'text-red-500' : 'text-green-600',
            route: 'portfolio',
            icon: <ArrowDownRight className="w-3 h-3" />,
            cardClassName: decliningCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
        },
        avgMerchantVolume: {
            title: 'Avg Merchant Vol.',
            value: `$${Math.round(avgMerchantVolume).toLocaleString()}`,
            hint: 'monthly average per merchant',
            hintClassName: 'text-gray-500',
            route: 'portfolio',
            icon: <Activity className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        },
        avgBps: {
            title: 'Avg BPS',
            value: avgBps.toFixed(1),
            hint: 'blended portfolio rate',
            hintClassName: 'text-gray-500',
            route: 'profitability',
            icon: <ArrowUpRight className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        },
        topMerchantVolume: {
            title: 'Top Merchant Vol.',
            value: `$${Math.round(topMerchantVolume).toLocaleString()}`,
            hint: 'largest single merchant volume',
            hintClassName: 'text-gray-500',
            route: 'portfolio',
            icon: <Activity className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        },
        activeMerchants: {
            title: 'Active Merchants',
            value: activeMerchantCount.toLocaleString(),
            hint: `${Math.max(0, merchants.length - activeMerchantCount)} inactive`,
            hintClassName: 'text-gray-500',
            route: 'portfolio',
            icon: <Users className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        },
        dataFreshness: {
            title: 'Data Freshness',
            value: isDemoMode ? 'Demo' : freshnessHours === null ? 'N/A' : `${freshnessHours}h`,
            hint: isDemoMode ? 'simulation feed' : portfolioFreshness,
            hintClassName: isDemoMode ? 'text-gray-500' : freshnessHours !== null && freshnessHours < 24 ? 'text-green-600' : 'text-amber-600',
            route: 'statements',
            icon: <CalendarDays className="w-3 h-3" />,
            cardClassName: 'bg-white border border-gray-200'
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a12]">

            {/* ── Hero Banner ── */}
            <div className="relative bg-white overflow-hidden">
                {/* Orb */}
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-gray-400/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-gray-300/10 rounded-full blur-[60px] pointer-events-none" />
                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(17,24,39,0.5) 1px, transparent 1px), linear-gradient(90deg,rgba(17,24,39,0.5) 1px,transparent 1px)', backgroundSize: '32px 32px' }}
                />

                <div className="relative px-6 pt-8 pb-6 max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                                </span>
                                <span className="text-xs font-mono text-green-600 tracking-widest">{isDemoMode ? 'LIVE · SIMULATION MODE' : 'LIVE · AUTH MODE'}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
                            <p className="text-gray-600 text-sm mt-1">
                                {merchants.length} merchants across {uniqueIndustries} industries
                            </p>
                            <SourceStatusText className="text-xs text-gray-600 mt-2" />
                            <p className="text-xs text-gray-600 mt-1">Data freshness: {portfolioFreshness}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onNavigate?.('statements')}
                            className="inline-flex items-center self-start rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Upload Statement
                        </button>
                    </div>

                    {/* Hero Stat Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {heroMetricSlots.map((metricKey, index) => {
                            const metric = heroMetricData[metricKey];
                            return (
                                <div
                                    key={`${metricKey}-${index}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setEditingMetricSlot((current) => current === index ? null : index)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setEditingMetricSlot((current) => current === index ? null : index);
                                        }
                                    }}
                                    className={`${metric.cardClassName} relative rounded-2xl p-5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 cursor-pointer`}
                                >
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{metric.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 font-mono tabular-nums">{metric.value}</p>
                                    <div className={`mt-2 flex items-center gap-1 text-[11px] ${metric.hintClassName}`}>
                                        {metric.icon} {metric.hint}
                                    </div>
                                    <p className="mt-3 text-[11px] font-semibold text-gray-600">Click card to change metric</p>

                                    {editingMetricSlot === index && (
                                        <div
                                            className="absolute left-3 right-3 top-14 z-30 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <p className="px-1 pb-1 text-[11px] font-semibold text-gray-500">Select metric</p>
                                            <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto pr-1">
                                                {HERO_METRIC_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.key}
                                                        type="button"
                                                        onClick={() => {
                                                            updateHeroMetricSlot(index, option.key);
                                                            setEditingMetricSlot(null);
                                                        }}
                                                        className={`rounded-md px-2 py-1.5 text-left text-xs transition-colors ${option.key === metricKey ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                {/* Merchant List */}
                <MerchantLedger merchants={merchants} />

                {/* At Risk + AI Opportunities */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* At Risk Table */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" /> At-Risk Merchants
                            </h2>
                            <span className="text-xs text-gray-400">{merchants.filter(m => m.churnRisk !== 'Low').length} flagged</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-gray-50 dark:border-gray-700/40">
                                        {['Merchant', 'Volume (30d)', 'Trend', 'Risk', 'Action'].map(h => (
                                            <th key={h} className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                                    {merchants.filter(m => m.churnRisk === 'High' || m.churnRisk === 'Medium').map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <p className="font-semibold text-gray-900 dark:text-white">{m.name}</p>
                                                <p className="text-xs text-gray-400">{m.businessType}</p>
                                            </td>
                                            <td className="px-6 py-3.5 font-mono text-gray-700 dark:text-gray-300">${m.monthlyVolume.toLocaleString()}</td>
                                            <td className="px-6 py-3.5">
                                                {m.trend === 'down' ? (
                                                    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg w-fit">
                                                        <ArrowDownRight className="w-3 h-3" /> Declining
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Flat</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${m.churnRisk === 'High'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {m.churnRisk}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline">Contact →</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-5">
                        {/* AI Opportunities */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-5 flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500" /> AI Opportunities
                                </h2>
                                {lastAiRunAt && <p className="text-[11px] text-gray-500 dark:text-gray-400">Last AI run: {new Date(lastAiRunAt).toLocaleTimeString()}</p>}
                                <button
                                    onClick={runAnalysis}
                                    disabled={isAnalyzing || DISABLE_AI_UI}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-50"
                                >
                                    {isAnalyzing ? 'Analyzing…' : 'Refresh'}
                                </button>
                            </div>
                            {aiAnalysis ? (
                                <div className="text-sm text-gray-700 dark:text-gray-200 space-y-2 leading-relaxed">
                                    {cleanAiOpportunityText(aiAnalysis).map((line, i) => <p key={i}>{line}</p>)}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Sparkles className="w-8 h-8 text-indigo-300 dark:text-indigo-700 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400 mb-3">Run portfolio analysis on your available data</p>
                                    <button onClick={runAnalysis} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                        Run Analysis
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Smart Tasks */}
                        <TodoList role="iso" className="h-[260px]" />

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-indigo-500" /> Holiday Campaign Calendar
                                </h3>
                                {lastHolidayDraftAt && <span className="text-[11px] text-gray-500 dark:text-gray-400">Drafted {new Date(lastHolidayDraftAt).toLocaleTimeString()}</span>}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                ISO holiday outreach should be sent through CRM (HubSpot). Use this quick action to draft a campaign and finalize in HubSpot.
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={createHolidayHubspotDraft}
                                    className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                                >
                                    Draft HubSpot Holiday Email
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onNavigate?.('integrations')}
                                    className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                >
                                    Open Integrations
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ISODashboard;
