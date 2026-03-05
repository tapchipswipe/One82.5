import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, RotateCw, AlertTriangle } from 'lucide-react';
import { StorageService } from '../services/storage';
import { generateForecastInsights } from '../services/geminiService';
import { getIntegrationKey } from '../services/integrationsConfig';
import { SourceStatusText } from './ProvenanceIndicators';

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const AIReport: React.FC = () => {
  const [narrative, setNarrative] = useState('Generating report...');
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<number>(Date.now());

  const mode = StorageService.getDataMode();
  const isAuthMode = mode === 'backend';
  const hasGeminiKey = getIntegrationKey('gemini').length > 0;
  const metrics = StorageService.getMetrics();
  const transactions = StorageService.getTransactions();

  const summary = useMemo(() => {
    const totalRevenue = metrics.reduce((sum, metric) => sum + metric.revenue, 0);
    const totalTransactions = metrics.reduce((sum, metric) => sum + metric.transactions, 0);
    const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const categoryVolume: Record<string, number> = {};
    transactions.forEach((transaction) => {
      const category = transaction.category || 'Uncategorized';
      categoryVolume[category] = (categoryVolume[category] || 0) + transaction.amount;
    });

    const topCategory = Object.entries(categoryVolume)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Uncategorized';

    const recentWindow = transactions.slice(0, 14);
    const pendingCount = recentWindow.filter((transaction) => transaction.status === 'Pending').length;
    const failedCount = recentWindow.filter((transaction) => transaction.status === 'Failed').length;

    return {
      totalRevenue,
      totalTransactions,
      avgTicket,
      topCategory,
      pendingCount,
      failedCount
    };
  }, [metrics, transactions]);

  const hasTrustedData = metrics.length > 0 && transactions.length > 0;

  const generateReport = useCallback(async (force = false) => {
    if (!hasTrustedData) {
      setNarrative('Report is blocked until trusted transactions and metrics are available. Next step: import transactions or connect a live integration from Integrations.');
      setGeneratedAt(Date.now());
      return;
    }

    const cacheKey = `ai_report_v1_${mode}`;
    const cached = StorageService.getCachedInsight(cacheKey);
    if (cached && !force) {
      setNarrative(cached);
      return;
    }

    setLoading(true);
    const aiNarrative = isAuthMode && !hasGeminiKey
      ? 'AI narrative is unavailable in Auth mode without a configured Gemini integration key. Connect Gemini in Integrations to enable live AI-generated report language.'
      : await generateForecastInsights(metrics);

    const composed = [
      `Executive summary: ${aiNarrative}`,
      `Business snapshot: ${formatCurrency(summary.totalRevenue)} revenue across ${summary.totalTransactions.toLocaleString()} transactions, with an average ticket of ${formatCurrency(summary.avgTicket)}.`,
      `Primary driver: ${summary.topCategory} is the highest-volume category in current data.`
    ].join('\n\n');

    setNarrative(composed);
    setGeneratedAt(Date.now());
    StorageService.setCachedInsight(cacheKey, composed);
    setLoading(false);
  }, [hasGeminiKey, hasTrustedData, isAuthMode, metrics, mode, summary.avgTicket, summary.topCategory, summary.totalRevenue, summary.totalTransactions]);

  useEffect(() => {
    void generateReport(false);
  }, [generateReport]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            AI Report
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">One-page business report generated from your available transaction and metric data.</p>
        </div>

        <button
          onClick={() => void generateReport(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Report
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <SourceStatusText className="font-semibold" />
          <p>Generated: {new Date(generatedAt).toLocaleString()}</p>
        </div>
      </div>

      {!hasTrustedData && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <p>Report quality is limited until transactions and metrics are available. Import or connect data sources from Integrations.</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">Report Narrative</h3>
        <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {narrative.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIReport;