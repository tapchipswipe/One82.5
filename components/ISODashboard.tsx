import React, { useState, useEffect } from 'react';
import { Upload, Users, TrendingUp, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, Sparkles, Settings, CreditCard } from 'lucide-react';
import { SimulationService, PortfolioMerchant } from '../services/simulationService';
import { analyzePortfolio } from '../services/geminiService';
import TodoList from './TodoList';
import MerchantLedger from './MerchantLedger';

// ...

const ISODashboard: React.FC = () => {
    const [merchants, setMerchants] = useState<PortfolioMerchant[]>([]);
    const [totalVolume, setTotalVolume] = useState(0);
    const [ccVolume, setCcVolume] = useState(243817.50); // Live CC volume ticker
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');

    useEffect(() => {
        const data = SimulationService.generatePortfolio();
        setMerchants(data);
        setTotalVolume(data.reduce((acc, m) => acc + m.monthlyVolume, 0));

        // Simulate live portfolio volume ticking (every 3s)
        const portfolioTicker = setInterval(() => {
            setTotalVolume(prev => prev + (Math.random() * 100));
        }, 3000);

        // Simulate live CC volume ticking (every 1.5s — faster = more alive)
        const ccTicker = setInterval(() => {
            setCcVolume(prev => prev + (Math.random() * 250 + 50));
        }, 1500);

        return () => {
            clearInterval(portfolioTicker);
            clearInterval(ccTicker);
        };
    }, []);

    const handleSaveApiKey = () => {
        localStorage.setItem('GEMINI_API_KEY', apiKey);
        setShowApiKeyInput(false);
        // alert("API Key saved!"); // Removed alert to be less intrusive
    };

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzePortfolio(merchants);
            setAiAnalysis(result);
        } catch (e) {
            console.error("Dashboard analysis failed:", e);
            setAiAnalysis("Portfolio analysis currently unavailable.");
        }
        setIsAnalyzing(false);
    };

    const atRiskCount = merchants.filter(m => m.churnRisk === 'High').length;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Portfolio</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">LIVE FEED CONNECTED</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center"
                    >
                        <Settings className="w-4 h-4 mr-2" /> One82 AI Config
                    </button>
                    <button className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center">
                        <Upload className="w-4 h-4 mr-2" /> Upload Statement
                    </button>
                </div>
            </header>

            {showApiKeyInput && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Configure Gemini AI</h3>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Paste Gemini API Key here..."
                            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        />
                        <button onClick={handleSaveApiKey} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">
                            Save Key
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Key is stored locally in your browser.</p>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Live Portfolio Volume */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Portfolio Volume</p>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                        ${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </h3>
                    <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> live · updating
                    </div>
                </div>

                {/* Live CC Volume Ticker */}
                <div className="bg-indigo-600 p-5 rounded-xl shadow-sm border border-indigo-700">
                    <p className="text-xs text-indigo-200 mb-1 uppercase tracking-wide">CC Volume (Live)</p>
                    <h3 className="text-xl font-bold text-white font-mono tabular-nums">
                        ${ccVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </h3>
                    <div className="mt-2 text-xs text-indigo-200 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> processing now
                    </div>
                </div>

                {/* Merchants Count */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Merchants</p>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{merchants.length}</h3>
                    <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {[...new Set(merchants.map(m => m.businessType))].length} industries
                    </div>
                </div>

                {/* Churn Risk */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Churn Risk</p>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{atRiskCount}</h3>
                    <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> require attention
                    </div>
                </div>
            </div>

            {/* At Risk List & Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* At Risk Merchants */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        At Risk Merchants
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Merchant</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Volume (30d)</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Trend</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Risk Factor</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {merchants.filter(m => m.churnRisk === 'High' || m.churnRisk === 'Medium').map((m) => (
                                    <tr key={m.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-3">
                                            <div className="font-medium text-gray-900 dark:text-white">{m.name}</div>
                                            <div className="text-xs text-gray-500">{m.businessType}</div>
                                        </td>
                                        <td className="py-3 font-mono text-gray-600 dark:text-gray-300">
                                            ${m.monthlyVolume.toLocaleString()}
                                        </td>
                                        <td className="py-3">
                                            {m.trend === 'down' ? (
                                                <div className="flex items-center text-red-500 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit">
                                                    <ArrowDownRight className="w-3 h-3 mr-1" /> -15%
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-gray-400 text-xs">Flat</div>
                                            )}
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${m.churnRisk === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {m.churnRisk}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <button className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline font-medium">
                                                Contact
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Opportunities / Feed */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Opportunities</h2>
                            <button
                                onClick={runAnalysis}
                                disabled={isAnalyzing}
                                className="text-xs flex items-center text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                {isAnalyzing ? 'Analyzing...' : 'Refresh'}
                            </button>
                        </div>

                        {aiAnalysis ? (
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
                                <React.Fragment>
                                    {aiAnalysis.split('\n').map((line, i) => (
                                        <p key={i} className="mb-2 last:mb-0">{line}</p>
                                    ))}
                                </React.Fragment>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/10 border border-gray-100 dark:border-gray-700 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 mb-2">Connect Gemini 1.5 Flash to get real-time portfolio insights.</p>
                                    <button onClick={runAnalysis} className="text-indigo-600 text-xs font-bold">Start Analysis</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Smart Tasks Widget */}
                    <TodoList role="iso" className="h-[300px]" />
                </div>
            </div>

            {/* Excel-style Merchant Ledger */}
            <MerchantLedger merchants={merchants} />
        </div>
    );
};

export default ISODashboard;
