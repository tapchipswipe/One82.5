import React from 'react';
import {
  BRAND_COLORS,
  SEMANTIC_COLORS,
  PRIMARY_COLORS,
  TEXT_COLORS,
  TYPOGRAPHY,
  LAYOUT,
  MOTION,
  SHADOWS,
  BRAND_META,
} from '../brand';
import { Zap } from 'lucide-react';

// ─── Small helpers ────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4">{title}</h3>
    {children}
  </div>
);

const ColorSwatch: React.FC<{ label: string; hex: string }> = ({ label, hex }) => (
  <div className="flex flex-col gap-1.5">
    <div
      className="w-full h-14 rounded-xl border border-white/10 shadow-sm"
      style={{ backgroundColor: hex }}
    />
    <p className="text-xs font-semibold text-white">{label}</p>
    <p className="text-[10px] font-mono text-gray-500">{hex}</p>
  </div>
);

const TokenRow: React.FC<{ name: string; value: string }> = ({ name, value }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
    <code className="text-xs font-mono text-indigo-400">{name}</code>
    <span className="text-xs text-gray-400 font-mono">{value}</span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────

const BrandGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">

      {/* Hero */}
      <div className="flex items-center gap-4 pt-2">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/40">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{BRAND_META.name} Brand Guide</h2>
          <p className="text-sm text-gray-400 mt-0.5">{BRAND_META.tagline}</p>
        </div>
      </div>

      {/* Background scale */}
      <Section title="Background Scale">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {(Object.entries(BRAND_COLORS) as [string, string][]).map(([key, hex]) => (
            <ColorSwatch key={key} label={key} hex={hex} />
          ))}
        </div>
      </Section>

      {/* Semantic colors */}
      <Section title="Semantic Colors">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(Object.entries(SEMANTIC_COLORS) as [string, string][]).map(([key, hex]) => (
            <ColorSwatch key={key} label={key} hex={hex} />
          ))}
        </div>
      </Section>

      {/* Primary accent scale */}
      <Section title={`Primary Accent — ${BRAND_META.accentColorName} (default, user-selectable)`}>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-3">
          {(Object.entries(PRIMARY_COLORS) as [string, string][]).map(([shade, hex]) => (
            <ColorSwatch key={shade} label={shade} hex={hex} />
          ))}
        </div>
      </Section>

      {/* Text colors */}
      <Section title="Text Colors">
        <div className="bg-[#0f0f1a] rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          {(Object.entries(TEXT_COLORS) as [string, string][]).map(([key, hex]) => (
            <div key={key} className="flex items-center gap-4 px-5 py-3">
              <div className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0" style={{ backgroundColor: hex }} />
              <code className="text-xs font-mono text-indigo-400 w-24">{key}</code>
              <span className="text-sm flex-1" style={{ color: hex }}>
                The quick brown fox — {key}
              </span>
              <span className="text-[10px] font-mono text-gray-600">{hex}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="bg-[#0f0f1a] rounded-xl border border-white/5 p-6 space-y-6">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Sans — UI & Body</p>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: TYPOGRAPHY.fontSans }}>
              One82 Intelligence Platform
            </p>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: TYPOGRAPHY.fontSans }}>
              Real-time portfolio analytics, AI-powered statement analysis, and per-rep
              profitability — all in one platform.
            </p>
            <p className="text-[10px] font-mono text-gray-600 mt-2">{TYPOGRAPHY.fontSans}</p>
          </div>
          <hr className="border-white/5" />
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Mono — Financial Data</p>
            <p
              className="text-3xl font-bold text-white tabular-nums"
              style={{ fontFamily: TYPOGRAPHY.fontMono }}
            >
              $2,847,391.50
            </p>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: TYPOGRAPHY.fontMono }}>
              +14.2% MoM · 1,204 txns · 0.32% blended rate
            </p>
            <p className="text-[10px] font-mono text-gray-600 mt-2">{TYPOGRAPHY.fontMono}</p>
          </div>
        </div>
      </Section>

      {/* Components */}
      <Section title="Component Patterns">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Buttons */}
          <div className="bg-[#0f0f1a] rounded-xl border border-white/5 p-5 space-y-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Buttons</p>
            <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-indigo-600/25">
              Primary Action
            </button>
            <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all text-sm">
              Secondary Action
            </button>
            <button className="w-full py-2.5 border border-white/10 hover:border-indigo-500/50 text-gray-400 hover:text-white font-medium rounded-xl transition-all text-sm">
              Ghost Action
            </button>
          </div>

          {/* Status badges */}
          <div className="bg-[#0f0f1a] rounded-xl border border-white/5 p-5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Status Badges</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 text-xs font-semibold">Growing</span>
              <span className="px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 text-xs font-semibold">Stable</span>
              <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 text-xs font-semibold">At Risk</span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">ISO</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10 text-xs font-semibold">Pending</span>
            </div>
          </div>

          {/* Stat card */}
          <div className="bg-[#0f0f1a] rounded-xl border border-white/5 p-5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Stat Card</p>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Monthly Revenue</p>
              <p className="text-3xl font-bold text-white tabular-nums" style={{ fontFamily: TYPOGRAPHY.fontMono }}>
                $84,320
              </p>
              <p className="text-xs text-green-400 font-semibold">↑ +12.4% vs last month</p>
            </div>
          </div>

          {/* Input */}
          <div className="bg-[#0f0f1a] rounded-xl border border-white/5 p-5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Form Input</p>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Merchant Name
            </label>
            <input
              type="text"
              placeholder="e.g. Joe's Pizza"
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </Section>

      {/* Layout tokens */}
      <Section title="Layout Tokens">
        <div className="bg-[#0f0f1a] rounded-xl border border-white/5 px-5 py-2">
          {(Object.entries(LAYOUT) as [string, string][]).map(([key, val]) => (
            <TokenRow key={key} name={key} value={val} />
          ))}
        </div>
      </Section>

      {/* Motion tokens */}
      <Section title="Motion Tokens">
        <div className="bg-[#0f0f1a] rounded-xl border border-white/5 px-5 py-2">
          {(Object.entries(MOTION) as [string, string][]).map(([key, val]) => (
            <TokenRow key={key} name={key} value={val} />
          ))}
        </div>
      </Section>

      {/* Shadow tokens */}
      <Section title="Shadow & Glow Presets">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(SHADOWS) as [string, string][]).map(([key, val]) => (
            <div
              key={key}
              className="bg-[#0f0f1a] rounded-xl border border-white/5 p-5 flex flex-col gap-3"
              style={{ boxShadow: val }}
            >
              <code className="text-xs font-mono text-indigo-400">{key}</code>
              <p className="text-[10px] font-mono text-gray-600 break-all">{val}</p>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
};

export default BrandGuide;
