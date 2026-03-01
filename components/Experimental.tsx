import React, { useMemo, useState } from 'react';
import { BrainCircuit, ChevronLeft, DollarSign, FlaskConical, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { UserRole } from '../types';
import { ProvenanceBadges, SourceStatusText } from './ProvenanceIndicators';
import { PortfolioMerchant, SimulationService } from '../services/simulationService';
import SharedActionPlansDemo from './experimental/SharedActionPlansDemo';

interface ExperimentalProps {
  role: UserRole;
}

type PlaybookStatus = 'suggested' | 'approved' | 'executed';

interface RescueAction {
  merchantId: string;
  playbook: string;
  confidence: number;
  status: PlaybookStatus;
}

interface AuditRecord {
  id: string;
  action: string;
  timestamp: number;
  source: string;
  confidence: number;
  status: 'signed' | 'pending';
}

type FeatureId = 'merchant-rescue' | 'action-plans' | 'outcome-simulator' | 'verifiable-ai';

interface CommitNarrative {
  title: string;
  merchantLabel: string;
  recoveredMonthly: number;
  confidenceBefore: number;
  confidenceAfter: number;
  riskBefore: number;
  riskAfter: number;
  summary: string;
}

interface FeatureCard {
  id: FeatureId;
  title: string;
  summary: string;
  stage: 'Experimental' | 'Preview';
  audience: Array<'iso' | 'merchant'>;
}

const stageStyles: Record<FeatureCard['stage'], string> = {
  Experimental: 'bg-amber-100 text-amber-700',
  Preview: 'bg-indigo-100 text-indigo-700'
};

const featureCards: FeatureCard[] = [
  {
    id: 'merchant-rescue',
    title: 'Autonomous Merchant Rescue',
    summary: 'Detect, approve, and execute retention playbooks for at-risk merchants in one workflow.',
    stage: 'Experimental',
    audience: ['iso']
  },
  {
    id: 'action-plans',
    title: 'Shared Action Plans',
    summary: 'Create and track collaborative action items across ISO and merchant workflows.',
    stage: 'Experimental',
    audience: ['iso', 'merchant']
  },
  {
    id: 'outcome-simulator',
    title: 'Outcome-Learning Simulator',
    summary: 'Run what-if decisions with confidence scoring and a measurable learning loop over time.',
    stage: 'Preview',
    audience: ['iso', 'merchant']
  },
  {
    id: 'verifiable-ai',
    title: 'Verifiable AI Trust Layer',
    summary: 'Track every AI-assisted decision with confidence, lineage, and signed audit records.',
    stage: 'Preview',
    audience: ['iso', 'merchant']
  }
];

const buildRescueQueue = (merchants: PortfolioMerchant[]): RescueAction[] => {
  return merchants
    .filter(merchant => merchant.churnRisk !== 'Low')
    .map(merchant => {
      const riskWeight = merchant.churnRisk === 'High' ? 28 : 14;
      const trendWeight = merchant.trend === 'down' ? 12 : 4;
      const confidence = Math.min(96, Math.max(58, 100 - merchant.healthScore + riskWeight + trendWeight));

      return {
        merchantId: merchant.id,
        playbook:
          merchant.trend === 'down'
            ? 'Retention outreach + pricing review + 7-day follow-up'
            : 'Engagement check-in + value reinforcement sequence',
        confidence,
        status: 'suggested' as PlaybookStatus
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
};

const Experimental: React.FC<ExperimentalProps> = ({ role }) => {
  const merchants = useMemo(() => SimulationService.generatePortfolio(), []);
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);

  const rescueQueue = useMemo(() => buildRescueQueue(merchants), [merchants]);
  const [rescueActions, setRescueActions] = useState<Record<string, RescueAction>>(
    Object.fromEntries(rescueQueue.map(action => [action.merchantId, action]))
  );

  const [priceChange, setPriceChange] = useState(3);
  const [coverage, setCoverage] = useState(55);
  const [latestNarrative, setLatestNarrative] = useState<CommitNarrative | null>(null);
  const [learningRuns, setLearningRuns] = useState(0);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([
    {
      id: 'seed-1',
      action: 'Autonomous Merchant Rescue plan generated',
      timestamp: Date.now() - 1000 * 60 * 12,
      source: 'TXN trend + attrition pattern + rep activity',
      confidence: 82,
      status: 'signed'
    }
  ]);

  const showIsoSection = role === 'iso';
  const showMerchantSection = role === 'merchant';
  const visibleCards = useMemo(() => {
    if (role !== 'iso' && role !== 'merchant') {
      return [];
    }
    return featureCards.filter(card => card.audience.includes(role));
  }, [role]);

  const updateRescueStatus = (merchantId: string, status: PlaybookStatus) => {
    setRescueActions(prev => {
      const existing = prev[merchantId];
      if (!existing) {
        return prev;
      }

      return {
        ...prev,
        [merchantId]: {
          ...existing,
          status
        }
      };
    });

    const statusLabel = status === 'approved' ? 'approved for execution' : 'executed';
    const merchantName = merchants.find(merchant => merchant.id === merchantId)?.name || 'Merchant';
    const confidence = rescueActions[merchantId]?.confidence || 70;

    setAuditRecords(prev => [
      {
        id: `${merchantId}-${status}-${Date.now()}`,
        action: `Rescue playbook ${statusLabel} for ${merchantName}`,
        timestamp: Date.now(),
        source: 'Risk score + volume trend + account history',
        confidence,
        status: 'signed'
      },
      ...prev
    ]);
  };

  const simulationResult = useMemo(() => {
    const baseResidual = merchants.reduce((acc, merchant) => acc + merchant.monthlyVolume * (merchant.bps / 10000), 0);
    const retentionLift = coverage * 0.12 + Math.max(0, priceChange) * 0.8;
    const riskDelta = Math.max(-15, Math.round((coverage - 50) / 4 - Math.max(0, priceChange - 6) * 1.3));
    const projectedResidual = baseResidual * (1 + (retentionLift / 100));
    const confidence = Math.min(95, 68 + learningRuns * 4);

    return {
      baseResidual,
      projectedResidual,
      retentionLift,
      riskDelta,
      confidence
    };
  }, [coverage, learningRuns, merchants, priceChange]);

  const commitSimulation = () => {
    const nextLearningRuns = learningRuns + 1;
    setLearningRuns(nextLearningRuns);

    const confidenceBefore = simulationResult.confidence;
    const confidenceAfter = Math.min(95, 68 + nextLearningRuns * 4);
    const riskBase = 58;
    const riskReduction = Math.max(1, Math.round(coverage / 15 + Math.max(0, priceChange) / 2));
    const riskAfter = Math.max(12, riskBase - riskReduction);

    const recoveredMonthly = Math.round((simulationResult.projectedResidual - simulationResult.baseResidual) * 0.22);
    const merchantLabel = 'Portfolio scenario';

    setLatestNarrative({
      title: `Learning Run ${nextLearningRuns} committed`,
      merchantLabel,
      recoveredMonthly,
      confidenceBefore,
      confidenceAfter,
      riskBefore: riskBase,
      riskAfter,
      summary: 'Portfolio baseline improved from this committed intervention profile.'
    });

    setAuditRecords(prev => [
      {
        id: `sim-${Date.now()}`,
        action: `Simulation committed: ${priceChange}% price move, ${coverage}% outreach coverage`,
        timestamp: Date.now(),
        source: 'Scenario engine + portfolio trend baseline',
        confidence: simulationResult.confidence,
        status: 'pending'
      },
      ...prev
    ]);
  };

  const iconForFeature = (featureId: FeatureId) => {
    if (featureId === 'merchant-rescue') return <Zap className="w-4 h-4 text-indigo-600" />;
    if (featureId === 'action-plans') return <DollarSign className="w-4 h-4 text-indigo-600" />;
    if (featureId === 'outcome-simulator') return <BrainCircuit className="w-4 h-4 text-indigo-600" />;
    return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
  };

  const featureTitle = activeFeature ? featureCards.find(card => card.id === activeFeature)?.title : null;

  const renderFeaturePage = () => {
    if (activeFeature === 'merchant-rescue') {
      return (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Autonomous Merchant Rescue</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">Experimental</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">At-risk merchants are ranked by save confidence, then moved through Suggested → Approved → Executed.</p>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {rescueQueue.slice(0, 3).map(queueItem => {
              const merchant = merchants.find(item => item.id === queueItem.merchantId);
              const action = rescueActions[queueItem.merchantId] || queueItem;
              if (!merchant) {
                return null;
              }

              return (
                <div key={queueItem.merchantId} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">{merchant.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{merchant.businessType} · Health {merchant.healthScore}</p>
                  <p className="text-xs text-gray-500 mt-2">{action.playbook}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-600">Confidence {action.confidence}%</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      action.status === 'suggested'
                        ? 'bg-gray-200 text-gray-700'
                        : action.status === 'approved'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-green-100 text-green-700'
                    }`}>
                      {action.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={action.status !== 'suggested'}
                      onClick={() => updateRescueStatus(queueItem.merchantId, 'approved')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      disabled={action.status === 'suggested' || action.status === 'executed'}
                      onClick={() => updateRescueStatus(queueItem.merchantId, 'executed')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white disabled:opacity-40"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (activeFeature === 'action-plans') {
      return (
        <SharedActionPlansDemo role={role} />
      );
    }

    if (activeFeature === 'outcome-simulator') {
      return (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Outcome-Learning Simulator</h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">Preview</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Adjust levers and watch projected residual, risk change, and model confidence update.</p>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">Pricing move ({priceChange}%)</label>
                <input
                  type="range"
                  min={-5}
                  max={12}
                  value={priceChange}
                  onChange={(event) => setPriceChange(Number(event.target.value))}
                  className="w-full mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Outreach coverage ({coverage}%)</label>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={coverage}
                  onChange={(event) => setCoverage(Number(event.target.value))}
                  className="w-full mt-2"
                />
              </div>
              <button
                onClick={commitSimulation}
                className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold"
              >
                Commit to learning loop
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
              <p className="text-sm text-gray-700">Base residual: <span className="font-semibold">${Math.round(simulationResult.baseResidual).toLocaleString()}/mo</span></p>
              <p className="text-sm text-gray-700">Projected residual: <span className="font-semibold">${Math.round(simulationResult.projectedResidual).toLocaleString()}/mo</span></p>
              <p className="text-sm text-gray-700">Retention lift: <span className="font-semibold">+{simulationResult.retentionLift.toFixed(1)}%</span></p>
              <p className="text-sm text-gray-700">Risk delta: <span className={`font-semibold ${simulationResult.riskDelta <= 0 ? 'text-green-700' : 'text-red-700'}`}>{simulationResult.riskDelta}%</span></p>
              <p className="text-sm text-gray-700">Model confidence: <span className="font-semibold">{simulationResult.confidence}%</span></p>
              <p className="text-xs text-gray-500 pt-1">Learning runs completed: {learningRuns}</p>
            </div>
          </div>

          {latestNarrative && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-800">{latestNarrative.title}</p>
              <p className="text-sm text-green-700 mt-1">{latestNarrative.summary}</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-green-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Merchant Impact</p>
                  <p className="font-semibold text-gray-900 mt-1">{latestNarrative.merchantLabel}</p>
                  <p className="text-xs text-gray-600 mt-1">Estimated recovery: <span className="font-semibold text-green-700">${latestNarrative.recoveredMonthly.toLocaleString()}/mo</span></p>
                </div>
                <div className="rounded-lg border border-green-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Model Confidence</p>
                  <p className="font-semibold text-gray-900 mt-1">{latestNarrative.confidenceBefore}% → {latestNarrative.confidenceAfter}%</p>
                  <p className="text-xs text-gray-600 mt-1">Improvement from committed feedback loop.</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Risk Movement</p>
                  <p className="font-semibold text-gray-900 mt-1">{latestNarrative.riskBefore} → {latestNarrative.riskAfter}</p>
                  <p className="text-xs text-gray-600 mt-1">Lower score indicates reduced risk pressure.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      );
    }

    return (
      <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Verifiable AI Trust Layer</h2>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">Preview</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">Every approval, execution, and simulation commit is recorded with lineage and confidence.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2 pr-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="py-2 pr-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
                <th className="py-2 pr-3 text-xs font-semibold text-gray-500 uppercase">Confidence</th>
                <th className="py-2 pr-3 text-xs font-semibold text-gray-500 uppercase">Signature</th>
                <th className="py-2 pr-3 text-xs font-semibold text-gray-500 uppercase">When</th>
              </tr>
            </thead>
            <tbody>
              {auditRecords.slice(0, 8).map(record => (
                <tr key={record.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3 text-gray-800">{record.action}</td>
                  <td className="py-2 pr-3 text-gray-600">{record.source}</td>
                  <td className="py-2 pr-3 text-gray-700">{record.confidence}%</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${record.status === 'signed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-500 text-xs">{new Date(record.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              Experimental Lab
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Early Features</h1>
            <p className="text-sm text-gray-600 mt-1">
              Click a feature card to open its dedicated demo page.
            </p>
          </div>
          <div className="space-y-1 text-right">
            <ProvenanceBadges showAiGenerated size="sm" className="justify-end" />
            <SourceStatusText className="text-xs text-gray-500" />
          </div>
        </div>
      </section>

      {!activeFeature && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleCards.map(card => (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveFeature(card.id)}
              className="text-left bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {iconForFeature(card.id)}
                  <h2 className="font-semibold text-gray-900">{card.title}</h2>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${stageStyles[card.stage]}`}>
                  {card.stage}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{card.summary}</p>
              <p className="text-xs text-indigo-700 font-semibold mt-3">Open dedicated demo →</p>
            </button>
          ))}
        </section>
      )}

      {activeFeature && (
        <>
          <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveFeature(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Experimental Dashboard
            </button>
            <p className="text-xs text-gray-500 mt-1">{featureTitle}</p>
          </section>
          {renderFeaturePage()}
        </>
      )}

      {!activeFeature && (
        <section className="bg-gray-900 text-white rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-300" /> What this demo proves
          </h3>
          <ul className="mt-3 text-sm text-gray-300 space-y-2">
            <li>Autonomous systems can move from signal detection to approved execution in one workflow.</li>
            <li>Shared action plans keep ISO and merchant execution aligned and trackable.</li>
            <li>Simulations can become a self-learning loop with confidence tracking and verifiable decision logs.</li>
          </ul>
        </section>
      )}

      {showIsoSection && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900">ISO focus</h3>
          <p className="text-sm text-gray-600 mt-2">
            ISO experiments prioritize portfolio retention, risk containment, and rep workflow acceleration.
          </p>
        </section>
      )}

      {showMerchantSection && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900">Merchant focus</h3>
          <p className="text-sm text-gray-600 mt-2">
            Merchant demos currently include shared action plans, the outcome simulator, and AI trust audit trail.
          </p>
        </section>
      )}
    </div>
  );
};

export default Experimental;
