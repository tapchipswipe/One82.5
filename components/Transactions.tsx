import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Wand2, ChevronRight, Plus, X } from 'lucide-react';
import { StorageService } from '../services/storage';
import { categorizeTransaction } from '../services/geminiService';
import { Transaction } from '../types';
import TransactionDetail from './TransactionDetail';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual Entry State
  const [newTx, setNewTx] = useState({
      amount: '',
      customer: '',
      items: '',
      method: 'Cash'
  });

  useEffect(() => {
    setTransactions(StorageService.getTransactions());
  }, []);

    const filteredTransactions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return transactions;

        return transactions.filter((tx) => {
            const haystack = [
                tx.id,
                tx.customer,
                tx.items.join(' '),
                String(tx.amount),
                tx.amount.toFixed(2),
                new Date(tx.date).toLocaleDateString(),
                tx.date,
                tx.category || 'Uncategorized',
                tx.status
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [transactions, searchQuery]);

  const handleCategorize = async () => {
        const isAuthMode = StorageService.getDataMode() === 'backend';
        const hasGeminiKey = Boolean(localStorage.getItem('GEMINI_API_KEY'));

        if (isAuthMode && !hasGeminiKey) {
            alert('AI Categorize is blocked in Auth Login until a Gemini API key is configured in Integrations.');
            return;
        }

    if (!StorageService.hasCredits(2)) {
        alert("Insufficient credits. Bulk categorization requires 2 credits.");
        return;
    }
    setLoading(true);
    // Deduct Credit with Reason
    StorageService.updateCredits(2, 'Transaction Categorization');

    const updated = [...transactions];
    // Process first 5 for demo speed
    for (let i = 0; i < Math.min(updated.length, 5); i++) {
        const cat = await categorizeTransaction(updated[i]);
        updated[i].category = cat as any;
    }
    setTransactions(updated);
    StorageService.saveTransactions(updated);
    setLoading(false);
  };

  const handleExport = () => {
    const headers = ['ID,Date,Customer,Amount,Status,Category'];
    const rows = transactions.map(t => `${t.id},${t.date},${t.customer},${t.amount},${t.status},${t.category || 'Uncategorized'}`);
    const csvContent = headers.concat(rows).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tx: Transaction = {
        id: `man_${Date.now()}`,
        date: new Date().toISOString(),
        amount: parseFloat(newTx.amount),
        status: 'Completed',
        customer: newTx.customer || 'Walk-in',
        items: newTx.items.split(',').map(s => s.trim()),
        method: newTx.method as any,
        category: 'Uncategorized'
    };
    StorageService.addTransaction(tx);
    setTransactions(prev => [tx, ...prev]);
    setShowAddModal(false);
    setNewTx({ amount: '', customer: '', items: '', method: 'Cash' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {selectedTx && <TransactionDetail transaction={selectedTx} onClose={() => setSelectedTx(null)} />}

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Transaction</h3>
                    <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                        <input type="number" step="0.01" required value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Name (Optional)</label>
                        <input type="text" value={newTx.customer} onChange={e => setNewTx({...newTx, customer: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Items (comma separated)</label>
                        <input type="text" value={newTx.items} onChange={e => setNewTx({...newTx, items: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                         <select value={newTx.method} onChange={e => setNewTx({...newTx, method: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
                             <option>Cash</option>
                             <option>Visa</option>
                             <option>MasterCard</option>
                             <option>Square</option>
                         </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg">Add Transaction</button>
                </form>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and view all processing activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm"
            >
                <Plus className="w-4 h-4 mr-2" />
                Add New
            </button>
            <button 
                onClick={handleCategorize}
                disabled={loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            >
                <Wand2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Categorizing...' : 'AI Categorize (2 Cr)'}
            </button>
            <button 
                onClick={handleExport}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
                <Download className="w-4 h-4 mr-2" />
                Export
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Search by customer, amount, or ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredTransactions.map((tx) => (
                        <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{tx.id}</td>
                            <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-slate-900 dark:text-white font-medium">{tx.customer}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">{tx.items.join(', ')}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                    {tx.category || 'Uncategorized'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    tx.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                    {tx.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                ${tx.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 inline-block" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                    <li key={tx.id} onClick={() => setSelectedTx(tx)} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{tx.customer}</h4>
                                <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">${tx.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                tx.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                                {tx.status}
                            </span>
                             <div className="flex items-center text-xs text-slate-400">
                                {tx.category || 'Uncategorized'}
                                <ChevronRight className="w-4 h-4 ml-1" />
                             </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default Transactions;