import React, { useState } from 'react';
import {
    TrendingUp, TrendingDown, Minus, DollarSign,
    Users, BarChart2, Award, AlertCircle
} from 'lucide-react';
import { generateSalesReps, SalesRep } from '../services/simulationService';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, CartesianGrid, Legend
} from 'recharts';

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
const REP_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444'];

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
};

const StatCard = ({
    label, value, sub, icon, accent = false
}: { label: string; value: string; sub?: string; icon: React.ReactNode; accent?: boolean }) => (
    <div className={`p-5 rounded-xl border ${accent
        ? 'bg-indigo-600 border-indigo-700 text-white'
        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
    >
        <div className={`flex items-center gap-2 mb-1 ${accent ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {icon}
            <span className="text-xs uppercase tracking-wide font-medium">{label}</span>
        </div>
        <p className={`text-2xl font-bold font-mono ${accent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${accent ? 'text-indigo-200' : 'text-gray-400'}`}>{sub}</p>}
    </div>
);

const Profitability: React.FC = () => {
    const reps = generateSalesReps();
    const [repCount, setRepCount] = useState(reps.length);
    const [pricePerRep, setPricePerRep] = useState(100);
    const [selectedRep, setSelectedRep] = useState<SalesRep | null>(null);

    // Portfolio totals
    const totalGrossResidual = reps.reduce((a, r) => a + r.grossResidual, 0);
    const totalSupportCost = reps.reduce((a, r) => a + r.supportCost, 0);
    const totalNetProfit = reps.reduce((a, r) => a + r.netProfit, 0);
    const totalMerchants = reps.reduce((a, r) => a + r.merchantCount, 0);

    // SaaS projection
    const saasMonthly = repCount * pricePerRep;
    const saasYearly = saasMonthly * 12;

    // Combined monthly revenue (residuals + SaaS fees)
    const combinedMonthly = totalNetProfit + saasMonthly;

    // Chart data for Portfolio residual trend
    const residualChartData = MONTHS.map((month, i) => ({
        month,
        ...Object.fromEntries(reps.map(r => [r.name.split(' ')[0], r.volumeHistory[i]])),
    }));

    // Bar chart per rep
    const repBarData = reps.map((r, i) => ({
        name: r.name.split(' ')[0],
        Residual: r.grossResidual,
        Cost: r.supportCost,
        Profit: r.netProfit,
        color: REP_COLORS[i % REP_COLORS.length],
    }));

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <BarChart2 className="w-7 h-7 text-indigo-600" />
                    Profitability
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Per-rep residuals, net profit, and SaaS revenue projections
                </p>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total Net Profit"
                    value={`$${totalNetProfit.toLocaleString()}/mo`}
                    sub={`$${(totalNetProfit * 12).toLocaleString()}/yr`}
                    icon={<DollarSign className="w-4 h-4" />}
                    accent
                />
                <StatCard
                    label="Gross Residual"
                    value={`$${totalGrossResidual.toLocaleString()}/mo`}
                    sub="Across all reps"
                    icon={<TrendingUp className="w-4 h-4" />}
                />
                <StatCard
                    label="Support Cost"
                    value={`$${totalSupportCost.toLocaleString()}/mo`}
                    sub="Overhead allocated"
                    icon={<AlertCircle className="w-4 h-4" />}
                />
                <StatCard
                    label="Active Reps"
                    value={String(reps.length)}
                    sub={`${totalMerchants} merchants total`}
                    icon={<Users className="w-4 h-4" />}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Residual trend by rep */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">6-Month Residual by Rep</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={residualChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                            <Tooltip formatter={(v: number) => [`$${v}`, '']} />
                            {reps.map((r, i) => (
                                <Area
                                    key={r.id}
                                    type="monotone"
                                    dataKey={r.name.split(' ')[0]}
                                    stroke={REP_COLORS[i % REP_COLORS.length]}
                                    fill={REP_COLORS[i % REP_COLORS.length]}
                                    fillOpacity={0.08}
                                    strokeWidth={2}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Per-rep bar comparison */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Residual vs Cost vs Profit per Rep</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={repBarData} barSize={14}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                            <Tooltip formatter={(v: number) => `$${v}`} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="Residual" fill="#6366f1" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="Cost" fill="#ef4444" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="Profit" fill="#22c55e" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Per-Rep Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-500" /> Per-Rep Breakdown
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                {['Rep', 'Merchants', 'Portfolio Vol', 'Gross Residual', 'Support Cost', 'Net Profit', 'Sub Fee', 'Combined', 'Trend'].map(h => (
                                    <th key={h} className="px-4 py-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {reps.map((rep, i) => {
                                const combined = rep.netProfit + rep.subscriptionFee;
                                const isProfitable = rep.netProfit > 0;
                                return (
                                    <tr
                                        key={rep.id}
                                        onClick={() => setSelectedRep(selectedRep?.id === rep.id ? null : rep)}
                                        className="hover:bg-indigo-50/30 dark:hover:bg-gray-700/20 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                                                    style={{ background: REP_COLORS[i % REP_COLORS.length] }}>
                                                    {rep.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-gray-900 dark:text-white">{rep.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{rep.merchantCount}</td>
                                        <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">${rep.totalPortfolioVolume.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">${rep.grossResidual.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-red-500">-${rep.supportCost}</td>
                                        <td className="px-4 py-3 font-mono font-bold">
                                            <span className={isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                                                ${rep.netProfit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-500">${rep.subscriptionFee}</td>
                                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">${combined}</td>
                                        <td className="px-4 py-3"><TrendIcon trend={rep.trend} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
                            <tr>
                                <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">Totals</td>
                                <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">{totalMerchants}</td>
                                <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                                    ${reps.reduce((a, r) => a + r.totalPortfolioVolume, 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">${totalGrossResidual.toLocaleString()}</td>
                                <td className="px-4 py-3 font-mono font-bold text-red-500">-${totalSupportCost}</td>
                                <td className="px-4 py-3 font-mono font-bold text-green-600 dark:text-green-400">${totalNetProfit.toLocaleString()}</td>
                                <td className="px-4 py-3 font-mono text-gray-500">${reps.reduce((a, r) => a + r.subscriptionFee, 0)}</td>
                                <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">${combinedMonthly.toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* SaaS Revenue Projector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> SaaS Revenue Projector
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-2">
                                Number of Sales Reps: <span className="text-indigo-600 font-bold">{repCount}</span>
                            </label>
                            <input
                                type="range" min={1} max={200} value={repCount}
                                onChange={e => setRepCount(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>200</span></div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-2">
                                Price per Rep/mo: <span className="text-indigo-600 font-bold">${pricePerRep}</span>
                            </label>
                            <input
                                type="range" min={25} max={500} step={25} value={pricePerRep}
                                onChange={e => setPricePerRep(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>$25</span><span>$500</span></div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-6 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">SaaS Monthly</span>
                            <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono">${saasMonthly.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">SaaS Annual</span>
                            <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono">${saasYearly.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-indigo-200 dark:border-indigo-800 pt-3 flex justify-between">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Combined Monthly</span>
                            <span className="text-xl font-bold text-green-600 dark:text-green-400 font-mono">${combinedMonthly.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Combined Annual</span>
                            <span className="text-xl font-bold text-green-600 dark:text-green-400 font-mono">${(combinedMonthly * 12).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profitability;
