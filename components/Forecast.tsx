import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, RotateCw } from 'lucide-react';
import { StorageService } from '@/services/storage';
import { generateForecastInsights } from '@/services/geminiService';
import { CalendarEvent } from '@/types';
import { SourceStatusText } from './ProvenanceIndicators';

interface ForecastProps {
  onNavigate?: (view: string) => void;
}

interface ForecastDataPoint {
  date: string;
  revenue: number;
  type: 'historical' | 'projected';
}

const Forecast: React.FC<ForecastProps> = ({ onNavigate }) => {
  const [data, setData] = useState<ForecastDataPoint[]>([]);
  const [insight, setInsight] = useState('Analyzing trends...');
  const [loading, setLoading] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [lastAiRunAt, setLastAiRunAt] = useState<number | null>(() => StorageService.getAiLastRunAt('forecast'));
  const [blockedAction, setBlockedAction] = useState<{ label: string; target: string } | null>(null);
  const [projectionConfidence, setProjectionConfidence] = useState<number | null>(null);

  const settings = StorageService.getSettings();
  const isAuthMode = StorageService.getDataMode() === 'backend';
  const cacheKey = useMemo(() => `forecast_insight_${settings.aiResponseStyle}`, [settings.aiResponseStyle]);
  const showConfidence = settings.showAiConfidenceInProjections;

  const markAiRun = useCallback(() => {
    const timestamp = Date.now();
    StorageService.setAiLastRunAt('forecast', timestamp);
    setLastAiRunAt(timestamp);
  }, []);

  const fetchForecast = useCallback(async (force: boolean = false) => {
    const historical = StorageService.getMetrics();
    const calendarEvents = await StorageService.getCalendarEventsResolved('merchant');
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 14);
    const nearTermEvents = calendarEvents.filter((event) => {
      const eventDate = new Date(`${event.date}T00:00:00`);
      return eventDate >= now && eventDate <= horizon;
    });
    setUpcomingEvents(nearTermEvents);

    // Simple mock projection logic
    const lastDay = historical[historical.length - 1];
    const projected: ForecastDataPoint[] = [];
    // TODO: Replace mock projection with real AI-driven forecast once data pipeline is live.
    // Anchor to seed value to prevent compounding jumps on refresh.
    const seedRevenue = lastDay?.revenue ?? 0;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const randomDelta = (window.crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) * 0.02 - 0.01;
      const projectionDate = new Date();
      projectionDate.setDate(projectionDate.getDate() + i + 1);
      const projectionDateKey = projectionDate.toISOString().slice(0, 10);

      const eventImpact = nearTermEvents
        .filter((event) => event.date === projectionDateKey)
        .reduce((sum, event) => {
          if (event.impactDirection === 'neutral') return sum;
          const directionalImpact = event.impactDirection === 'up' ? event.impactPercent : -event.impactPercent;
          return sum + directionalImpact / 100;
        }, 0);

      const combinedDelta = Math.max(-0.05, Math.min(0.08, randomDelta + eventImpact));
      const projectedRevenue = seedRevenue * (1 + combinedDelta * (i + 1));
      projected.push({
        date: `Next ${days[i]}`,
        revenue: Math.round(projectedRevenue),
        type: 'projected'
      });
    }

    setData([
      ...historical.map((h) => ({ ...h, type: 'historical' as const })),
      ...projected
    ]);

    const rawConfidence = 62 + Math.min(24, historical.length * 2) - Math.min(10, nearTermEvents.length * 2);
    setProjectionConfidence(Math.max(35, Math.min(95, Math.round(rawConfidence))));

    if (isAuthMode && historical.length === 0) {
      setInsight('Forecast AI is blocked in Auth Login until trusted metrics are available. Import transactions to continue.');
      setBlockedAction({ label: 'Import Data', target: 'transactions' });
      markAiRun();
      return;
    }

    setBlockedAction(null);
    // Check Cache
    const cached = StorageService.getCachedInsight(cacheKey);
    if (cached && !force) {
      setInsight(cached);
      markAiRun();
      return;
    }

    setLoading(true);
    const text = await generateForecastInsights(historical);
    setInsight(text);
    StorageService.setCachedInsight(cacheKey, text);
    markAiRun();
    setLoading(false);
  }, [cacheKey, isAuthMode, markAiRun]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Revenue Forecast</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">AI-powered projection for the next 7 days.</p>
          <SourceStatusText className="text-xs text-slate-500 dark:text-slate-400 mt-2" />
        </div>
        <button
          onClick={() => fetchForecast(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </button>
      </div>

      <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded-xl border border-indigo-300 dark:border-indigo-700 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-indigo-950 dark:text-white text-sm">AI Outlook</h4>
          {lastAiRunAt && <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mb-1">Last AI run: {new Date(lastAiRunAt).toLocaleTimeString()}</p>}
          <p className="text-sm text-indigo-900 dark:text-indigo-50">{insight}</p>
          {blockedAction && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(blockedAction.target)}
              className="mt-2 inline-flex items-center rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-slate-700"
            >
              {blockedAction.label}
            </button>
          )}
          {showConfidence && projectionConfidence !== null && (
            <p className="mt-2 text-xs font-semibold text-indigo-800 dark:text-indigo-200">
              Model confidence: {projectionConfidence}%
            </p>
          )}
          {upcomingEvents.length > 0 && (
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
              Forecast adjusted using {upcomingEvents.length} upcoming calendar event{upcomingEvents.length === 1 ? '' : 's'}.
            </p>
          )}
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Upcoming Calendar Signals</h4>
          <div className="space-y-1">
            {upcomingEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-3">
                <span>{event.date} · {event.title}</span>
                <span className={`font-semibold ${event.impactDirection === 'up' ? 'text-green-600 dark:text-green-400' : event.impactDirection === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {event.impactDirection === 'neutral' ? 'neutral' : `${event.impactDirection === 'up' ? '+' : '-'}${event.impactPercent}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              fill="url(#colorHist)"
              strokeWidth={3}
              name="Historical"
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeDasharray="5 5"
              fill="url(#colorProj)"
              strokeWidth={3}
              name="Projected"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Forecast;