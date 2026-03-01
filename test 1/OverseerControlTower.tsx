import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  Filter,
  Fingerprint,
  GitBranch,
  Network,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';
import { SimulationService, PortfolioMerchant } from '../services/simulationService';
import { StorageService } from '../services/storage';

type TimeWindow = '24h' | '7d' | '30d';
type RiskFilter = 'all' | 'high' | 'medium';
type AlertState = 'open' | 'acked' | 'escalated' | 'resolved';
type Severity = 'critical' | 'warning' | 'info';
type TenantLabel = 'Northstar ISO' | 'Bluefin ISO' | 'Pioneer ISO' | 'Summit ISO';

interface TenantHealth {
  tenant: TenantLabel;
  merchants: number;
  highRisk: number;
  openAlerts: number;
  triageRate: number;
  stabilityScore: number;
}

interface DriverInsight {
  id: string;
  title: string;
  deltaLabel: string;
  impact: 'positive' | 'negative';
  rationale: string;
}

interface PolicyRule {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

interface AnomalySignal {
  id: string;
  tenant: TenantLabel;
  metric: string;
  observed: string;
  baseline: string;
  severity: Severity;
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  confidence: number;
  signature: string;
  timestamp: number;
}

interface TriageAlert {
  id: string;
  title: string;
  detail: string;
  merchantId: string | null;
  severity: Severity;
  status: AlertState;
  owner: string;
  dueDate: string;
  createdAt: number;
}

interface Recommendation {
  merchantId: string;
  merchantName: string;
  risk: PortfolioMerchant['churnRisk'];
  action: string;
  expectedRetentionLift: number;
  expectedMarginImpact: number;
  confidence: number;
}

const todayPlus = (days: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
};

const TENANTS: TenantLabel[] = ['Northstar ISO', 'Bluefin ISO', 'Pioneer ISO', 'Summit ISO'];

const signatureFor = (value: string): string => {
  const base = value
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 17), 0);
  return `sig_${base.toString(16).slice(0, 10)}`;
};

const deltaForWindow = (window: TimeWindow): { volume: number; alerts: number; risk: number } => {
  if (window === '24h') return { volume: 2.9, alerts: -6.5, risk: -1.3 };
  if (window === '7d') return { volume: 7.4, alerts: -11.1, risk: -2.2 };
  return { volume: 14.8, alerts: -18.7, risk: -4.1 };
};

const seedAlerts = (merchants: PortfolioMerchant[]): TriageAlert[] => {
  const riskAlerts = merchants
    .filter((merchant) => merchant.churnRisk !== 'Low' || merchant.trend === 'down')
    .slice(0, 7)
    .map((merchant, index) => ({
      id: `risk_${merchant.id}`,
      title: `${merchant.name} needs intervention`,
      detail: `${merchant.churnRisk} churn risk · trend ${merchant.trend} · health ${merchant.healthScore}/100`,
      merchantId: merchant.id,
      severity: merchant.churnRisk === 'High' ? 'critical' : 'warning' as Severity,
      status: 'open' as AlertState,
      owner: index % 2 === 0 ? 'Unassigned' : 'Owner Desk',
      dueDate: todayPlus(index % 3 === 0 ? 1 : 3),
      createdAt: Date.now() - (index + 1) * 1000 * 60 * 15
    }));

  const appAlerts = StorageService.getNotifications().slice(0, 4).map((notification, index) => ({
    id: `app_${notification.id}`,
    title: notification.title,
    detail: notification.message,
    merchantId: null,
    severity: (notification.type === 'alert' ? 'critical' : 'info') as Severity,
    status: 'open' as AlertState,
    owner: 'Unassigned',
    dueDate: todayPlus(index < 2 ? 1 : 2),
    createdAt: notification.timestamp
  }));

  return [...riskAlerts, ...appAlerts].sort((a, b) => b.createdAt - a.createdAt);
};

