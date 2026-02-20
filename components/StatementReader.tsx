import React, { useState } from 'react';
import {
  Upload, FileText, Loader2, File as FileIcon,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CreditCard, DollarSign, Activity, ShieldCheck, BarChart2
} from 'lucide-react';
import { analyzeStatementFull } from '../services/geminiService';
import { MerchantStatementAnalysis } from '../types';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const CARD_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6'];

const RiskBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' }) => {
  const styles = {
    Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${styles[level]}`}>{level} Risk</span>;
};

const GrowthBadge = ({ pattern }: { pattern: 'Growing' | 'Stable' | 'Shrinking' }) => {
  if (pattern === 'Growing') return <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><TrendingUp className="w-4 h-4" /> Growing</span>;
  if (pattern === 'Shrinking') return <span className="flex items-center gap-1 text-red-600 font-bold text-sm"><TrendingDown className="w-4 h-4" /> Shrinking</span>;
  return <span className="flex items-center gap-1 text-gray-500 font-bold text-sm"><Minus className="w-4 h-4" /> Stable</span>;
};

const StatCard = ({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex items-start gap-4">
    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5 italic">{sub}</p>}
    </div>
  </div>
);

const StatementReader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<MerchantStatementAnalysis | null>(null);
  const [volumeToggle, setVolumeToggle] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
      setData(null);
    }
  };

  const onAnalyze = async () => {
    setAnalyzing(true);
    // Pass empty string if no file — simulation mode handles it
    const base64 = preview ? preview.split(',')[1] : '';
    const mime = file?.type || 'application/pdf';
    const result = await analyzeStatementFull(base64, mime);
    setData(result);
    setAnalyzing(false);
  };

  // Also allow demo run without a file
  const onDemoRun = async () => {
    setAnalyzing(true);
    const result = await analyzeStatementFull('', 'application/pdf');
    setData(result);
    setAnalyzing(false);
  };

  const cardBrandData = data ? [
    { name: 'Visa', value: data.cardBrandMix.visa, rate: data.interchangeByBrand.visa },
    { name: 'Mastercard', value: data.cardBrandMix.mastercard, rate: data.interchangeByBrand.mastercard },
    { name: 'Amex', value: data.cardBrandMix.amex, rate: data.interchangeByBrand.amex },
    { name: 'Discover', value: data.cardBrandMix.discover, rate: data.interchangeByBrand.discover },
  ] : [];

  const methodData = data ? [
    { name: 'Swiped', value: data.swipedPercent, fill: '#22c55e' },
    { name: 'Keyed', value: data.keyedPercent, fill: '#ef4444' },
  ] : [];

  const paymentTypeData = data ? [
    { name: 'Credit', value: data.creditPercent, fill: '#6366f1' },
    { name: 'Debit', value: data.debitPercent, fill: '#22c55e' },
  ] : [];

  const displayVolume = data
    ? volumeToggle === 'daily' ? data.dailyVolume
      : volumeToggle === 'monthly' ? data.monthlyVolume
        : data.yearlyVolume
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-indigo-600" />
            Merchant Statement Analyzer
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload a PDF or image — AI extracts full interchange, risk, and profitability data.
          </p>
        </div>
        <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-medium border border-indigo-100 dark:border-indigo-900/30">
          Simulation Ready
        </span>
      </div>

      {/* Upload + Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div
            onClick={() => document.getElementById('stmt-upload')?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-gray-800 transition-all h-48"
          >
            <input id="stmt-upload" type="file" className="hidden" accept="image/*,application/pdf" onChange={onFileChange} />
            {file ? (
              <div className="text-center">
                {file.type.includes('pdf') ? <FileIcon className="w-10 h-10 text-red-500 mx-auto mb-2" /> : <img src={preview!} className="max-h-24 rounded mb-2 mx-auto" />}
                <p className="text-sm font-bold truncate max-w-[180px] text-gray-700 dark:text-gray-300">{file.name}</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 text-center">Click to upload PDF or Image</p>
              </>
            )}
          </div>
          <button
            onClick={file ? onAnalyze : onDemoRun}
            disabled={analyzing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {analyzing ? <><Loader2 className="animate-spin w-5 h-5" /> Analyzing...</> : (file ? 'Run AI Analysis' : 'Run Demo Analysis')}
          </button>
        </div>

        {/* Merchant Overview */}
        {data ? (
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{data.merchantName}</h3>
                <p className="text-sm text-gray-500 mt-0.5">MCC {data.mccCode} — {data.mccDescription}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <RiskBadge level={data.riskLevel} />
                <GrowthBadge pattern={data.growthPattern} />
              </div>
            </div>

            {/* Volume Toggle */}
            <div className="flex gap-2 mb-4">
              {(['daily', 'monthly', 'yearly'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setVolumeToggle(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors capitalize ${volumeToggle === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                ${displayVolume.toLocaleString()}
              </span>
              <span className="text-sm text-gray-400 mb-1">{volumeToggle} volume</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Avg Ticket Size</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">${data.avgTicketSize.toFixed(2)}</p>
                <p className="text-xs text-gray-400 italic mt-0.5">
                  {data.avgTicketSize > 50 ? 'High ticket → lower per-txn fee' : 'Low ticket → higher per-txn fee'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Blended Rate</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{data.blendedRate.toFixed(2)}%</p>
                <p className="text-xs text-gray-400 italic mt-0.5">{data.txnCount.toLocaleString()} transactions</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <p className="text-gray-400 italic text-sm">Analysis results will appear here</p>
          </div>
        )}
      </div>

      {/* Interchange & Processing Section */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Brand Mix */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-500" /> Card Brand Mix
              </h4>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={cardBrandData} dataKey="value" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name} ${value}%`} labelLine={false} fontSize={10}>
                    {cardBrandData.map((_, i) => <Cell key={i} fill={CARD_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v, name, props) => [`${v}% volume / ${props.payload.rate}% interchange`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {cardBrandData.map((item, i) => (
                  <div key={item.name} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: CARD_COLORS[i] }} />
                      {item.name}
                    </span>
                    <span className="font-mono">{item.value}% vol · {item.rate}% int.</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Method vs Payment Type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" /> Processing Method
              </h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={methodData} layout="vertical" barSize={24}>
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="value" radius={4}>
                    {methodData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 italic mt-2">
                {data.keyedPercent > 30 ? '⚠️ High keyed % — elevated risk & interchange' : '✅ Mostly swiped — lower risk profile'}
              </p>

              <h4 className="font-bold text-gray-900 dark:text-white mt-5 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-500" /> Debit vs Credit
              </h4>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={paymentTypeData} layout="vertical" barSize={20}>
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="value" radius={4}>
                    {paymentTypeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Profitability */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> Profitability
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Total Residual</span>
                    <span className="font-bold text-green-600">${data.totalResidual}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Support Cost</span>
                    <span className="font-bold text-red-500">-${data.supportCost}/mo</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Net Profit</span>
                    <span className={`text-sm font-bold ${data.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${data.netProfit}/mo
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Attrition Risk</span>
                    <RiskBadge level={data.attritionRisk} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Growth Pattern</span>
                    <GrowthBadge pattern={data.growthPattern} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Vol Fluctuation</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{data.fluctuationRate}% MoM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary insight row */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-5">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> ISO Recommendation
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              This merchant ({data.merchantName}) is a <strong>{data.riskLevel.toLowerCase()} risk</strong> account in the <strong>{data.mccDescription}</strong> category.
              With {data.keyedPercent}% keyed transactions and a blended rate of {data.blendedRate}%, there is a potential to
              {data.blendedRate > 2.5 ? ' renegotiate pricing to improve retention.' : ' maintain current rate structure.'}
              {data.attritionRisk === 'High' && ' ⚠️ Immediate outreach recommended — high attrition risk detected.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default StatementReader;
