import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Bell, Building2, ClipboardList, CreditCard, Shield, ShieldCheck, Sparkles, Users, Wrench } from 'lucide-react';
import { SimulationService } from '../services/simulationService';
import { StorageService } from '../services/storage';
import { INTEGRATIONS, isIntegrationConnected, LIVE_INTEGRATIONS_ENABLED } from '../services/integrationsConfig';
import { SourceStatusText } from './ProvenanceIndicators';

type InterventionStatus = 'open' | 'in_progress' | 'done';

interface InterventionItem {
  id: string;
  isoName: string;
  target: string;
  issue: string;
  slaHours: number;
  status: InterventionStatus;
}

interface PolicySettings {
  alertRiskThreshold: number;
  maxDailyCreditBurn: number;
  minimumBpsFloor: number;
}

interface PolicyAudit {
  id: string;
  actor: string;
  action: string;
  timestamp: number;
}

interface IsoScorecard {
  name: string;
  managedMerchants: number;
  retentionRate: number;
  avgResponseHours: number;
  profitIndex: number;
}

interface OpsSummary {
  latestSyncStatus: string;
  latestSyncAt: string | null;
  failedSyncRuns: number;
  runningSyncRuns: number;
  events24h: number;
  latestEventType: string | null;
  latestEventAt: string | null;
}