const buildRecommendations = (merchants: PortfolioMerchant[]): Recommendation[] => {
  return merchants
    .filter((merchant) => merchant.churnRisk !== 'Low')
    .map((merchant) => {
      const riskWeight = merchant.churnRisk === 'High' ? 20 : 10;
      const trendWeight = merchant.trend === 'down' ? 12 : 4;
      const confidence = Math.min(95, Math.max(58, 100 - merchant.healthScore + riskWeight + trendWeight));
      const expectedRetentionLift = Math.max(2, Math.round((confidence / 8) + (merchant.churnRisk === 'High' ? 6 : 2)));
      const expectedMarginImpact = Math.round((merchant.monthlyVolume * (merchant.bps / 10000)) * (expectedRetentionLift / 100));

      const action = merchant.trend === 'down'
        ? 'Run retention offer + executive outreach + 7-day follow-up'
        : 'Execute value reinforcement call + reprice review';

      return {
        merchantId: merchant.id,
        merchantName: merchant.name,
        risk: merchant.churnRisk,
        action,
        expectedRetentionLift,
        expectedMarginImpact,
        confidence
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
};

const tenantForMerchant = (merchant: PortfolioMerchant, index: number): TenantLabel => {
  if (merchant.id.endsWith('1') || merchant.id.endsWith('5')) return 'Northstar ISO';
  if (merchant.id.endsWith('2') || merchant.id.endsWith('6')) return 'Bluefin ISO';
  if (merchant.id.endsWith('3') || merchant.id.endsWith('7')) return 'Pioneer ISO';
  return TENANTS[index % TENANTS.length];
};

const buildAnomalies = (merchants: PortfolioMerchant[]): AnomalySignal[] => {
  const byTenant = TENANTS.map((tenant) => {
    const tenantMerchants = merchants.filter((merchant, index) => tenantForMerchant(merchant, index) === tenant);
    const avgHealth = tenantMerchants.length === 0
      ? 0
      : Math.round(tenantMerchants.reduce((sum, merchant) => sum + merchant.healthScore, 0) / tenantMerchants.length);
    const downTrend = tenantMerchants.filter((merchant) => merchant.trend === 'down').length;
    const highRisk = tenantMerchants.filter((merchant) => merchant.churnRisk === 'High').length;
    const avgVolume = tenantMerchants.length === 0
      ? 0
      : Math.round(tenantMerchants.reduce((sum, merchant) => sum + merchant.monthlyVolume, 0) / tenantMerchants.length);

    return { tenant, avgHealth, downTrend, highRisk, avgVolume };
  });

  return byTenant
    .flatMap((row) => {
      const signals: AnomalySignal[] = [];

      if (row.avgHealth < 63) {
        signals.push({
          id: `${row.tenant}_health`,
          tenant: row.tenant,
          metric: 'Average Health Score',
          observed: `${row.avgHealth}/100`,
          baseline: '72/100',
          severity: 'critical'
        });
      }

      if (row.downTrend >= 2) {
        signals.push({
          id: `${row.tenant}_trend`,
          tenant: row.tenant,
          metric: 'Downtrend Merchant Count',
          observed: row.downTrend.toString(),
          baseline: '1',
          severity: 'warning'
        });
      }

      if (row.highRisk >= 1) {
        signals.push({
          id: `${row.tenant}_risk`,
          tenant: row.tenant,
          metric: 'High-Risk Concentration',
          observed: `${row.highRisk} merchants`,
          baseline: '0 merchants',
          severity: row.highRisk > 1 ? 'critical' : 'warning'
        });
      }

      if (row.avgVolume > 0 && row.avgVolume < 72000) {
        signals.push({
          id: `${row.tenant}_volume`,
          tenant: row.tenant,
          metric: 'Average Monthly Volume',
          observed: `$${row.avgVolume.toLocaleString()}`,
          baseline: '$85,000',
          severity: 'info'
        });
      }

      return signals;
    })
    .slice(0, 10);
};

const buildDriverInsights = (
  merchants: PortfolioMerchant[],
  alerts: TriageAlert[],
  recommendations: Recommendation[]
): DriverInsight[] => {
  const downTrendCount = merchants.filter((merchant) => merchant.trend === 'down').length;
  const highRiskCount = merchants.filter((merchant) => merchant.churnRisk === 'High').length;
  const unresolvedCritical = alerts.filter((alert) => alert.severity === 'critical' && alert.status !== 'resolved').length;
  const coveredActions = recommendations.filter((item) => item.confidence >= 75).length;

  return [
    {
      id: 'driver_downtrend',
      title: 'Merchant trend deterioration',
      deltaLabel: `+${downTrendCount}`,
      impact: downTrendCount > 2 ? 'negative' : 'positive',
      rationale: `${downTrendCount} merchants currently show a down trend, driving churn pressure and alert volume.`
    },
    {
      id: 'driver_risk',
      title: 'High-risk concentration',
      deltaLabel: `${highRiskCount} high-risk`,
      impact: highRiskCount > 1 ? 'negative' : 'positive',
      rationale: `${highRiskCount} merchants are high-risk; this is the primary drag on portfolio stability.`
    },
    {
      id: 'driver_critical',
      title: 'Critical alert backlog',
      deltaLabel: `${unresolvedCritical} unresolved`,
      impact: unresolvedCritical > 1 ? 'negative' : 'positive',
      rationale: `${unresolvedCritical} critical alerts remain unresolved and should be escalated within SLA.`
    },
    {
      id: 'driver_coverage',
      title: 'Action coverage quality',
      deltaLabel: `${coveredActions} strong actions`,
      impact: coveredActions > 3 ? 'positive' : 'negative',
      rationale: `${coveredActions} recommendations have confidence 75%+, indicating execution-ready interventions.`
    }
  ];
};

const buildTenantHealth = (merchants: PortfolioMerchant[], alerts: TriageAlert[]): TenantHealth[] => {
  return TENANTS.map((tenant) => {
    const tenantMerchants = merchants.filter((merchant, index) => tenantForMerchant(merchant, index) === tenant);
    const tenantIds = new Set(tenantMerchants.map((merchant) => merchant.id));
    const tenantAlerts = alerts.filter((alert) => alert.merchantId && tenantIds.has(alert.merchantId));
    const highRisk = tenantMerchants.filter((merchant) => merchant.churnRisk === 'High').length;
    const openAlerts = tenantAlerts.filter((alert) => alert.status === 'open').length;
    const triaged = tenantAlerts.filter((alert) => alert.status !== 'open').length;
    const triageRate = tenantAlerts.length === 0 ? 100 : Math.round((triaged / tenantAlerts.length) * 100);
    const avgHealth = tenantMerchants.length === 0
      ? 70
      : Math.round(tenantMerchants.reduce((sum, merchant) => sum + merchant.healthScore, 0) / tenantMerchants.length);
    const stabilityScore = Math.max(30, Math.min(98, avgHealth - highRisk * 6 - openAlerts * 2 + Math.round(triageRate * 0.15)));

    return {
      tenant,
      merchants: tenantMerchants.length,
      highRisk,
      openAlerts,
      triageRate,
      stabilityScore
    };
  });
};

const OverseerControlTower: React.FC = () => {
  const merchants = useMemo(() => SimulationService.generatePortfolio(), []);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('7d');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [alertFilter, setAlertFilter] = useState<AlertState | 'all'>('all');
  const [alerts, setAlerts] = useState<TriageAlert[]>(() => seedAlerts(merchants));
  const [briefingMode, setBriefingMode] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    {
      id: 'seed_audit_1',
      action: 'Control tower sandbox initialized',
      actor: 'system',
      confidence: 92,
      signature: signatureFor('seed_audit_1_control_tower_initialized'),
      timestamp: Date.now() - 1000 * 60 * 9
    }
  ]);
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>([
    {
      id: 'policy_stale_critical',
      name: 'Escalate stale critical alerts',
      enabled: true,
      description: 'Critical alerts due today or earlier are auto-escalated.'
    },
    {
      id: 'policy_assign_owner',
      name: 'Auto-assign unowned alerts',
      enabled: true,
      description: 'Alerts without owner are assigned to Owner Desk.'
    },
    {
      id: 'policy_resolve_info',
      name: 'Auto-resolve low info alerts',
      enabled: false,
      description: 'Info alerts acknowledged for 24h are marked resolved.'
    }
  ]);

  const filteredMerchants = useMemo(() => {
    if (riskFilter === 'high') return merchants.filter((merchant) => merchant.churnRisk === 'High');
    if (riskFilter === 'medium') return merchants.filter((merchant) => merchant.churnRisk === 'Medium');
    return merchants;
  }, [merchants, riskFilter]);

  const filteredAlerts = useMemo(() => {
    const scopedByRisk = alerts.filter((alert) => {
      if (!alert.merchantId || riskFilter === 'all') return true;
      const merchant = merchants.find((item) => item.id === alert.merchantId);
      if (!merchant) return true;
      if (riskFilter === 'high') return merchant.churnRisk === 'High';
      return merchant.churnRisk === 'Medium';
    });

    if (alertFilter === 'all') return scopedByRisk;
    return scopedByRisk.filter((alert) => alert.status === alertFilter);
  }, [alerts, merchants, riskFilter, alertFilter]);

  const recommendations = useMemo(() => buildRecommendations(filteredMerchants), [filteredMerchants]);
  const anomalies = useMemo(() => buildAnomalies(filteredMerchants), [filteredMerchants]);
  const deltas = deltaForWindow(timeWindow);

  const portfolioVolume = filteredMerchants.reduce((sum, merchant) => sum + merchant.monthlyVolume, 0);
  const activeMerchants = filteredMerchants.filter((merchant) => merchant.status === 'Active').length;
  const atRiskCount = filteredMerchants.filter((merchant) => merchant.churnRisk === 'High').length;
  const openAlerts = filteredAlerts.filter((alert) => alert.status === 'open').length;

  const expectedMonthlyRecovery = recommendations.reduce((sum, item) => sum + item.expectedMarginImpact, 0);

  const resolvedCount = alerts.filter((alert) => alert.status === 'resolved').length;
  const triagedCount = alerts.filter((alert) => alert.status === 'acked' || alert.status === 'escalated' || alert.status === 'resolved').length;
  const triageRate = alerts.length === 0 ? 0 : Math.round((triagedCount / alerts.length) * 100);
  const resolutionRate = alerts.length === 0 ? 0 : Math.round((resolvedCount / alerts.length) * 100);
  const tenantHealth = useMemo(() => buildTenantHealth(filteredMerchants, alerts), [filteredMerchants, alerts]);
  const driverInsights = useMemo(
    () => buildDriverInsights(filteredMerchants, alerts, recommendations),
    [filteredMerchants, alerts, recommendations]
  );

  const appendAudit = (action: string, actor = 'owner', confidence = 78): void => {
    const id = `audit_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const entry: AuditEntry = {
      id,
      action,
      actor,
      confidence,
      signature: signatureFor(`${id}_${action}_${actor}`),
      timestamp: Date.now()
    };
    setAuditLog((current) => [entry, ...current].slice(0, 20));
  };

  const updateAlert = (id: string, patch: Partial<TriageAlert>): void => {
    setAlerts((current) => current.map((alert) => (alert.id === id ? { ...alert, ...patch } : alert)));
    if (patch.status) {
      appendAudit(`Alert ${id} moved to ${patch.status}`);
    }
    if (patch.owner) {
      appendAudit(`Alert ${id} owner set to ${patch.owner}`, 'owner', 74);
    }
  };

  const applyPolicies = (): void => {
    const today = new Date().toISOString().slice(0, 10);
    const staleCriticalEnabled = policyRules.find((policy) => policy.id === 'policy_stale_critical')?.enabled;
    const assignOwnerEnabled = policyRules.find((policy) => policy.id === 'policy_assign_owner')?.enabled;
    const resolveInfoEnabled = policyRules.find((policy) => policy.id === 'policy_resolve_info')?.enabled;

    let touched = 0;

    setAlerts((current) =>
      current.map((alert) => {
        let next = { ...alert };

        if (staleCriticalEnabled && next.severity === 'critical' && next.status === 'open' && next.dueDate <= today) {
          next = { ...next, status: 'escalated', owner: next.owner === 'Unassigned' ? 'Executive Escalation' : next.owner };
          touched += 1;
        }

        if (assignOwnerEnabled && (!next.owner || next.owner === 'Unassigned')) {
          next = { ...next, owner: 'Owner Desk' };
          touched += 1;
        }

        if (resolveInfoEnabled && next.severity === 'info' && next.status === 'acked') {
          next = { ...next, status: 'resolved' };
          touched += 1;
        }

        return next;
      })
    );

    appendAudit(`Policy automation executed; ${touched} updates applied`, 'policy-engine', 81);
  };

  useEffect(() => {
    const staleCriticalEnabled = policyRules.find((policy) => policy.id === 'policy_stale_critical')?.enabled;
    if (!staleCriticalEnabled) return;

    const hasStaleCritical = alerts.some(
      (alert) =>
        alert.severity === 'critical' &&
        alert.status === 'open' &&
        alert.dueDate <= new Date().toISOString().slice(0, 10)
    );

    if (hasStaleCritical) {
      appendAudit('Detected stale critical alert pattern', 'anomaly-engine', 87);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, policyRules]);

  const exportBriefing = (): void => {
    const briefing = [
      `ONE82 Overseer Briefing (${new Date().toLocaleString()})`,
      `Window: ${timeWindow}`,
      `Portfolio Volume: $${Math.round(portfolioVolume).toLocaleString()}`,
      `Open Alerts: ${openAlerts}`,
      `Resolution Rate: ${resolutionRate}%`,
      `Expected Monthly Recovery: $${expectedMonthlyRecovery.toLocaleString()}`,
      'Top Drivers:',
      ...driverInsights.slice(0, 3).map((driver) => `- ${driver.title}: ${driver.deltaLabel} (${driver.rationale})`),
      'Top Recommendations:',
      ...recommendations.slice(0, 3).map((item) => `- ${item.merchantName}: ${item.action} | Lift +${item.expectedRetentionLift}% | $${item.expectedMarginImpact}/mo`)
    ].join('\n');

    const blob = new Blob([briefing], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `overseer-briefing-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    appendAudit('Executive briefing exported', 'owner', 90);
  };

  const severityPill = (severity: Severity): string => {
    if (severity === 'critical') return 'bg-red-50 text-red-700';
    if (severity === 'warning') return 'bg-amber-50 text-amber-700';
    return 'bg-indigo-50 text-indigo-700';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-600" />
              Overseer Control Tower (Test)
            </h1>
            <p className="text-sm text-gray-500 mt-1">Global command layer for risk, intervention execution, and measurable outcomes.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5">
            Sandbox Build · Not wired to app routes
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Global Filters</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={timeWindow}
            onChange={(event) => setTimeWindow(event.target.value as TimeWindow)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All risk tiers</option>
            <option value="high">High risk only</option>
            <option value="medium">Medium risk only</option>
          </select>

          <select
            value={alertFilter}
            onChange={(event) => setAlertFilter(event.target.value as AlertState | 'all')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All alert states</option>
            <option value="open">Open</option>
            <option value="acked">Acknowledged</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Portfolio Volume"
          value={`$${Math.round(portfolioVolume).toLocaleString()}`}
          delta={`+${deltas.volume}%`}
          subtitle="Filtered merchant scope"
          icon={<Activity className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="Open Alerts"
          value={openAlerts.toString()}
          delta={`${deltas.alerts}%`}
          subtitle="Needs triage"
          icon={<Bell className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="High-Risk Merchants"
          value={atRiskCount.toString()}
          delta={`${deltas.risk}%`}
          subtitle="Owner focus list"
          icon={<AlertTriangle className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="Active Merchants"
          value={activeMerchants.toString()}
          delta="+1.9%"
          subtitle="Within filter scope"
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-600" />
              Cross-Tenant Anomaly Engine
            </h2>
            <span className="text-xs text-gray-500">{anomalies.length} active signals</span>
          </div>
          <div className="space-y-2">
            {anomalies.map((signal) => (
              <div key={signal.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{signal.tenant} · {signal.metric}</p>
                  <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${severityPill(signal.severity)}`}>
                    {signal.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Observed {signal.observed} vs baseline {signal.baseline}</p>
              </div>
            ))}
            {anomalies.length === 0 && <p className="text-sm text-gray-500">No anomaly signals in this scope.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            Policy Automation
          </h2>
          {policyRules.map((rule) => (
            <label key={rule.id} className="flex items-start gap-2 rounded-lg border border-gray-200 p-2.5 bg-gray-50">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(event) => {
                  setPolicyRules((current) =>
                    current.map((item) =>
                      item.id === rule.id ? { ...item, enabled: event.target.checked } : item
                    )
                  );
                  appendAudit(`${rule.name} ${event.target.checked ? 'enabled' : 'disabled'}`, 'owner', 79);
                }}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
              </div>
            </label>
          ))}
          <button
            onClick={applyPolicies}
            className="w-full rounded-lg bg-gray-900 text-white py-2 text-sm font-semibold hover:bg-gray-800"
          >
            Run Policies Now
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-600" />
            What-Changed Intelligence
          </h2>
          {driverInsights.map((driver) => (
            <div key={driver.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{driver.title}</p>
                <span className={`text-xs font-semibold ${driver.impact === 'positive' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {driver.deltaLabel}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{driver.rationale}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Org Health Map
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 pr-3 text-xs text-gray-500 uppercase">Tenant</th>
                  <th className="py-2 pr-3 text-xs text-gray-500 uppercase">Merchants</th>
                  <th className="py-2 pr-3 text-xs text-gray-500 uppercase">High Risk</th>
                  <th className="py-2 pr-3 text-xs text-gray-500 uppercase">Open Alerts</th>
                  <th className="py-2 pr-3 text-xs text-gray-500 uppercase">Stability</th>
                </tr>
              </thead>
              <tbody>
                {tenantHealth.map((row) => (
                  <tr key={row.tenant} className="border-b border-gray-100">
                    <td className="py-2 pr-3 font-semibold text-gray-900">{row.tenant}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.merchants}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.highRisk}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.openAlerts}</td>
                    <td className="py-2 pr-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.stabilityScore >= 75 ? 'bg-green-50 text-green-700' : row.stabilityScore >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {row.stabilityScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Alert Triage Queue</h2>
            <span className="text-xs text-gray-500">{filteredAlerts.length} alerts</span>
          </div>

          <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                  <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${severityPill(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>

                <p className="text-xs text-gray-500">{alert.detail}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={alert.owner}
                    onChange={(event) => updateAlert(alert.id, { owner: event.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    placeholder="Owner"
                  />
                  <input
                    type="date"
                    value={alert.dueDate}
                    onChange={(event) => updateAlert(alert.id, { dueDate: event.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateAlert(alert.id, { status: 'acked' })}
                    className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => updateAlert(alert.id, { status: 'escalated', owner: alert.owner === 'Unassigned' ? 'Executive Escalation' : alert.owner })}
                    className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    Escalate
                  </button>
                  <button
                    onClick={() => updateAlert(alert.id, { status: 'resolved' })}
                    className="rounded-md border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                  >
                    Resolve
                  </button>
                  <span className="inline-flex items-center text-[11px] text-gray-500 ml-auto">
                    State: <span className="font-semibold text-gray-700 ml-1">{alert.status}</span>
                  </span>
                </div>
              </div>
            ))}

            {filteredAlerts.length === 0 && (
              <div className="p-5 text-sm text-gray-500">No alerts in the selected scope.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Next-Best Actions</h2>
              <span className="text-xs text-gray-500">Expected monthly recovery: ${expectedMonthlyRecovery.toLocaleString()}</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
              {recommendations.map((item) => (
                <div key={item.merchantId} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{item.merchantName}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{item.risk} risk</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.action}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <span className="rounded bg-gray-50 border border-gray-200 px-2 py-1">Lift +{item.expectedRetentionLift}%</span>
                    <span className="rounded bg-gray-50 border border-gray-200 px-2 py-1">${item.expectedMarginImpact}/mo</span>
                    <span className="rounded bg-gray-50 border border-gray-200 px-2 py-1">Conf {item.confidence}%</span>
                  </div>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div className="p-5 text-sm text-gray-500">No recommendations in this filter scope.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Intervention Effectiveness</h2>
            <p className="text-sm text-gray-500">Simple operating memory to verify actions are producing real outcomes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <StatChip icon={<CheckCircle2 className="w-4 h-4 text-green-600" />} label="Triage Rate" value={`${triageRate}%`} />
              <StatChip icon={<CalendarClock className="w-4 h-4 text-indigo-600" />} label="Resolution Rate" value={`${resolutionRate}%`} />
              <StatChip icon={<TrendingUp className="w-4 h-4 text-indigo-600" />} label="Recovery Potential" value={`$${expectedMonthlyRecovery.toLocaleString()}`} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                Executive Briefing Mode
              </h2>
              <button
                onClick={() => {
                  setBriefingMode((current) => !current);
                  appendAudit(`Executive briefing mode ${briefingMode ? 'disabled' : 'enabled'}`, 'owner', 83);
                }}
                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {briefingMode ? 'Hide' : 'Show'} Brief
              </button>
            </div>

            {briefingMode && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <p className="text-sm font-semibold text-gray-900">Owner Weekly Brief</p>
                <p className="text-xs text-gray-600">Window {timeWindow} · open alerts {openAlerts} · resolution rate {resolutionRate}%.</p>
                <p className="text-xs text-gray-600">Top driver: {driverInsights[0]?.title || 'n/a'} ({driverInsights[0]?.deltaLabel || 'n/a'}).</p>
                <p className="text-xs text-gray-600">Recommended focus: execute top 3 actions to target ${recommendations.slice(0, 3).reduce((sum, item) => sum + item.expectedMarginImpact, 0).toLocaleString()}/mo recovery.</p>
                <button
                  onClick={exportBriefing}
                  className="inline-flex items-center gap-1 rounded-md bg-gray-900 text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-800"
                >
                  <Download className="w-3.5 h-3.5" /> Export Briefing
                </button>
              </div>
            )}

            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mt-2">Verifiable Audit Trail</h3>
            <div className="space-y-2 max-h-[170px] overflow-y-auto">
              {auditLog.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-900">{entry.action}</p>
                    <span className="text-[10px] text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                    <span>Actor: {entry.actor} · Confidence {entry.confidence}%</span>
                    <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold"><Fingerprint className="w-3 h-3" />{entry.signature}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          Strategy Snapshot
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Window {timeWindow} · filtered risk {riskFilter} · open interventions with expected improvement indicators.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
          <ArrowUpRight className="w-4 h-4" />
          Target direction: fewer open critical alerts, higher resolution rate, sustained positive margin recovery.
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  delta,
  subtitle,
  icon
}: {
  title: string;
  value: string;
  delta: string;
  subtitle: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{title}</p>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    <div className="flex items-center justify-between mt-1">
      <p className="text-xs text-gray-500">{subtitle}</p>
      <span className="text-xs font-semibold text-emerald-600">{delta}</span>
    </div>
  </div>
);

const StatChip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
    <div className="flex items-center gap-2 text-xs text-gray-500">{icon}{label}</div>
    <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
  </div>
);

export default OverseerControlTower;
