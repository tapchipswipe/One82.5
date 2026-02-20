import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp, Eye, EyeOff, Zap } from 'lucide-react';
import {
    INTEGRATIONS,
    IntegrationCategory,
    isIntegrationConnected,
    saveIntegrationKey,
    getIntegrationKey,
} from '../services/integrationsConfig';

const CATEGORIES: IntegrationCategory[] = ['AI', 'POS & Payment', 'ISO Processor'];

const IntegrationCard = ({ integration, onSave }: {
    integration: typeof INTEGRATIONS[0];
    onSave: () => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const [apiKeyValue, setApiKeyValue] = useState(getIntegrationKey(integration.id));
    const [showKey, setShowKey] = useState(false);
    const connected = isIntegrationConnected(integration.id);

    const handleSave = () => {
        saveIntegrationKey(integration.id, apiKeyValue);
        setExpanded(false);
        onSave();
    };

    const handleDisconnect = () => {
        saveIntegrationKey(integration.id, '');
        setApiKeyValue('');
        onSave();
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${connected
            ? 'border-green-200 dark:border-green-900/40 shadow-sm shadow-green-100 dark:shadow-none'
            : 'border-gray-100 dark:border-gray-700'
            }`}>
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className={`w-10 h-10 rounded-xl ${integration.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {integration.logoLetter}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{integration.name}</h3>
                            {connected && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                    <Zap className="w-2.5 h-2.5" /> LIVE
                                </span>
                            )}
                            {integration.sandboxAvailable && !connected && (
                                <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">Sandbox</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-md">{integration.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {connected ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                        <XCircle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                    <a
                        href={integration.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="View API Docs"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                        {connected ? 'Manage' : 'Connect'}
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        API Key / Access Token
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKeyValue}
                                onChange={(e) => setApiKeyValue(e.target.value)}
                                placeholder={`Paste your ${integration.name} API key here...`}
                                className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                            Save & Connect
                        </button>
                        {connected && (
                            <button
                                onClick={handleDisconnect}
                                className="px-4 py-2 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                Disconnect
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                        Key is stored locally in your browser. Never sent to any server except the integration's own API.
                        {integration.sandboxAvailable && ' Sandbox keys supported for development.'}
                    </p>
                </div>
            )}
        </div>
    );
};

const Integrations: React.FC = () => {
    const [, forceUpdate] = useState(0);

    const connectedCount = INTEGRATIONS.filter(i => isIntegrationConnected(i.id)).length;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Zap className="w-6 h-6 text-indigo-600" />
                    Integrations
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Plug in your API keys to go live. Without keys, all data runs in simulation mode.
                </p>
            </div>

            {/* Status Banner */}
            <div className={`rounded-xl p-4 flex items-center justify-between border ${connectedCount > 0
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {connectedCount > 0
                            ? `${connectedCount} integration${connectedCount > 1 ? 's' : ''} connected`
                            : 'Running in simulation mode'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {connectedCount > 0
                            ? 'Live data is now flowing into your dashboard.'
                            : 'The app is fully functional. Connect a key below to switch to live data.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {connectedCount > 0
                        ? <CheckCircle className="w-6 h-6 text-green-500" />
                        : <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" /></span>
                    }
                </div>
            </div>

            {/* Integration Cards by Category */}
            {CATEGORIES.map(category => {
                const items = INTEGRATIONS.filter(i => i.category === category);
                return (
                    <div key={category}>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                            {category}
                        </h3>
                        <div className="space-y-3">
                            {items.map(integration => (
                                <div key={integration.id}>
                                    <IntegrationCard
                                        integration={integration}
                                        onSave={() => forceUpdate(n => n + 1)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Footer note */}
            <div className="text-xs text-gray-400 dark:text-gray-600 text-center pb-4">
                All API keys are stored locally in your browser and are never transmitted to One82 servers.
                Keys are only used to call the respective integration's own API directly.
            </div>
        </div>
    );
};

export default Integrations;
