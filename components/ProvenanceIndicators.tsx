import React from 'react';
import { StorageService } from '@/services/storage';

interface ProvenanceBadgesProps {
  showAiGenerated?: boolean;
  size?: 'xs' | 'sm';
  className?: string;
}

interface SourceStatusTextProps {
  className?: string;
}

const modeLabel = (mode: 'backend' | 'demo'): string => {
  if (mode === 'backend') {
    return 'Live (Auth/Trial)';
  }
  return 'Simulated (Demo)';
};

const isSeededDemoTenant = (): boolean => {
  try {
    const user = StorageService.getUser();
    const email = user?.email?.trim().toLowerCase();
    if (email === 'demo-iso@one82.io') return true;
    if (email === 'demo-merchant@one82.io') return true;

    const sessionRaw = localStorage.getItem('one82_auth_session');
    if (!sessionRaw) return false;
    const parsed = JSON.parse(sessionRaw) as { tenantId?: string } | null;
    const tenantId = parsed?.tenantId?.trim();
    return tenantId === 'tenant_demo_iso' || tenantId === 'tenant_demo_merchant';
  } catch {
    return false;
  }
};

export const ProvenanceBadges: React.FC<ProvenanceBadgesProps> = ({
  showAiGenerated = false,
  size = 'xs',
  className = ''
}) => {
  const mode = StorageService.getDataMode();
  const compactLabel = modeLabel(mode);
  const textSize = size === 'sm' ? 'text-xs' : 'text-[10px]';
  const seededDemo = isSeededDemoTenant();

  return (
    <div className={`flex items-center gap-2 font-semibold ${textSize} ${className}`.trim()}>
      {showAiGenerated && (
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">AI-Generated</span>
      )}
      {seededDemo && (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Seeded Demo</span>
      )}
      <span className={`px-2 py-0.5 rounded-full ${mode === 'backend' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
        {compactLabel}
      </span>
    </div>
  );
};

export const SourceStatusText: React.FC<SourceStatusTextProps> = ({ className = '' }) => {
  const mode = StorageService.getDataMode();

  return (
    <p className={className}>
      Source: {modeLabel(mode)}
    </p>
  );
};
