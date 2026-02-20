import React, { useState, useEffect } from 'react';
import {
    Upload, Users, TrendingUp, DollarSign, AlertTriangle,
    ArrowDownRight, Activity, Sparkles, Settings, CreditCard,
    Zap, ArrowUpRight
} from 'lucide-react';
import { SimulationService, PortfolioMerchant } from '../services/simulationService';
import { analyzePortfolio } from '../services/geminiService';
import TodoList from './TodoList';
import MerchantLedger from './MerchantLedger';

const ISODashboard: React.FC = () => {
    const [merchants, setMerchants] = useState<PortfolioMerchant[]>([]);
    const [totalVolume, setTotalVolume] = useState(0);
    const [ccVolume, setCcVolume] = useState(243817.50);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');

    useEffect(() => {
        const data = SimulationService.generatePortfolio();
        setMerchants(data);
        setTotalVolume(data.reduce((acc, m) => acc + m.monthlyVolume, 0));

        const portfolioTicker = setInterval(() => setTotalVolume(p => p + Math.random() * 100), 3000);
        const ccTicker = setInterval(() => setCcVolume(p => p + Math.random() * 250 + 50), 1500);

        return () => { clearInterval(portfolioTicker); clearInterval(ccTicker); };
    }, []);

    const handleSaveApiKey = () => { localStorage.setItem('GEMINI_API_KEY', apiKey); setShowApiKeyInput(false); };

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try { setAiAnalysis(await analyzePortfolio(merchants)); }
        catch { setAiAnalysis('Portfolio analysis currently unavailable.'); }
        setIsAnalyzing(false);
    };

    const atRiskCount = merchants.filter(m => m.churnRisk === 'High').length;
    const estMonthlyResidual = merchants.reduce((a, m) => a + m.monthlyVolume * (m.bps / 10000), 0);
    const uniqueIndustries = [...new Set(merchants.map(m => m.businessType))].length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a12]">

            {/* ── Hero Banner ── */}
            <div className="relative bg-gradient-to-r from-indigo-950 via-indigo-900 to-[#0f0f1a] overflow-hidden">
                {/* Orb */}
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '32px 32px' }}
                />

                <div className="relative px-6 pt-8 pb-6 max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                                </span>
                                <span className="text-xs font-mono text-green-400 tracking-widest">LIVE · SIMULATION MODE</span>
                            </div>
                            <h1 className="text-3xl font-bold text-white">Portfolio Dashboard</h1>
                            <p className="text-indigo-300 text-sm mt-1">
                                {merchants.length} merchants across {uniqueIndustries} industries
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors"
                            >
                                <Settings className="w-4 h-4" /> AI Config
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/25">
                                <Upload className="w-4 h-4" /> Upload Statement
                            </button>
                        </div>
                    </div>

                    {/* Hero Stat Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {/* Portfolio Volume */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-xs text-indigo-300 uppercase tracking-widest mb-1">Portfolio Vol.</p>
                            <p className="text-2xl font-bold text-white font-mono tabular-nums">
                                ${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-green-400">
                                <Activity className="w-3 h-3" /> live · ticking
                            </div>
                        </div>

                        {/* Live CC Volume */}
                        <div className="bg-indigo-600/30 border border-indigo-500/40 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-xs text-indigo-200 uppercase tracking-widest mb-1">CC Volume (Live)</p>
                            <p className="text-2xl font-bold text-white font-mono tabular-nums">
                                ${ccVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-indigo-300">
                                <CreditCard className="w-3 h-3" /> processing now
                            </div>
                        </div>

                        {/* Est. Monthly Residual */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                            <p className="text-xs text-indigo-300 uppercase tracking-widest mb-1">Est. Residual</p>
                            <p className="text-2xl font-bold text-white font-mono">
                                ${Math.round(estMonthlyResidual).toLocaleString()}<span className="text-sm text-indigo-300 font-normal">/mo</span>
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-green-400">
                                <ArrowUpRight className="w-3 h-3" /> across all merchants
                            </div>
                        </div>

                        {/* Churn Risk */}
                        <div className={`rounded-2xl p-5 backdrop-blur-sm border ${atRiskCount > 0 ? 'bg-red-600/15 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                            <p className="text-xs text-indigo-300 uppercase tracking-widest mb-1">Churn Risk</p>
                            <p className={`text-2xl font-bold font-mono ${atRiskCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {atRiskCount} <span className="text-sm font-normal text-gray-400">merchants</span>
                            </p>
                            <div className={`mt-2 flex items-center gap-1 text-[11px] ${atRiskCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                <AlertTriangle className="w-3 h-3" />
                                {atRiskCount > 0 ? 'need attention' : 'portfolio healthy'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                {/* AI Config Panel */}
                {showApiKeyInput && (
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-500" /> Configure Gemini AI
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="Paste Gemini API Key here..."
                                className="flex-1 px-3 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white text-sm"
                            />
                            <button onClick={handleSaveApiKey} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm">
                                Save Key
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Key is stored locally in your browser.</p>
                    </div>
                )}

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
                                <button
                                    onClick={runAnalysis}
                                    disabled={isAnalyzing}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-50"
                                >
                                    {isAnalyzing ? 'Analyzing…' : 'Refresh'}
                                </button>
                            </div>
                            {aiAnalysis ? (
                                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                    {aiAnalysis.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Sparkles className="w-8 h-8 text-indigo-300 dark:text-indigo-700 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400 mb-3">Connect Gemini AI for real-time portfolio insights</p>
                                    <button onClick={runAnalysis} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                        Run Analysis
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Smart Tasks */}
                        <TodoList role="iso" className="h-[260px]" />
                    </div>
                </div>

                {/* Merchant Ledger */}
                <MerchantLedger merchants={merchants} />
            </div>
        </div>
    );
};

export default ISODashboard;
