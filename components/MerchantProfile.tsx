import React, { useState } from 'react';
import {
    X, Phone, Mail, MapPin, Calendar, FileText,
    TrendingUp, TrendingDown, Minus, ShieldCheck,
    PlusCircle, Activity
} from 'lucide-react';
import { PortfolioMerchant } from '../services/simulationService';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts';

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

interface Props {
    merchant: PortfolioMerchant;
    onClose: () => void;
}

const HealthBar = ({ score }: { score: number }) => {
    const color = score >= 75 ? 'bg-green-500' : score >= 45 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${score}%` }} />
        </div>
    );
};

const RiskBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' }) => {
    const styles = {
        Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[level]}`}>{level} Risk</span>;
};

const MerchantProfile: React.FC<Props> = ({ merchant: m, onClose }) => {
    const [newNote, setNewNote] = useState('');
    const [localNotes, setLocalNotes] = useState(m.notes);

    const chartData = MONTHS.map((month, i) => ({ month, Volume: m.volumeHistory[i] }));

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const note = {
            id: `n_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            author: 'You',
            text: newNote.trim(),
        };
        setLocalNotes([note, ...localNotes]);
        setNewNote('');
    };

    const TrendIcon = () => {
        if (m.trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (m.trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{m.name}</h2>
                            <RiskBadge level={m.riskLevel} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{m.mccCode} — {m.mccDescription}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 flex-1">
                    {/* Health Score */}
                    <div>
                        <div className="flex justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-indigo-500" /> Health Score</span>
                            <span className={m.healthScore >= 75 ? 'text-green-600' : m.healthScore >= 45 ? 'text-yellow-600' : 'text-red-600'}>
                                {m.healthScore}/100
                            </span>
                        </div>
                        <HealthBar score={m.healthScore} />
                    </div>

                    {/* Contact Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</p>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{m.ownerName}</div>
                            <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                <Mail className="w-3.5 h-3.5" />{m.email}
                            </a>
                            <a href={`tel:${m.phone}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline">
                                <Phone className="w-3.5 h-3.5" />{m.phone}
                            </a>
                            <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{m.address}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Processing</p>
                            {[
                                ['BPS Rate', `${m.bps} BPS`],
                                ['Per-Tx Fee', `$${m.perTxFee.toFixed(2)}`],
                                ['Monthly Volume', `$${m.monthlyVolume.toLocaleString()}`],
                                ['Status', m.status],
                            ].map(([label, val]) => (
                                <div key={label} className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{val}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Client Since</span>
                                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(m.since).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Volume History Chart */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4 text-indigo-500" /> 6-Month Volume
                            <TrendIcon />
                        </h4>
                        <ResponsiveContainer width="100%" height={140}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Volume']} />
                                <Area type="monotone" dataKey="Volume" stroke="#6366f1" fill="url(#volGrad)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Notes / CRM Log */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-indigo-500" /> Notes & Activity Log
                        </h4>

                        {/* Add note */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                placeholder="Add a note…"
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button
                                onClick={handleAddNote}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm font-semibold"
                            >
                                <PlusCircle className="w-4 h-4" /> Add
                            </button>
                        </div>

                        <div className="space-y-3">
                            {localNotes.map(note => (
                                <div key={note.id} className="flex gap-3 text-sm">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {note.author.charAt(0)}
                                    </div>
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{note.author}</span>
                                            <span className="text-xs text-gray-400">{note.date}</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300">{note.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MerchantProfile;
