import React, { useState } from 'react';
import {
    Search, Star,
    Clock, User, Phone, Mail, ShoppingBag,
    ChevronDown, ChevronUp, AlertCircle, Sparkles
} from 'lucide-react';
import { generateCustomers, CustomerProfile } from '../services/simulationService';
import {
    BarChart, Bar, XAxis, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { StorageService } from '../services/storage';

const LoyaltyBar = ({ score }: { score: number }) => {
    const color = score >= 75 ? 'bg-green-500' : score >= 45 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
            <div className={`${color} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
        </div>
    );
};

const RiskBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' }) => {
    const styles = {
        Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[level]}`}>{level} Retention</span>;
};

const FrequencyBadge = ({ freq }: { freq: CustomerProfile['visitFrequency'] }) => {
    const colors: Record<CustomerProfile['visitFrequency'], string> = {
        Daily: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        Weekly: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        Monthly: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
        Occasional: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[freq]}`}>{freq}</span>;
};

const CustomerCard = ({ customer: c }: { customer: CustomerProfile }) => {
    const [expanded, setExpanded] = useState(false);

    const txChartData = c.recentTransactions.map(t => ({
        date: t.date.slice(5),
        amount: t.amount,
    }));

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${c.retentionRisk === 'High'
            ? 'border-red-100 dark:border-red-900/30'
            : 'border-gray-100 dark:border-gray-700'
            }`}>
            {/* Card Header */}
            <div
                className="p-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors rounded-xl"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {c.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</h3>
                                <RiskBadge level={c.retentionRisk} />
                                <FrequencyBadge freq={c.visitFrequency} />
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{c.email}</p>

                            {/* Loyalty bar */}
                            <div className="mt-2 flex items-center gap-2">
                                <LoyaltyBar score={c.loyaltyScore} />
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {c.loyaltyScore}/100
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">${c.totalSpend.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">lifetime spend</p>
                        {c.rating && (
                            <div className="flex items-center gap-0.5 justify-end mt-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-2.5 h-2.5 ${i < c.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="text-gray-400 dark:text-gray-500 ml-1">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>

                {/* Quick stats */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-center">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Avg Ticket</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">${c.avgTicket.toFixed(0)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-center">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Visits</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{c.visitCount}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-center">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Top</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.topCategory}</p>
                    </div>
                </div>
            </div>

            {/* Expanded Detail Panel */}
            {expanded && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Contact */}
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                                <Mail className="w-3.5 h-3.5" /> {c.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                Customer since {new Date(c.since).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <User className="w-3.5 h-3.5" />
                                Last seen {new Date(c.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>

                        {/* Recent Transactions Chart */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Recent Spend</p>
                            <ResponsiveContainer width="100%" height={90}>
                                <BarChart data={txChartData} barSize={20}>
                                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                    <Tooltip formatter={(v: number) => [`$${v}`, 'Spent']} />
                                    <Bar dataKey="amount" fill="#6366f1" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Transaction Log */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Transaction Log</p>
                        <div className="space-y-2">
                            {c.recentTransactions.map((t, i) => (
                                <div key={i} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                        <span className="text-gray-700 dark:text-gray-300">{t.description}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-gray-900 dark:text-white">${t.amount.toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{t.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    {c.notes && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 flex gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-300">{c.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Customers: React.FC = () => {
    const isDemoMode = StorageService.getDataMode() === 'demo';
    const customers = isDemoMode ? generateCustomers() : [];
    const hasCustomerData = customers.length > 0;
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

    const filtered = customers.filter(c => {
        const matchSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            c.topCategory.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'All' || c.retentionRisk === filter;
        return matchSearch && matchFilter;
    });

    const totalSpend = customers.reduce((a, c) => a + c.totalSpend, 0);
    const avgLoyalty = customers.length > 0
        ? Math.round(customers.reduce((a, c) => a + c.loyaltyScore, 0) / customers.length)
        : 0;
    const atRisk = customers.filter(c => c.retentionRisk === 'High').length;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <User className="w-6 h-6 text-indigo-600" /> Customer Profiles
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Spend patterns, loyalty scores, and retention risk
                    </p>
                </div>
                <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/30 font-medium">
                    <Sparkles className="w-3 h-3 inline mr-1" />{isDemoMode ? 'Simulation Mode' : 'Auth Mode'}
                </span>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Lifetime Spend</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white font-mono mt-1">${totalSpend.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Loyalty Score</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${avgLoyalty >= 70 ? 'text-green-600' : avgLoyalty >= 45 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {avgLoyalty}/100
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/30 p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">At Risk of Leaving</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{atRisk} customer{atRisk !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email, or category…"
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {(['All', 'Low', 'Medium', 'High'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filter === f
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {f === 'All' ? 'All' : `${f} Risk`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Customer Cards */}
            <div className="space-y-3">
                {filtered.map(customer => (
                    <div key={customer.id}>
                        <CustomerCard customer={customer} />
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                        {hasCustomerData
                            ? 'No customers match your search.'
                            : 'No customer profiles yet in Auth/Trial mode. Import transactions to generate live customer profiles.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;