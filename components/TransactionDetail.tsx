import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { Transaction } from '../types';
import { analyzeTransactionRisk } from '../services/geminiService';

interface TransactionDetailProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({ transaction, onClose }) => {
  const [analysis, setAnalysis] = useState<string>('Analyzing transaction risk...');

  useEffect(() => {
    const fetchAnalysis = async () => {
        const result = await analyzeTransactionRisk(transaction);
        setAnalysis(result);
    };
    fetchAnalysis();
  }, [transaction]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transaction Details</h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
            </button>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-sm text-slate-500">Amount</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">${transaction.amount.toFixed(2)}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    transaction.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                    {transaction.status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs text-slate-500">Customer</div>
                    <div className="font-medium text-slate-900 dark:text-white">{transaction.customer}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs text-slate-500">Method</div>
                    <div className="font-medium text-slate-900 dark:text-white">{transaction.method}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg col-span-2">
                    <div className="text-xs text-slate-500">Items</div>
                    <div className="font-medium text-slate-900 dark:text-white">{transaction.items.join(', ')}</div>
                </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg col-span-2">
                    <div className="text-xs text-slate-500">Category</div>
                    <div className="font-medium text-slate-900 dark:text-white">{transaction.category || 'Uncategorized'}</div>
                </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                    <ShieldAlert className="w-4 h-4" />
                    AI Risk Analysis
                </div>
                <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">
                    {analysis}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;