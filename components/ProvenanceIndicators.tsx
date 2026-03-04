import React from 'react';
import { StorageService } from '../services/storage';

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

export const ProvenanceBadges: React.FC<ProvenanceBadgesProps> = ({
  showAiGenerated = false,
  size = 'xs',
  className = ''
}) => {
  const mode = StorageService.getDataMode();
  const compactLabel = modeLabel(mode);
  const textSize = size === 'sm' ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-2 font-semibold ${textSize} ${className}`.trim()}>
      {showAiGenerated && (
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">AI-Generated</span>
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