const OverseerDashboard: React.FC = () => {
  const isDemoMode = StorageService.getDataMode() === 'demo';
  const [portfolioVolume, setPortfolioVolume] = useState(0);
  const [liveVolume, setLiveVolume] = useState(0);
  const [focusedMerchantId, setFocusedMerchantId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicySettings>({
    alertRiskThreshold: 70,
    maxDailyCreditBurn: 180,
    minimumBpsFloor: 22
  });
  const [policyAudit, setPolicyAudit] = useState<PolicyAudit[]>([
    {
      id: 'policy-seed-1',
      actor: 'Overseer',
      action: 'Initialized platform guardrail defaults',
      timestamp: Date.now() - 1000 * 60 * 90
    }
  ]);
  const [interventions, setInterventions] = useState<InterventionItem[]>([
    {
      id: 'iv-1',
      isoName: 'ISO East',
      target: "Joe's Pizza",
      issue: 'High churn risk and declining trend',
      slaHours: 12,
      status: 'open'
    },
    {
      id: 'iv-2',
      isoName: 'ISO Central',
      target: 'Corner Market',
      issue: 'Health score below threshold',
      slaHours: 8,
      status: 'in_progress'
    },
    {
      id: 'iv-3',
      isoName: 'ISO West',
      target: 'Boutique 82',
      issue: 'Flat trend with medium churn profile',
      slaHours: 24,
      status: 'open'
    }
  ]);
  const [opsSummary, setOpsSummary] = useState<OpsSummary>({
    latestSyncStatus: 'none',
    latestSyncAt: null,
    failedSyncRuns: 0,
    runningSyncRuns: 0,
    events24h: 0,
    latestEventType: null,
    latestEventAt: null
  });
  const [opsAvailable, setOpsAvailable] = useState(false);

  const merchants = useMemo(() => isDemoMode ? SimulationService.generatePortfolio() : [], [isDemoMode]);
  const transactions = StorageService.getTransactions();
  const notifications = StorageService.getNotifications();

  useEffect(() => {
    const basePortfolioVolume = merchants.reduce((sum, merchant) => sum + merchant.monthlyVolume, 0);
    setPortfolioVolume(basePortfolioVolume);
    setLiveVolume(basePortfolioVolume * 0.42);

    if (!isDemoMode) {
      return;
    }

    const ticker = setInterval(() => {
      setPortfolioVolume((current) => current + Math.random() * 120);
      setLiveVolume((current) => current + Math.random() * 90 + 20);
    }, 2200);

    return () => clearInterval(ticker);
  }, [isDemoMode, merchants]);

  useEffect(() => {
    let mounted = true;

    const loadOpsSummary = async () => {
      try {
        const response = await fetch('/api/data/ops?limit=25');
        if (!response.ok) {
          if (mounted) {
            setOpsAvailable(false);
          }
          return;
        }

        const payload = await response.json() as { summary?: OpsSummary };
        if (!mounted) return;

        if (payload?.summary) {
          setOpsSummary(payload.summary);
          setOpsAvailable(true);
          return;
        }

        setOpsAvailable(false);
      } catch {
        if (mounted) {
          setOpsAvailable(false);
        }
      }
    };

    void loadOpsSummary();
    const interval = window.setInterval(() => {
      void loadOpsSummary();
    }, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const atRiskMerchants = merchants.filter((merchant) => merchant.churnRisk === 'High');
  const activeMerchants = merchants.filter((merchant) => merchant.status === 'Active').length;
  const isoCount = isDemoMode ? 3 : 0;
  const openAlerts = notifications.filter((notification) => !notification.read).length;

  const riskRadar = useMemo(() => {
    if (!isDemoMode || merchants.length === 0) {
      return [];
    }

    const grouped = [
      {
        isoName: 'ISO East',
        merchants: merchants.filter((merchant) => merchant.businessType === 'Restaurant' || merchant.businessType === 'Retail')
      },
      {
        isoName: 'ISO Central',
        merchants: merchants.filter((merchant) => merchant.businessType === 'Service' || merchant.businessType === 'Convenience Store')
      },
      {
        isoName: 'ISO West',
        merchants: merchants.filter((merchant) => merchant.businessType === 'E-Commerce' || merchant.businessType === 'Retail')
      }
    ];

    return grouped
      .map((entry) => {
        const merchantCount = Math.max(entry.merchants.length, 1);
        const avgHealth = entry.merchants.reduce((sum, merchant) => sum + merchant.healthScore, 0) / merchantCount;
        const highRisk = entry.merchants.filter((merchant) => merchant.churnRisk === 'High').length;
        const downward = entry.merchants.filter((merchant) => merchant.trend === 'down').length;
        const riskScore = Math.min(100, Math.round((highRisk * 22) + (downward * 15) + (100 - avgHealth) * 0.35));

        return {
          isoName: entry.isoName,
          merchantCount,
          highRisk,
          downward,
          avgHealth: Math.round(avgHealth),
          riskScore
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [isDemoMode, merchants]);

  const integrationHealth = useMemo(() => {
    return INTEGRATIONS.map((integration) => {
      const connected = isIntegrationConnected(integration.id);
      const freshnessMinutes = connected ? Math.max(2, Math.round((integration.id.length * 17) % 54)) : null;

      return {
        id: integration.id,
        name: integration.name,
        connected,
        freshnessMinutes,
          modeLabel: LIVE_INTEGRATIONS_ENABLED && connected ? 'Live' : (isDemoMode ? 'Simulated' : 'Not Connected')
      };
    });
  }, [isDemoMode]);

  const scorecards = useMemo<IsoScorecard[]>(() => {
    return riskRadar.map((entry, index) => {
      const retentionRate = Math.max(78, 97 - entry.highRisk * 4 - entry.downward * 2);
      const avgResponseHours = Math.max(2, 16 - index * 3 + entry.highRisk);
      const profitIndex = Math.max(52, Math.round(100 - entry.riskScore * 0.35 + entry.avgHealth * 0.25));

      return {
        name: entry.isoName,
        managedMerchants: entry.merchantCount,
        retentionRate,
        avgResponseHours,
        profitIndex
      };
    });
  }, [riskRadar]);

  const executiveNarrative = useMemo(() => {
    const topRisk = riskRadar[0];
    const connectedCount = integrationHealth.filter((integration) => integration.connected).length;
    const openInterventions = interventions.filter((item) => item.status !== 'done').length;
    const bestIso = [...scorecards].sort((a, b) => b.profitIndex - a.profitIndex)[0];

    return [
      topRisk
        ? `${topRisk.isoName} is currently the highest-risk portfolio (${topRisk.riskScore}) with ${topRisk.highRisk} high-risk merchants.`
        : 'Risk radar is stable with no critical outliers.',
      `${openInterventions} interventions are active; prioritize the lowest-SLA queue before end of day.`,
      `${connectedCount} of ${integrationHealth.length} integrations are live; remaining sources are ${isDemoMode ? 'in simulated mode' : 'not connected yet'}.`,
      bestIso
        ? `${bestIso.name} leads performance with a profit index of ${bestIso.profitIndex} and retention at ${bestIso.retentionRate}%.`
        : 'ISO scorecards are collecting baseline metrics.'
    ];
  }, [integrationHealth, interventions, isDemoMode, riskRadar, scorecards]);

  const updateInterventionStatus = (id: string, status: InterventionStatus): void => {
    setInterventions((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  };

  const updatePolicy = (partial: Partial<PolicySettings>, description: string): void => {
    setPolicy((current) => ({ ...current, ...partial }));
    setPolicyAudit((current) => [
      {
        id: `policy-${Date.now()}`,
        actor: 'Overseer',
        action: description,
        timestamp: Date.now()
      },
      ...current
    ].slice(0, 8));
  };

  const liveAlerts = useMemo(() => {
    const riskAlerts = merchants
      .filter((merchant) => merchant.churnRisk === 'High' || merchant.trend === 'down')
      .slice(0, 3)
      .map((merchant) => ({
        id: `risk_${merchant.id}`,
        title: `${merchant.name} flagged`,
        detail: `${merchant.churnRisk} churn risk · trend ${merchant.trend}`,
        merchantId: merchant.id,
        tone: merchant.churnRisk === 'High' ? 'critical' : 'warning' as 'critical' | 'warning' | 'info'
      }));

    const appAlerts = notifications.slice(0, 3).map((notification) => ({
      id: `notif_${notification.id}`,
      title: notification.title,
      detail: notification.message,
      merchantId: null,
      tone: notification.type === 'alert' ? 'critical' : 'info' as 'critical' | 'warning' | 'info'
    }));

    return [...riskAlerts, ...appAlerts].slice(0, 6);
  }, [merchants, notifications]);

  const handleAlertClick = (merchantId: string | null): void => {
    if (!merchantId) return;

    setFocusedMerchantId(merchantId);

    const row = document.getElementById(`overseer-merchant-${merchantId}`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.setTimeout(() => {
      setFocusedMerchantId((current) => (current === merchantId ? null : current));
    }, 1800);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              Overseer Command Center
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Owner-only live view of system-wide health across merchant, ISO, and processing activity.
            </p>
            <SourceStatusText className="text-xs text-gray-500 mt-2" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
            </span>
            Live Operations View
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">KPI Strip</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Portfolio Volume"
          value={`$${Math.round(portfolioVolume).toLocaleString()}`}
          subtitle="All merchants combined"
          icon={<Activity className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="Live Processing"
          value={`$${Math.round(liveVolume).toLocaleString()}`}
          subtitle="Streaming transaction estimate"
          icon={<CreditCard className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="Active Merchants"
          value={activeMerchants.toString()}
          subtitle="Currently active accounts"
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="ISO Organizations"
          value={isoCount.toString()}
          subtitle="Connected portfolio operators"
          icon={<Building2 className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="Open Alerts"
          value={openAlerts.toString()}
          subtitle="Needs owner attention"
          icon={<Bell className="w-5 h-5 text-indigo-600" />}
        />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Ops Health</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Latest Sync</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{opsAvailable ? opsSummary.latestSyncStatus : 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">{opsSummary.latestSyncAt ? new Date(opsSummary.latestSyncAt).toLocaleString() : 'No sync data yet'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Failed Sync Runs</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{opsAvailable ? opsSummary.failedSyncRuns : 0}</p>
            <p className="text-xs text-gray-500 mt-1">Last 25 runs sample</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Running Syncs</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{opsAvailable ? opsSummary.runningSyncRuns : 0}</p>
            <p className="text-xs text-gray-500 mt-1">In-progress pipelines</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Events (24h)</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{opsAvailable ? opsSummary.events24h : 0}</p>
            <p className="text-xs text-gray-500 mt-1">Latest: {opsSummary.latestEventType || 'none'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Global Risk Radar</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {riskRadar.length > 0 ? riskRadar.map((entry) => (
            <div key={entry.isoName} className={`rounded-xl border p-4 ${entry.riskScore >= policy.alertRiskThreshold ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">{entry.isoName}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.riskScore >= policy.alertRiskThreshold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  Risk {entry.riskScore}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Merchants: {entry.merchantCount} · High risk: {entry.highRisk} · Downward trends: {entry.downward}</p>
              <p className="text-xs text-gray-500 mt-1">Average health: {entry.avgHealth}/100</p>
            </div>
          )) : (
            <div className="md:col-span-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              No live portfolio risk data yet in Auth/Trial mode. Import transactions or connect integrations to activate risk radar.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-gray-900">High-Risk Merchants</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {atRiskMerchants.length > 0 ? atRiskMerchants.map((merchant) => (
              <div
                id={`overseer-merchant-${merchant.id}`}
                key={merchant.id}
                className={`px-5 py-3 flex items-center justify-between transition-colors ${focusedMerchantId === merchant.id ? 'bg-amber-50' : ''}`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{merchant.name}</p>
                  <p className="text-xs text-gray-500">{merchant.businessType} · Health {merchant.healthScore}/100</p>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-50 rounded-full px-2 py-1">High Risk</span>
              </div>
            )) : (
              <div className="px-5 py-6 text-sm text-gray-500">
                No high-risk merchant signals yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            <div>
              <h2 className="font-semibold text-gray-900">Intervention Command Queue</h2>
              <p className="text-[11px] text-gray-500">Assign and track owner-priority interventions with SLA context.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {interventions.length > 0 ? (
              interventions.map((item) => (
                <div key={item.id} className="px-5 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.issue}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.isoName} · Target: {item.target} · SLA {item.slaHours}h</p>
                    </div>
                    <select
                      value={item.status}
                      onChange={(event) => updateInterventionStatus(item.id, event.target.value as InterventionStatus)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-6 text-sm text-gray-500">No active interventions.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">System Health + Data Trust</h2>
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3 text-sm">
              <SnapshotRow label="Data mode" value={StorageService.getDataMode() === 'backend' ? 'Live Backend' : 'Simulated Demo'} />
              <SnapshotRow label="Total loaded transactions" value={transactions.length.toString()} />
              <SnapshotRow label="Unread notifications" value={StorageService.getNotifications().filter(n => !n.read).length.toString()} />
              <SnapshotRow label="Overseer visibility" value="Merchant + ISO operation surface" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Integration Freshness</p>
              </div>
              <div className="divide-y divide-gray-200">
                {integrationHealth.map((integration) => (
                  <div key={integration.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{integration.name}</p>
                      <p className="text-xs text-gray-500">Mode: {integration.modeLabel}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${integration.connected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {integration.connected ? `${integration.freshnessMinutes}m fresh` : (isDemoMode ? 'Simulated' : 'Not Connected')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Policy & Guardrail Center</h2>
          </div>
          <div className="p-5 space-y-4">
            <PolicyControl
              label="Risk alert threshold"
              value={policy.alertRiskThreshold}
              min={40}
              max={95}
              unit=""
              onChange={(value) => updatePolicy({ alertRiskThreshold: value }, `Updated risk alert threshold to ${value}`)}
            />
            <PolicyControl
              label="Max daily credit burn"
              value={policy.maxDailyCreditBurn}
              min={50}
              max={500}
              unit="credits"
              onChange={(value) => updatePolicy({ maxDailyCreditBurn: value }, `Updated max daily credit burn to ${value}`)}
            />
            <PolicyControl
              label="Minimum BPS floor"
              value={policy.minimumBpsFloor}
              min={10}
              max={60}
              unit="bps"
              onChange={(value) => updatePolicy({ minimumBpsFloor: value }, `Updated minimum BPS floor to ${value}`)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <h2 className="font-semibold text-gray-900">Policy Audit Trail</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {policyAudit.map((entry) => (
              <div key={entry.id} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                <p className="text-xs text-gray-500 mt-1">{entry.actor} · {new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">ISO Scorecards</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase">ISO</th>
                  <th className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Merchants</th>
                  <th className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Retention</th>
                  <th className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Response</th>
                  <th className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Profit Index</th>
                </tr>
              </thead>
              <tbody>
                {scorecards.map((card) => (
                  <tr key={card.name} className="border-b border-gray-100">
                    <td className="px-5 py-3 font-medium text-gray-900">{card.name}</td>
                    <td className="px-5 py-3 text-gray-600">{card.managedMerchants}</td>
                    <td className="px-5 py-3 text-gray-600">{card.retentionRate}%</td>
                    <td className="px-5 py-3 text-gray-600">{card.avgResponseHours}h</td>
                    <td className="px-5 py-3 text-gray-900 font-semibold">{card.profitIndex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Executive Narrative Feed</h2>
          </div>
          <div className="p-5 space-y-3">
            {executiveNarrative.map((line, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-sm text-gray-700">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PolicyControl = ({
  label,
  value,
  min,
  max,
  unit,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) => (
  <div>
    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
      <span>{label}</span>
      <span className="font-semibold">{value}{unit ? ` ${unit}` : ''}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full"
    />
  </div>
);

const MetricCard = ({
  title,
  value,
  subtitle,
  icon
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{title}</p>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
  </div>
);

const SnapshotRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

export default OverseerDashboard;
