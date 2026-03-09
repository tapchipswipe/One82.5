import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter, FileText, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PortfolioMerchant } from '@/services/simulationService';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import MerchantProfile from './MerchantProfile';
import { StorageService } from '@/services/storage';
import { MerchantInviteStrategy } from '@/types';
import { SourceStatusText } from './ProvenanceIndicators';

interface MerchantLedgerProps {
    merchants: PortfolioMerchant[];
}

type SortField = 'name' | 'monthlyVolume' | 'bps' | 'perTxFee' | 'status' | 'businessType' | 'mccCode';
type SortOrder = 'asc' | 'desc';

const RiskBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' }) => {
    const styles = {
        Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[level]}`}>{level}</span>;
};

const Sparkline = ({ data }: { data: number[] }) => {
    const chartData = data.map((v, i) => ({ v, i }));
    const isUp = data[data.length - 1] >= data[0];
    return (
        <ResponsiveContainer width={80} height={32}>
            <LineChart data={chartData}>
                <Line type="monotone" dataKey="v" stroke={isUp ? '#22c55e' : '#ef4444'} dot={false} strokeWidth={2} />
                <Tooltip
                    formatter={(val: number) => [`$${Number(val).toLocaleString()}`, 'Vol']}
                    contentStyle={{ fontSize: 10, zIndex: 70 }}
                    wrapperStyle={{ zIndex: 70 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
};

const MerchantLedger: React.FC<MerchantLedgerProps> = ({ merchants }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedMerchant, setSelectedMerchant] = useState<PortfolioMerchant | null>(null);
    const [inviteStrategy, setInviteStrategy] = useState<MerchantInviteStrategy>(StorageService.getMerchantInviteStrategy());
    const [inviteCount, setInviteCount] = useState(StorageService.getMerchantInvites().length);
    const [inviteLinkNotice, setInviteLinkNotice] = useState<string | null>(null);

    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/?invite=merchant`
        : 'https://one82-5.vercel.app/?invite=merchant';

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const filteredAndSortedMerchants = useMemo(() => {
        return merchants
            .filter(m =>
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.mccCode.includes(searchTerm) ||
                m.mccDescription.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                const factor = sortOrder === 'asc' ? 1 : -1;
                const valA = a[sortField as keyof PortfolioMerchant];
                const valB = b[sortField as keyof PortfolioMerchant];
                if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * factor;
                if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * factor;
                return 0;
            });
    }, [merchants, searchTerm, sortField, sortOrder]);

    const totalVolume = merchants.reduce((a, m) => a + m.monthlyVolume, 0);
    const avgBps = Math.round(merchants.reduce((a, m) => a + m.bps, 0) / merchants.length);
    const projectedResidual = ((totalVolume * avgBps) / 10000).toFixed(0);
    const isDemoMode = StorageService.getDataMode() === 'demo';
    const latestTransactionAt = StorageService.getTransactions()
        .map((tx) => new Date(tx.date).getTime())
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0] || null;
    const freshness = isDemoMode
        ? 'Simulated freshness'
        : latestTransactionAt
            ? (() => {
                const hours = Math.floor((Date.now() - latestTransactionAt) / 3600000);
                return hours >= 24 ? `Stale (${hours}h since latest transaction)` : `Fresh (${hours}h since latest transaction)`;
            })()
            : 'No recent trusted transaction data';

    const updateInviteStrategy = async (strategy: MerchantInviteStrategy) => {
        setInviteStrategy(strategy);
        StorageService.saveMerchantInviteStrategy(strategy);
        await StorageService.saveImportedDataResolved({ inviteStrategy: strategy });
        setInviteCount(StorageService.getMerchantInvites().length);
    };

    const handleCopyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setInviteLinkNotice('Invite link copied. Share with merchants who should self-onboard.');
            window.setTimeout(() => setInviteLinkNotice(null), 2500);
        } catch {
            setInviteLinkNotice('Unable to auto-copy. Manually copy the invite link shown below.');
        }
    };

    const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
        <th
            className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left text-xs uppercase tracking-wide"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {label}
                <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-indigo-500' : 'text-gray-300'}`} />
            </div>
        </th>
    );

    return (
        <>
            {selectedMerchant && (
                <MerchantProfile
                    merchant={selectedMerchant}
                    onClose={() => setSelectedMerchant(null)}
                />
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Merchant Invite Strategy</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Primary onboarding path is CSV import + auto-invite. Invite-link fallback remains available for edge cases.</p>
                </div>

                <div className="p-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => { void updateInviteStrategy('csv-auto-invite'); }}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${inviteStrategy === 'csv-auto-invite'
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            CSV Import + Auto-Invite (Primary)
                        </button>
                        <button
                            type="button"
                            onClick={() => { void updateInviteStrategy('invite-link'); }}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${inviteStrategy === 'invite-link'
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            Invite Link (Fallback)
                        </button>
                    </div>

                    <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            Invite link: <span className="font-semibold break-all text-gray-700 dark:text-gray-200">{inviteLink}</span>
                        </p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={handleCopyInviteLink}
                                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                            >
                                Copy Invite Link
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Invites sent: {inviteCount}</span>
                        </div>
                        {inviteLinkNotice && <p className="text-xs text-green-600 mt-2">{inviteLinkNotice}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Merchant List
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Portfolio rates, volume, MCC codes &amp; trend tracking
                        </p>
                        <SourceStatusText className="text-xs text-gray-500 dark:text-gray-400 mt-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Data freshness: {freshness}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, type, or MCC..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-64"
                            />
                        </div>
                        <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <SortHeader field="name" label="Merchant" />
                                <SortHeader field="businessType" label="Type" />
                                <SortHeader field="mccCode" label="MCC" />
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Risk</th>
                                <SortHeader field="monthlyVolume" label="Monthly Vol" />
                                <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">6-Mo Trend</th>
                                <SortHeader field="bps" label="BPS" />
                                <SortHeader field="perTxFee" label="Per-Tx" />
                                <SortHeader field="status" label="Status" />
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {filteredAndSortedMerchants.map((m) => (
                                <tr
                                    key={m.id}
                                    onClick={() => setSelectedMerchant(m)}
                                    className="hover:bg-indigo-50/30 dark:hover:bg-gray-700/20 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                            <TrendIcon trend={m.trend} />
                                            {m.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {m.id}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                            {m.businessType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-mono text-xs text-indigo-700 dark:text-indigo-400 font-bold">{m.mccCode}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 max-w-[120px] truncate">{m.mccDescription}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <RiskBadge level={m.riskLevel} />
                                    </td>
                                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100 font-medium text-sm">
                                        ${m.monthlyVolume.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Sparkline data={m.volumeHistory} />
                                    </td>
                                    <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                        {m.bps} BPS
                                    </td>
                                    <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400 text-sm">
                                        ${m.perTxFee.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            m.status === 'Inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {m.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="p-1.5 text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 flex flex-wrap justify-between items-center gap-2">
                    <span>{filteredAndSortedMerchants.length} of {merchants.length} merchants — <span className="text-indigo-500 font-semibold">click any row for full profile</span></span>
                    <div className="flex gap-4 font-mono">
                        <span>Total Vol: <strong className="text-gray-800 dark:text-gray-200">${totalVolume.toLocaleString()}</strong></span>
                        <span>Avg BPS: <strong className="text-indigo-600 dark:text-indigo-400">{avgBps}</strong></span>
                        <span>Est. Residual: <strong className="text-green-600 dark:text-green-400">${projectedResidual}/mo</strong></span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MerchantLedger;
