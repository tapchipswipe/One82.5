import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronDown, Filter, FileText, ExternalLink, MoreVertical } from 'lucide-react';
import { PortfolioMerchant } from '../services/simulationService';

interface MerchantLedgerProps {
    merchants: PortfolioMerchant[];
}

type SortField = 'name' | 'monthlyVolume' | 'bps' | 'perTxFee' | 'status' | 'businessType';
type SortOrder = 'asc' | 'desc';

const MerchantLedger: React.FC<MerchantLedgerProps> = ({ merchants }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
                m.businessType.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                const factor = sortOrder === 'asc' ? 1 : -1;
                const valA = a[sortField];
                const valB = b[sortField];

                if (typeof valA === 'string' && typeof valB === 'string') {
                    return valA.localeCompare(valB) * factor;
                }
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return (valA - valB) * factor;
                }
                return 0;
            });
    }, [merchants, searchTerm, sortField, sortOrder]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <FileText className="w-5 h-5 text-indigo-500 mr-2" />
                        Merchant Ledger
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Portfolio processing rates and volume tracking</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search merchants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all w-64"
                        />
                    </div>
                    <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center">
                                    Merchant <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('businessType')}>
                                <div className="flex items-center">
                                    Type <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('monthlyVolume')}>
                                <div className="flex items-center">
                                    Monthly Volume <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('bps')}>
                                <div className="flex items-center">
                                    Rate (BPS) <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('perTxFee')}>
                                <div className="flex items-center">
                                    Per-Tx Fee <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('status')}>
                                <div className="flex items-center">
                                    Status <ArrowUpDown className="w-3 h-3 ml-2 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredAndSortedMerchants.map((merchant) => (
                            <tr key={merchant.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 dark:text-white">{merchant.name}</div>
                                    <div className="text-xs text-gray-500 font-mono uppercase mt-0.5">ID: {merchant.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                                        {merchant.businessType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-900 dark:text-gray-100 font-medium">
                                    ${merchant.monthlyVolume.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                    {merchant.bps} BPS
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 italic">
                                    ${merchant.perTxFee.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${merchant.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            merchant.status === 'Inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                        {merchant.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 flex justify-between items-center">
                <span>Showing {filteredAndSortedMerchants.length} of {merchants.length} merchants</span>
                <div className="flex gap-2 font-mono">
                    <span className="text-indigo-600 dark:text-indigo-400">Total BPS Margin: 0.42%</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="text-green-600 dark:text-green-400">Projected Residuals: $1,420.50</span>
                </div>
            </div>
        </div>
    );
};

export default MerchantLedger;
